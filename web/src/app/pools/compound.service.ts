import { Injectable } from '@angular/core';
import { PoolInterface } from './pool.interface';
import { BigNumber } from 'ethers/utils';
import { TokenService } from '../token.service';

const CERC20_ABI = require('../abi/CERC20.json');

@Injectable({
  providedIn: 'root'
})
export class CompoundService implements PoolInterface {

    constructor(
        tokenService: TokenService,
        web3Service: Web3Service
    ) { }

    getBalance(tokenSymbol: string, walletAddress: string): Promise<BigNumber> {
        return this.tokenService.getTokenBalance(tokenSymbol, walletAddress);
    }

    async deposit(tokenSymbol: string, amount: BigNumber) {
        const contract = new ethers.Contract(
            this.tokenService.tokens[tokenSymbol].address,
            CERC20_ABI,
            this.web3Service.provider
        );

        await contract.mint(amount);
    }

    async withdraw(tokenSymbol: string, amount: BigNumber) {
        const contract = new ethers.Contract(
            this.tokenService.tokens[tokenSymbol].address,
            CERC20_ABI,
            this.web3Service.provider
        );

        await contract.redeem(amount);
    }
}
