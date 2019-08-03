import {Injectable} from '@angular/core';
import {Web3Service} from './web3.service';
import {ethers} from 'ethers';
import {BigNumber} from 'ethers/utils';
import {ConfigurationService} from './configuration.service';

declare let require: any;
const ERC20ABI = require('./abi/ERC20ABI.json');

const TokenBalanceAggregatorABI = [
    {
        'constant': true,
        'inputs': [
            {
                'name': 'user',
                'type': 'address'
            },
            {
                'name': 'tokens',
                'type': 'address[]'
            }
        ],
        'name': 'balancesOfTokens',
        'outputs': [
            {
                'name': 'balances',
                'type': 'uint256[]'
            }
        ],
        'payable': false,
        'stateMutability': 'view',
        'type': 'function'
    }
];

@Injectable({
    providedIn: 'root'
})
export class TokenService {

    public tokens = {
        DAI: {
            symbol: 'DAI',
            name: 'Dai',
            icon: 'd4938e40-fc51-11e7-90ab-6d53c6790097.png',
            decimals: 18,
            address: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
        },
        ETH: {
            symbol: 'ETH',
            name: 'Ethereum',
            icon: 'aea83e97-13a3-4fe7-b682-b2a82299cdf2.png',
            decimals: 18,
            address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
        },
        WBTC: {
            symbol: 'WBTC',
            name: 'Wrapped BTC',
            icon: '',
            decimals: 8,
            address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
        },
        REP: {
            symbol: 'REP',
            name: 'Augur',
            icon: '',
            decimals: 18,
            address: '0x1985365e9f78359a9b6ad760e32412f4a445e862'
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            icon: '',
            decimals: 6,
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
        },
        BAT: {
            symbol: 'BAT',
            name: 'Basic Attention Token',
            icon: '47424c50-1495-11e8-a36b-c1b17c6baaea.png',
            decimals: 18,
            address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef'
        },
        ZRX: {
            symbol: 'ZRX',
            name: '0x Protocol',
            icon: '',
            decimals: 18,
            address: '0xe41d2489571d322189246dafa5ebde1f4699f498'
        },
    };

    tokenBalanceAggregatorContract;

    constructor(
        private web3Service: Web3Service,
        private configurationService: ConfigurationService
    ) {

        // @ts-ignore
        this.tokens = this.sortObject(this.tokens);

        this.tokenBalanceAggregatorContract = new ethers.Contract(
            this.configurationService.TOKEN_AGGREGATOR_SMART_CONTRACT_ADDRESS,
            TokenBalanceAggregatorABI,
            this.web3Service.provider
        );
    }

    sortObject(o) {
        return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});
    }

    parseAsset(symbol: string, amount): BigNumber {

        if (symbol === 'ETH') {
            return ethers.utils.parseEther(amount);
        }

        const token = this.tokens[symbol];
        return ethers.utils.parseUnits(this.toFixed(amount, token.decimals), token.decimals);
    }

    toFixed(num, fixed) {
        const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    formatAsset(symbol: string, amount: BigNumber): string {

        if (symbol === 'ETH') {
            return ethers.utils.formatEther(amount);
        }

        const token = this.tokens[symbol];

        if (!token.decimals) {

            return amount.toString();
        } else {

            return ethers.utils.formatUnits(amount, token.decimals);
        }
    }

    async getTokenBalance(symbol: string, address: string) {

        const contract = new ethers.Contract(
            this.tokens[symbol].address,
            ERC20ABI,
            this.web3Service.provider
        );

        return await contract.balanceOf(address);
    }

    async balancesOfTokens(
        address: string,
        tokens: string[]
    ): Promise<BigNumber[]> {

        return this.tokenBalanceAggregatorContract.balancesOfTokens(
            address,
            tokens
        );
    }
}
