import {Injectable} from '@angular/core';
import {ethers} from 'ethers';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ConfigurationService {

    public AGGREGATED_LEND_ENS = '1lend.eth';
    public INFURA_KEY = '8b719297739c4cf19209f1377aa1e83c';

    public GAS_PRICE_URL = 'https://gasprice.poa.network';
    public CORS_PROXY_URL = 'https://corsproxy.1inch.exchange/';

    public fastGasPrice;
    public standardGasPrice;
    public instantGasPrice;

    constructor(
        private http: HttpClient
    ) {

        this.getGasPrices();
    }

    async getGasPrices() {

        const result = await this.http.get(this.GAS_PRICE_URL).toPromise();

        this.fastGasPrice = new ethers.utils.BigNumber(Math.trunc(result['fast'] * 100)).mul(1e7);
        this.standardGasPrice = new ethers.utils.BigNumber(Math.trunc(result['standard'] * 100)).mul(1e7);
        this.instantGasPrice = new ethers.utils.BigNumber(Math.trunc(result['instant'] * 100)).mul(1e7);
    }
}
