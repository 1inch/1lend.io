import {Injectable} from '@angular/core';
import {TokenService} from '../token.service';

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
        private tokenService: TokenService
    ) {
    }

    async getPools(token: string) {

        const result = [];

        for (const pool of this.pools) {

            console.log('token', token);

            result.push({
                name: pool.name,
                title: pool.title,
                icon: pool.icon,
                token: this.tokenService.tokens[token].symbol,
                interest: 0,
                balance: 0,
                lightThemeIconInvert: pool.lightThemeIconInvert,
                darkThemeIconInvert: pool.darkThemeIconInvert
            });
        }

        return result;
    }
}
