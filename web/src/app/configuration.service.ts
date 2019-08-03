import {Injectable} from '@angular/core';
import {ethers} from 'ethers';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ConfigurationService {

    public AGGREGATED_LEND_ENS = 'onelend.eth';
    public INFURA_KEY = '8b719297739c4cf19209f1377aa1e83c';

    public GAS_PRICE_URL = 'https://gasprice.poa.network';
    public CORS_PROXY_URL = 'https://corsproxy.1inch.exchange/';

    public TOKEN_AGGREGATOR_SMART_CONTRACT_ADDRESS = ethers.utils.getAddress('0x9f436186FAa769eA776D793c084dC1B66F593164');

    public UNISWAP_FACTORY_CONTRACT_ADDRESS = '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95';
    public KYBER_NETWORK_PROXY_CONTRACT_ADDRESS = '0x818E6FECD516Ecc3849DAf6845e3EC868087B755';

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
