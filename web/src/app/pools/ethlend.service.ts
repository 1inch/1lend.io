import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {BigNumber} from 'ethers/utils';
import {HttpClient} from '@angular/common/http';

function selectMany<TIn, TOut>(input: TIn[], selectListFn: (t: TIn) => TOut[]): TOut[] {
    return input.reduce((out, inx) => {
        out.push(...selectListFn(inx));
        return out;
    }, new Array<TOut>());
}

@Injectable({
    providedIn: 'root'
})
export class EthlendService implements PoolInterface {

    endpoint;

    constructor(
        protected httpClient: HttpClient
    ) {
        this.endpoint = 'https://main-cache-db.ethlend.io/loan-offers?state=WaitingForBorrower';
    }

    deposit(tokenSymbol: string, amount: BigNumber) {
    }

    getBalance(tokenSymbol: string, wallet: string): Promise<BigNumber> {
        return undefined;
    }

    getFormatedBalance(tokenSymbol: string, wallet: string): Promise<string> {
        return undefined;
    }

    async interest(tokenSymbol: string): Promise<number> {

        const result = (await this.httpClient.get(this.endpoint).toPromise());
        let orders: Array<any> = selectMany(Object.values(result), order => order.collaterals);
        orders = orders.map(order => order.mpr*12).sort();

        return orders[0];
    }

    withdraw(tokenAddress: string, walletAddress: string) {
    }
}
