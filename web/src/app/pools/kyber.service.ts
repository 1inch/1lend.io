import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {ethers} from 'ethers';
import {ConfigurationService} from '../configuration.service';

declare let require: any;
const KYBER_ABI = require('../abi/Kyber.json');

const ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

@Injectable({
    providedIn: 'root'
})
export class KyberService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service,
        protected configurationService: ConfigurationService
    ) {
    }

    async getBalance(tokenAddress: string, walletAddress: string): Promise<BigNumber> {

        return ethers.utils.bigNumberify(0);
    }

    async getFormatedBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        return this.tokenService.formatAsset(
            tokenSymbol,
            await this.getBalance(tokenSymbol, walletAddress)
        );
    }

    async getTokensBalance(tokenAddress: string, walletAddress: string) {

        return [
            ethers.utils.bigNumberify(0),
            ethers.utils.bigNumberify(0)
        ];
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
            '0x0000000000000000000000000000000000000000',
            KYBER_ABI,
            this.web3Service.provider
        );

        const currentBlock = await this.web3Service.provider.getBlockNumber();
        const rawResult = await this.web3Service.provider.getLogs({
            address: null,
            fromBlock: currentBlock - 10000,
            toBlock: currentBlock,
            topics: [
                contract.filters.TradeExecute().topics[0],
            ]
        });

        const oldBlock = await this.web3Service.provider.getBlock(currentBlock - 10000);
        const newBlock = await this.web3Service.provider.getBlock(currentBlock);
        const duration = newBlock.timestamp - oldBlock.timestamp;

        const results = rawResult.map(res => contract.interface.parseLog(res));
        const allContracts = results
            .map(result => result.address)
            .filters((value, index, self) => self.indexOf(value) === index);

        const totalSum = allContracts
            .map(addr => this.tokenService.getTokenBalanceByAddress(tokenAddress, addr))
            .reduce((a, b) => a.add(b), ethers.utils.bigNumberify(0));

        //

        const currentEthBalances: Array<BigNumber> = await Promise.all(
            allContracts.map(c => this.web3Service.provider.getBalance(c))
        );
        const currentTknBalances: Array<BigNumber> = await Promise.all(
            allContracts.map(c => this.tokenService.getTokenBalanceByAddress(tokenAddress, c))
        );
        let feePercent = ethers.utils.bigNumberify(0);

        // event TradeExecute(
        //     address indexed origin,
        //     address src,
        //     uint srcAmount,
        //     address destToken,
        //     uint destAmount,
        //     address destAddress
        // );

        for (let i = results.length - 1; i > 0; i--) {

            const j = allContracts.indexOf(results[i].address);

            if (results[i].values.src == tokenAddress &&
                results[i].values.destToken === ETH_TOKEN_ADDRESS) {
                const invariant = currentEthBalances[j].mul(currentTknBalances[j]);
                currentEthBalances[j] = currentEthBalances[j].add(results[i].values.destAmount);
                currentTknBalances[j] = currentTknBalances[j].sub(results[i].values.srcAmount);
                const fee = invariant.sub(currentEthBalances[j].mul(currentTknBalances[j]));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }

            if (results[i].values.src === ETH_TOKEN_ADDRESS &&
                results[i].values.destToken === tokenAddress) {
                const invariant = currentEthBalances[j].mul(currentTknBalances[j]);
                currentEthBalances[j] = currentEthBalances[j].sub(results[i].values.srcAmount);
                currentTknBalances[j] = currentTknBalances[j].add(results[i].values.destAmount);
                const fee = invariant.sub(currentEthBalances[j].mul(currentTknBalances[j]));
                feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(invariant));
            }
        }

        return feePercent.mul(365 * 24 * 60 * 60).div(duration).mul(10000).div(1e9).div(1e9).toNumber() / 100;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        // const exchangeAddress = await this.getExchangeAddress(tokenAddress);
        // const interest = await this.interest(tokenAddress);

        // const balance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, exchangeAddress);

        // return balance.mul(Math.floor(interest * 100)).div(balance.add(amount)).toNumber() / 100 - interest;
        return 0;
    }

    async deposit(tokenAddress: string, amount: BigNumber) {

        // const contract = new ethers.Contract(
        //     await this.getExchangeAddress(tokenAddress),
        //     UNISWAP_ABI,
        //     this.web3Service.txProvider
        // );

        // await contract.addLiquidity(1, ethers.utils.bigNumberify(1).pow(255), 1000000000, {value: amount});
    }

    async withdraw(tokenAddress: string, walletAddress: string) {
        
    }
}
