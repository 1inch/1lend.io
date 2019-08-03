import {Injectable} from '@angular/core';
import {TokenService} from '../token.service';
import {ethers} from 'ethers';
import {LendroidService} from './lendroid.service';
import {CompoundService} from './compound.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {UniswapService} from './uniswap.service';

@Injectable({
    providedIn: 'root'
})
export class PoolsService {

    public pools = [
        {
            name: 'lendroid',
            title: 'Lendroid',
            icon: 'lendroid.svg',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'single'
        },
        {
            name: 'ethLend',
            title: 'ETHLend',
            icon: 'ethlend.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'single'
        },
        {
            name: 'kyber',
            title: 'Kyber',
            icon: 'kyber-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'double'
        },
        {
            name: 'bancor',
            title: 'Bancor',
            icon: 'bancor-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: true,
            type: 'double'
        },
        {
            name: 'uniswap',
            title: 'Uniswap',
            icon: 'uniswap.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'double'
        },
        // {
        //     name: 'compound-v1',
        //     title: 'Compound V1',
        //     icon: 'compound-v1.svg',
        //     lightThemeIconInvert: false,
        //     darkThemeIconInvert: false
        // },
        {
            name: 'compound-v2',
            title: 'Compound V2',
            icon: 'compound-v2.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single'
        },
        {
            name: 'dharma',
            title: 'Dharma',
            icon: 'dharma.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: true,
            type: 'single'
        },
        {
            name: 'nuo',
            title: 'Nuo',
            icon: 'nuo.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single'
        },
        {
            name: 'fulcrum',
            title: 'Fulcrum',
            icon: 'fulcrum.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single'
        }
    ];

    constructor(
        private tokenService: TokenService,
        private lendroidService: LendroidService,
        private compoundService: CompoundService,
        private uniswapService: UniswapService,
        private web3Service: Web3Service
    ) {
    }

    async getPools(token: string, amount: BigNumber) {

        const result = [];

        for (const pool of this.pools) {

            try {

                result.push({
                    name: pool.name,
                    title: pool.title,
                    icon: pool.icon,
                    token: this.tokenService.tokens[token].symbol,
                    interest: await this.getInterestOf(pool.name, token),
                    balance: await this.getBalanceOf(pool.name, token),
                    slippage: await this.getSlippageOf(pool.name, token, amount),
                    lightThemeIconInvert: pool.lightThemeIconInvert,
                    darkThemeIconInvert: pool.darkThemeIconInvert,
                    type: pool.type
                });

            } catch (e) {

                console.error(e);
            }
        }

        return result;
    }

    async getBalanceOf(pool: string, token: string) {

        if (!this.web3Service.walletAddress) {

            return ethers.utils.bigNumberify(0);
        }

        switch (pool) {
            case 'compound-v2':

                return this.tokenService.formatAsset(
                    'c' + token,
                    await this.compoundService.getBalance(token, this.web3Service.walletAddress)
                );
                break;
            case 'uniswap':

                return this.tokenService.formatAsset(
                    token,
                    await this.uniswapService.getBalance(
                        this.tokenService.tokens[token].address,
                        this.web3Service.walletAddress
                    )
                );
                break;
            default:
                return ethers.utils.bigNumberify(0);
                break;
        }
    }

    async getInterestOf(pool: string, token: string) {

        switch (pool) {
            case 'compound-v2':

                return this.compoundService.interest(token);
                break;
            case 'uniswap':

                return this.uniswapService.interest(
                    this.tokenService.tokens[token].address
                );

                break;
            default:
                return ethers.utils.bigNumberify(0);
                break;
        }
    }

    async getSlippageOf(pool: string, token: string, amount: BigNumber) {

        switch (pool) {
            case 'compound-v2':

                return this.compoundService.slippage(token, amount);
                break;
            case 'uniswap':

                return this.uniswapService.slippage(
                    this.tokenService.tokens[token].address,
                    amount
                );

                break;
            default:
                return ethers.utils.bigNumberify(0);
                break;
        }
    }
}
