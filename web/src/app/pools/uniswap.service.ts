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

        return 0;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        return 0;
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
