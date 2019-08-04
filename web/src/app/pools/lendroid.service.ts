import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {BigNumber} from 'ethers/utils';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class LendroidService implements PoolInterface {

    constructor(
        protected httpClient: HttpClient
    ) {
        // https://winged-yeti-201009.appspot.com/offers
    }

    deposit(tokenSymbol: string, amount: BigNumber) {
    }

    getBalance(tokenSymbol: string, wallet: string): Promise<BigNumber> {
        return undefined;
    }

    getFormatedBalance(tokenSymbol: string, wallet: string): Promise<string> {
        return undefined;
    }

    interest(tokenSymbol: string): Promise<number> {
        return undefined;
    }

    withdraw(tokenAddress: string, walletAddress: string) {
    }
}
