import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {BigNumber} from 'ethers/utils';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {ethers} from 'ethers';
import {ConfigurationService} from '../configuration.service';

declare let require: any;
const CERC20_ABI = require('../abi/CERC20.json');

@Injectable({
    providedIn: 'root'
})
export class CompoundService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service,
        protected configurationService: ConfigurationService
    ) {
    }

    getBalance(tokenSymbol: string, walletAddress: string): Promise<BigNumber> {

        tokenSymbol = 'c' + tokenSymbol;

        return this.tokenService.getTokenBalance(tokenSymbol, walletAddress);
    }

    async getFormatedBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        return this.tokenService.formatAsset(
            'c' + tokenSymbol,
            await this.getBalance(tokenSymbol, walletAddress)
        );
    }

    async interest(tokenSymbol: string): Promise<number> {

        tokenSymbol = 'c' + tokenSymbol;

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

        const annualBorrowRate = blockBorrowRate.mul(365 * 24 * 60 * 60).div(25).mul(2).mul(10000).div(1e9).div(1e9);
        const annualLendRate = annualBorrowRate.mul(totalBorrows).div(totalBorrows.add(cash));

        return Number(ethers.utils.formatUnits(annualLendRate, 2));
    }

    async slippage(tokenSymbol: string, amount: BigNumber): Promise<number> {

        tokenSymbol = 'c' + tokenSymbol;

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

        const annualBorrowRate = blockBorrowRate.mul(365 * 24 * 60 * 60).div(25).mul(2).mul(10000).div(1e9).div(1e9);
        const annualLendRate = annualBorrowRate.mul(totalBorrows).div(totalBorrows.add(cash));
        const nextAnnualLendRate = annualBorrowRate.mul(totalBorrows).div(totalBorrows.add(cash).add(amount));
        const diffLendRate = nextAnnualLendRate.sub(annualLendRate);

        return Number(ethers.utils.formatUnits(diffLendRate, 2));
    }

    async deposit(tokenSymbol: string, amount: BigNumber) {

        tokenSymbol = 'c' + tokenSymbol;

        const web3Provider = new ethers.providers.Web3Provider(
            this.web3Service.txProvider.currentProvider
        );

        const contract = new ethers.Contract(
            this.tokenService.tokens[tokenSymbol].address,
            CERC20_ABI,
            web3Provider.getSigner()
        );

        return contract.mint(
            amount,
            {
                gasPrice: this.configurationService.fastGasPrice
            }
        );
    }

    async withdraw(tokenSymbol: string, walletAddress: string) {

        const web3Provider = new ethers.providers.Web3Provider(
            this.web3Service.txProvider.currentProvider
        );

        const contract = new ethers.Contract(
            this.tokenService.tokens['c' + tokenSymbol].address,
            CERC20_ABI,
            web3Provider.getSigner()
        );

        return contract.redeem(
            await this.getBalance(tokenSymbol, walletAddress),
            {
                gasPrice: this.configurationService.fastGasPrice
            }
        );
    }
}
