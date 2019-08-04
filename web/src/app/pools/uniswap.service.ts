import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {ethers} from 'ethers';
import {ConfigurationService} from '../configuration.service';

declare let require: any;
const UNISWAP_ABI = require('../abi/Uniswap.json');
const UNISWAP_VIEW_ABI = require('../abi/UniswapView.json');
const UNISWAP_FACTORY_ABI = require('../abi/UniswapFactory.json');

function bnsqrt(a: BigNumber): BigNumber {
    return ethers.utils.bigNumberify(
        Math.floor(
            Math.sqrt(
                Number(a.toString())
            )
        )
    );
}

@Injectable({
    providedIn: 'root'
})
export class UniswapService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service,
        protected configurationService: ConfigurationService
    ) {
    }

    async getExchangeAddress(tokenAddress: string) {

        const factory = new ethers.Contract(
            this.configurationService.UNISWAP_FACTORY_CONTRACT_ADDRESS,
            UNISWAP_FACTORY_ABI,
            this.web3Service.provider
        );

        return await factory.getExchange(tokenAddress);
    }

    async getBalance(tokenAddress: string, walletAddress: string): Promise<BigNumber> {

        return this.tokenService.getTokenBalanceByAddress(
            await this.getExchangeAddress(tokenAddress),
            walletAddress
        );
    }

    async getFormatedBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        return this.tokenService.formatAsset(
            tokenSymbol,
            await this.getBalance(tokenSymbol, walletAddress)
        );
    }

    async getTokensBalance(tokenAddress: string, walletAddress: string) {

        const exchange = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_VIEW_ABI,
            this.web3Service.provider
        );

        return exchange.removeLiquidity(
            await this.getBalance(tokenAddress, walletAddress),
            1,
            1,
            Math.ceil(Date.now() / 1000) + 60 * 15,
            {
                from: walletAddress
            }
        );
    }

    async getFormatedTokensBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        const tokensBalance = await this.getTokensBalance(
            this.tokenService.tokens[tokenSymbol].address,
            walletAddress
        );

        const ethAmount = tokensBalance[0];
        const tokenAmount = tokensBalance[1];

        let ethFormatedAmount = this.tokenService.formatAsset(
            'ETH',
            ethAmount
        );

        ethFormatedAmount = this.toFixed(ethFormatedAmount, 6);

        let tokenFormatedAmount = this.tokenService.formatAsset(
            tokenSymbol,
            tokenAmount
        );

        tokenFormatedAmount = this.toFixed(tokenFormatedAmount, 6);

        return ethFormatedAmount + ' ETH ' + '\n' + tokenFormatedAmount + ' ' + tokenSymbol;
    }

    toFixed(num, fixed) {
        const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    async interest(tokenAddress: string): Promise<number> {

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            this.web3Service.provider
        );

        const delta = 20000;
        const currentBlock = await this.web3Service.provider.getBlockNumber();
        const rawResult = await this.web3Service.provider.getLogs({
            address: contract.address,
            fromBlock: currentBlock - delta,
            toBlock: currentBlock,
            topics: [
                [
                    contract.filters.AddLiquidity().topics[0],
                    contract.filters.RemoveLiquidity().topics[0],
                    contract.filters.EthPurchase().topics[0],
                    contract.filters.TokenPurchase().topics[0],
                ]
            ]
        });

        const oldBlock = await this.web3Service.provider.getBlock(currentBlock - delta);
        const newBlock = await this.web3Service.provider.getBlock(currentBlock);
        const duration = newBlock.timestamp - oldBlock.timestamp;

        const results = rawResult.map(res => contract.interface.parseLog(res));

        let currentEthBalance = await this.web3Service.provider.getBalance(contract.address);
        let currentTknBalance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, contract.address);
        let feePercent = ethers.utils.bigNumberify(0);

        for (let i = results.length - 1; i > 0; i--) {

            if (results[i].topic === contract.filters.AddLiquidity().topics[0]) {

                currentEthBalance = currentEthBalance.sub(results[i].values.eth_amount);
                currentTknBalance = currentTknBalance.sub(results[i].values.token_amount);
            }

            if (results[i].topic === contract.filters.RemoveLiquidity().topics[0]) {

                currentEthBalance = currentEthBalance.add(results[i].values.eth_amount);
                currentTknBalance = currentTknBalance.add(results[i].values.token_amount);
            }

            if (results[i].topic === contract.filters.EthPurchase().topics[0]) {

                const invariant = currentEthBalance.mul(currentTknBalance);
                currentEthBalance = currentEthBalance.add(results[i].values.eth_bought);
                currentTknBalance = currentTknBalance.sub(results[i].values.tokens_sold);
                const fee = invariant.sub(currentEthBalance.mul(currentTknBalance));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }

            if (results[i].topic === contract.filters.TokenPurchase().topics[0]) {

                const invariant = currentEthBalance.mul(currentTknBalance);
                currentEthBalance = currentEthBalance.sub(results[i].values.eth_sold);
                currentTknBalance = currentTknBalance.add(results[i].values.tokens_bought);
                const fee = invariant.sub(currentEthBalance.mul(currentTknBalance));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }
        }

        return feePercent.mul(365 * 24 * 60 * 60).div(duration).mul(10000).div(1e9).div(1e9).toNumber() / 100;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        const exchangeAddress = await this.getExchangeAddress(tokenAddress);
        const interest = await this.interest(tokenAddress);

        const balance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, exchangeAddress);

        return balance.mul(Math.floor(interest * 100)).div(balance.add(amount)).toNumber() / 100 - interest;
    }

    async deposit(tokenAddress: string, amount: BigNumber) {

        const web3Provider = new ethers.providers.Web3Provider(
            this.web3Service.txProvider.currentProvider
        );

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            web3Provider.getSigner()
        );

        await contract.addLiquidity(
            1,
            ethers.utils.bigNumberify(1).pow(255),
            Math.ceil(Date.now() / 1000) + 60 * 15,
            {value: amount}
        );
    }

    async withdraw(tokenAddress: string, walletAddress: string) {

        const web3Provider = new ethers.providers.Web3Provider(
            this.web3Service.txProvider.currentProvider
        );

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            web3Provider.getSigner()
        );

        await contract.removeLiquidity(
            await this.getBalance(tokenAddress, walletAddress),
            0,
            0,
            Math.ceil(Date.now() / 1000) + 60 * 15
        );
    }
}
