import {Injectable} from '@angular/core';
import {TokenService} from '../token.service';
import {ethers} from 'ethers';
import {LendroidService} from './lendroid.service';
import {EthlendService} from './ethlend.service';
import {CompoundService} from './compound.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {UniswapService} from './uniswap.service';
import {KyberService} from './kyber.service';
import {ConfigurationService} from '../configuration.service';

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
            type: 'single',
            active: false
        },
        {
            name: 'ethlend',
            title: 'ETHLend',
            icon: 'ethlend.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'single',
            active: false
        },
        {
            name: 'kyber',
            title: 'Kyber',
            icon: 'kyber-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'double',
            active: false
        },
        {
            name: 'bancor',
            title: 'Bancor',
            icon: 'bancor-network.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: true,
            type: 'double',
            active: false
        },
        {
            name: 'uniswap',
            title: 'Uniswap',
            icon: 'uniswap.png',
            lightThemeIconInvert: true,
            darkThemeIconInvert: false,
            type: 'double',
            active: true
        },
        {
            name: 'compound-v2',
            title: 'Compound V2',
            icon: 'compound-v2.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single',
            active: true
        },
        {
            name: 'dharma',
            title: 'Dharma',
            icon: 'dharma.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: true,
            type: 'single',
            active: false
        },
        {
            name: 'nuo',
            title: 'Nuo',
            icon: 'nuo.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single',
            active: false
        },
        {
            name: 'fulcrum',
            title: 'Fulcrum',
            icon: 'fulcrum.svg',
            lightThemeIconInvert: false,
            darkThemeIconInvert: false,
            type: 'single',
            active: false
        }
    ];

    constructor(
        private tokenService: TokenService,
        private lendroidService: LendroidService,
        private ethlendService: EthlendService,
        private compoundService: CompoundService,
        private uniswapService: UniswapService,
        private kyberService: KyberService,
        private web3Service: Web3Service,
        private configurationService: ConfigurationService
    ) {
    }

    async getPools(token: string, amount: BigNumber) {

        const result = [];
        const promises = [];

        for (const pool of this.pools) {

            if (pool.name === 'uniswap' && token === 'ETH') {

                continue;
            }

            promises.push(
                new Promise(async (resolve) => {

                    try {

                        const resultPool = {
                            name: pool.name,
                            title: pool.title,
                            icon: pool.icon,
                            token: this.tokenService.tokens[token].symbol,
                            interest: null,
                            lastInterest: null,
                            minInterest: null,
                            maxInterest: null,
                            approved: null,
                            balance: null,
                            slippage: null,
                            lightThemeIconInvert: pool.lightThemeIconInvert,
                            darkThemeIconInvert: pool.darkThemeIconInvert,
                            type: pool.type,
                            active: pool.active
                        };

                        this.getInterestOf(pool.name, token)
                            .then((interest) => {
                                resultPool.interest = interest;

                                resultPool.lastInterest = interest[interest.length - 1];
                                resultPool.minInterest = interest.reduce((a, b) => a > b ? b : a);
                                resultPool.maxInterest = interest.reduce((a, b) => a > b ? a : b);

                                this.getSlippageOf(pool.name, token, amount)
                                    .then((slippage) => {
                                        resultPool.slippage = slippage;
                                    });
                            });

                        this.isApproved(pool.name, token)
                            .then((approved) => {
                                resultPool.approved = approved;
                            });

                        this.getBalanceOf(pool.name, token)
                            .then((balance) => {
                                resultPool.balance = balance;
                            });

                        result.push(resultPool);
                    } catch (e) {

                        console.error(e);
                    }

                    resolve();
                })
            );
        }

        await Promise.all(promises);

        return result;
    }

    async getBalanceOf(pool: string, token: string) {

        if (!this.web3Service.walletAddress) {

            return ethers.utils.bigNumberify(0);
        }

        try {

            switch (pool) {
                case 'compound-v2':

                    return await this.compoundService.getFormatedBalance(token, this.web3Service.walletAddress);
                    break;
                case 'uniswap':

                    return await this.uniswapService.getFormatedTokensBalance(
                        token,
                        this.web3Service.walletAddress
                    );
                    break;
                default:
                    return ethers.utils.bigNumberify(0);
                    break;
            }
        } catch (e) {

            return ethers.utils.bigNumberify(0);
        }
    }

    async getInterestOf(pool: string, token: string): Promise<Array<number>> {

        switch (pool) {
            case 'compound-v2':

                return this.compoundService.interest(token);
                break;
            case 'uniswap':

                return this.uniswapService.interest(
                    this.tokenService.tokens[token].address
                );

                break;
            case 'kyber':

                return this.kyberService.interest(
                    this.tokenService.tokens[token].address
                );

                break;
            case 'lendroid':

                return this.lendroidService.interest(
                    this.tokenService.tokens[token].address
                );

                break;
            case 'ethlend':

                return this.ethlendService.interest(
                    token
                );

                break;
            default:
                return [
                    0
                ];
                break;
        }
    }

    async isApproved(pool: string, token: string) {

        if (token === 'ETH') {

            return true;
        }

        if (this.web3Service.walletAddress) {

            switch (pool) {
                case 'uniswap':

                    return this.tokenService.isApproved(
                        token,
                        await this.uniswapService.getExchangeAddress(this.tokenService.tokens[token].address)
                    );

                    break;
                case 'compound-v2':

                    return this.tokenService.isApproved(
                        token,
                        this.tokenService.tokens['c' + token].address
                    );

                    break;
                case 'kyber':

                    return this.tokenService.isApproved(
                        token,
                        this.configurationService.KYBER_NETWORK_PROXY_CONTRACT_ADDRESS
                    );

                    break;
                default:
                    return false;
                    break;
            }
        } else {

            return false;
        }
    }

    async approveToken(pool: string, token: string) {

        if (this.web3Service.walletAddress) {

            switch (pool) {
                case 'uniswap':

                    return this.tokenService.approveToken(
                        token,
                        await this.uniswapService.getExchangeAddress(this.tokenService.tokens[token].address)
                    );

                    break;
                case 'compound-v2':

                    return this.tokenService.approveToken(
                        token,
                        this.tokenService.tokens['c' + token].address
                    );

                    break;
                case 'kyber':

                    return this.tokenService.approveToken(
                        token,
                        this.configurationService.KYBER_NETWORK_PROXY_CONTRACT_ADDRESS
                    );

                    break;
                default:
                    return false;
                    break;
            }
        } else {

            return false;
        }
    }

    async withdraw(pool: string, token: string) {

        if (this.web3Service.walletAddress) {

            switch (pool) {
                case 'uniswap':

                    return this.uniswapService.withdraw(
                        this.tokenService.tokens[token].address,
                        this.web3Service.walletAddress
                    );

                    break;
                case 'compound-v2':

                    return this.compoundService.withdraw(
                        token,
                        this.web3Service.walletAddress
                    );

                    break;
                default:
                    return false;
                    break;
            }
        } else {

            return false;
        }
    }

    async deposit(pool: string, token: string, amount: string) {

        if (this.web3Service.walletAddress) {

            switch (pool) {
                case 'uniswap':

                    return this.uniswapService.deposit(
                        this.tokenService.tokens[token].address,
                        this.tokenService.parseAsset(token, amount)
                    );

                    break;
                case 'compound-v2':

                    return this.compoundService.deposit(
                        token,
                        this.tokenService.parseAsset(token, amount)
                    );

                    break;
                default:
                    return false;
                    break;
            }
        } else {

            return false;
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
            case 'kyber':

                return this.kyberService.slippage(
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
