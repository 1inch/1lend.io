import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {BigNumber} from 'ethers/utils';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {ethers} from 'ethers';

declare let require: any;
const CERC20_ABI = require('../abi/CERC20.json');

@Injectable({
    providedIn: 'root'
})
export class CompoundService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service
    ) {
    }

    getBalance(tokenSymbol: string, walletAddress: string): Promise<BigNumber> {

        return this.tokenService.getTokenBalance(tokenSymbol, walletAddress);
    }

    async interest(tokenSymbol: string): Promise<number> {

        const contract = new ethers.Contract(
            this.tokenService.tokens[tokenSymbol].address,
            CERC20_ABI,
            this.web3Service.provider
        );

        const [
            blockBorrowRate,
            totalBorrows,
            cash
        ] = await Promise.all([
            contract.borrowRatePerBlock(),
            contract.totalBorrows(),
            contract.getCash(),
        ]);

        const annualBorrowRate = blockBorrowRate.mul(365 * 24 * 60 * 60).div(12).mul(10000).div(1e9).div(1e9);
        const annualLendRate = annualBorrowRate.mul(totalBorrows).div(cash.add(totalBorrows));

        return Number(ethers.utils.formatUnits(annualLendRate, 2));
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
