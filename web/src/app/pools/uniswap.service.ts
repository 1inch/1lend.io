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
