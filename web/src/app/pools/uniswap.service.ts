import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {ethers} from 'ethers';
import {ConfigurationService} from '../configuration.service';

declare let require: any;
const UNISWAP_ABI = require('../abi/Uniswap.json');
const UNISWAP_FACTORY_ABI = require('../abi/UniswapFactory.json');

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

    async interest(tokenAddress: string): Promise<number> {

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            this.web3Service.provider
        );

        const currentBlock = await this.web3Service.provider.getBlockNumber();
        const rawResult = await this.web3Service.provider.getLogs({
            address: contract.address,
            fromBlock: currentBlock - 10000,
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

        const oldBlock = await this.web3Service.provider.getBlock(currentBlock - 10000);
        const newBlock = await this.web3Service.provider.getBlock(currentBlock);
        const duration = newBlock.timestamp - oldBlock.timestamp;

        const results = rawResult.map(res => contract.interface.parseLog(res));

        let currentEthBalance = await this.web3Service.provider.getBalance(contract.address);
        let currentTknBalance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, contract.address);
        let feePercent = ethers.utils.bigNumberify(0);

        for (let i = results.length - 1; i > 0; i--) {

            if (results[i].topic == contract.filters.AddLiquidity().topics[0]) {
                currentEthBalance = currentEthBalance.sub(results[i].values.eth_amount);
                currentTknBalance = currentTknBalance.sub(results[i].values.token_amount);
            }

            if (results[i].topic == contract.filters.RemoveLiquidity().topics[0]) {
                currentEthBalance = currentEthBalance.add(results[i].values.eth_amount);
                currentTknBalance = currentTknBalance.add(results[i].values.token_amount);
            }

            if (results[i].topic == contract.filters.EthPurchase().topics[0]) {
                const invariant = currentEthBalance.mul(currentTknBalance);
                currentEthBalance = currentEthBalance.add(results[i].values.eth_bought);
                currentTknBalance = currentTknBalance.sub(results[i].values.tokens_sold);
                const fee = invariant.sub(currentEthBalance.mul(currentTknBalance));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }

            if (results[i].topic == contract.filters.TokenPurchase().topics[0]) {
                const invariant = currentEthBalance.mul(currentTknBalance);
                currentEthBalance = currentEthBalance.sub(results[i].values.eth_sold);
                currentTknBalance = currentTknBalance.add(results[i].values.tokens_bought);
                const fee = invariant.sub(currentEthBalance.mul(currentTknBalance));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }
        }

        return feePercent.mul(365*24*60*60).div(duration).mul(10000).div(1e9).div(1e9).toNumber() / 100;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        const exchangeAddress = await this.getExchangeAddress(tokenAddress);
        const interest = await this.interest(tokenAddress);

        const balance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, exchangeAddress);

        return balance.mul(Math.floor(interest * 100)).div(balance.add(amount)).toNumber() / 100 - interest;
    }

    async deposit(tokenAddress: string, amount: BigNumber) {

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            this.web3Service.txProvider
        );

        await contract.addLiquidity(1, ethers.utils.bigNumberify(1).pow(255), 1000000000, {value: amount});
    }

    async withdraw(tokenAddress: string, amount: BigNumber) {

        const contract = new ethers.Contract(
            await this.getExchangeAddress(tokenAddress),
            UNISWAP_ABI,
            this.web3Service.txProvider
        );

        await contract.removeLiquidity(amount, 0, 0, 1000000000);
    }
}
