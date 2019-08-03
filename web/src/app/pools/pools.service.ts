import {Injectable} from '@angular/core';
import {TokenService} from '../token.service';
import {ethers} from 'ethers';
import {LendroidService} from './lendroid.service';
import {CompoundService} from './compound.service';
import {Web3Service} from '../web3.service';

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
            darkThemeIconInvert: false
        },
        {
            name: 'ethLend',
            title: 'ETHLend',
            icon: 'ethlend.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false
        },
        {
            name: 'kyber',
            title: 'Kyber Network',
            icon: 'kyber-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false
        },
        {
            name: 'bancor',
            title: 'Bancor Network',
            icon: 'bancor-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: true
        },
        {
            name: 'uniswap',
            title: 'Uniswap',
            icon: 'uniswap.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false
        },
        {
            name: 'compound-v1',
            title: 'Compound V1',
            icon: 'compound-v1.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false
        },
        {
            name: 'compound-v2',
            title: 'Compound V2',
            icon: 'compound-v2.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false
        },
        {
            name: 'dharma',
            title: 'Dharma',
            icon: 'dharma.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: true
        },
        {
            name: 'nuo',
            title: 'Nuo',
            icon: 'nuo.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false
        },
        {
            name: 'fulcrum',
            title: 'Fulcrum',
            icon: 'fulcrum.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false
        }
    ];

    constructor(
        private tokenService: TokenService,
        private lendroidService: LendroidService,
        private compoundService: CompoundService,
        private web3Service: Web3Service
    ) {
    }

    async getPools(token: string) {

        const result = [];

        for (const pool of this.pools) {

            result.push({
                name: pool.name,
                title: pool.title,
                icon: pool.icon,
                token: this.tokenService.tokens[token].symbol,
                interest: 0,
                balance: this.tokenService.formatAsset(token, await this.getBalanceOf(pool.name, token)),
                lightThemeIconInvert: pool.lightThemeIconInvert,
                darkThemeIconInvert: pool.darkThemeIconInvert
            });
        }

        return result;
    }

    async getBalanceOf(pool: string, token: string) {

        switch (pool) {
            case 'compound-v2':

                return this.compoundService.getBalance(token, this.web3Service.walletAddress);
                break;
            default:
                return ethers.utils.bigNumberify(0);
                break;
        }
    }
}
