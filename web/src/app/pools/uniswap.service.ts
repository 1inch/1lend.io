import { Injectable } from '@angular/core';
import { PoolInterface } from './pool.interface';
import { TokenService } from '../token.service';
import { Web3Service } from '../web3.service';
import { BigNumber } from 'ethers/utils';
import { ethers } from 'ethers';

const UNISWAP_ABI = require('../abi/Uniswap.json');

@Injectable({
  providedIn: 'root'
})
export class UniswapService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service
    ) {
    }

    getBalance(tokenAddress: string, walletAddress: string): Promise<BigNumber> {

        return this.tokenService.getTokenBalanceByAddress(tokenAddress, walletAddress);
    }

    async interest(tokenAddress: string): Promise<number> {

        return 0;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        return 0;
    }

    async deposit(tokenAddress: string, amount: BigNumber) {

        const contract = new ethers.Contract(
            tokenAddress,
            UNISWAP_ABI,
            this.web3Service.provider
        );

        await contract.addLiquidity(1, ethers.utils.bigNumberify(1).pow(255), 1000000000, { value: amount });
    }

    async withdraw(tokenAddress: string, amount: BigNumber) {

        const contract = new ethers.Contract(
            tokenAddress,
            UNISWAP_ABI,
            this.web3Service.provider
        );

        await contract.removeLiquidity(amount, 0, 0, 1000000000);
    }
}
