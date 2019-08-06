import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {BigNumber} from 'ethers/utils';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class LendroidService implements PoolInterface {

    endpoint;

    constructor(
        protected httpClient: HttpClient
    ) {
        this.endpoint = 'https://winged-yeti-201009.appspot.com/offers';
    }

    deposit(tokenSymbol: string, amount: BigNumber) {
    }

    getBalance(tokenSymbol: string, wallet: string): Promise<BigNumber> {
        return undefined;
    }

    getFormatedBalance(tokenSymbol: string, wallet: string): Promise<string> {
        return undefined;
    }

    async interest(tokenSymbol: string): Promise<Array<number>> {

        const result = (await this.httpClient.get(this.endpoint).toPromise())['result'];
        let orders: Array<any> = Object.values(result);

        orders = orders.map(order => Number(order.interestRatePerDay));
        orders = orders.sort();

        return orders.slice(0,10);
    }

    withdraw(tokenAddress: string, walletAddress: string) {
    }
}
