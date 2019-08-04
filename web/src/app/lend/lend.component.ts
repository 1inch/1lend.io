import {Component, ElementRef, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {faSyncAlt} from '@fortawesome/free-solid-svg-icons/faSyncAlt';
import {Observable, Subject} from 'rxjs';
import {ethers} from 'ethers';
import {FormControl} from '@angular/forms';
import {NgbDropdown} from '@ng-bootstrap/ng-bootstrap';
import {Web3Service} from '../web3.service';
import {TokenService} from '../token.service';
import {debounceTime, distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {ThemeService} from '../theme.service';
import {PoolsService} from '../pools/pools.service';
import {ConnectService} from '../connect.service';

@Component({
    selector: 'app-lend',
    templateUrl: './lend.component.html',
    styleUrls: ['./lend.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LendComponent implements OnInit {

    loading = true;
    dataLoading = false;
    refreshIcon = faSyncAlt;
    done = false;
    error = false;
    transactionHash = '';

    tokens;

    pools = [];

    fromTokenAmount = '';
    fromToken = localStorage.getItem('fromToken') ? localStorage.getItem('fromToken') : 'DAI';

    fromTokenBalance = '0.0';
    fromTokenBalanceBN = ethers.utils.bigNumberify(0);

    balancesOfTokens = [];

    fromTokenSearchResults: Observable<{}>;

    fromTokenSearchControl = new FormControl('');
    fromTokenAmountControl = new FormControl('');

    @ViewChild('fromTokenDropDown', {static: false})
    fromTokenDropDown: NgbDropdown;

    @ViewChild('fromTokenSearchField', {static: false})
    fromTokenSearchField: ElementRef;

    changeEvent = new Subject<string>();

    constructor(
        public tokenService: TokenService,
        public web3Service: Web3Service,
        public themeService: ThemeService,
        public poolsService: PoolsService,
        public connectService: ConnectService
    ) {
    }

    ngOnInit() {

        this.tokens = this.tokenService.poolTokens;

        this.initOnChangeStream();

        this.web3Service.connectEvent.subscribe(() => {

            this.loadBalancesOfTokens();

            this.fromTokenSearchControl.setValue('');

            this.onChangeFromToken();
        });

        this.web3Service.disconnectEvent.subscribe(() => {

            this.fromTokenBalance = '0.0';
            this.fromTokenBalanceBN = ethers.utils.bigNumberify(0);

            this.clearTokenBalances();
        });

        setInterval(() => {

            if (
                this.web3Service.walletAddress
            ) {

                this.loadTokenBalance();
                this.loadBalancesOfTokens();
            }

        }, 12000);

        this.loading = false;

        setTimeout(() => {

            this.fromTokenDropDown.openChange.subscribe((opened) => {

                if (opened) {

                    setTimeout(() => this.fromTokenSearchField.nativeElement.focus(), 1);
                }
            });

        }, 1);

        this.initFromTokenSearchResults();

        this.fromTokenAmountControl.valueChanges.pipe(
            debounceTime(200),
            distinctUntilChanged(),
        )
            .subscribe((value) => {

                if (this.isNumeric(value) && value !== 0 && !value.match(/^([0\.]+)$/)) {

                    this.fromTokenAmount = value;
                    this.onChange();

                    localStorage.setItem('fromTokenAmount', this.fromTokenAmount);
                }
            });


        if (
            this.web3Service.walletAddress
        ) {

            this.loadBalancesOfTokens();
        }

        if (localStorage.getItem('fromTokenAmount')) {

            this.fromTokenAmountControl.setValue(localStorage.getItem('fromTokenAmount'));
        } else {

            this.fromTokenAmountControl.setValue('1.0');
        }
    }

    isNumeric(str) {
        return /^\d*\.{0,1}\d*$/.test(str);
    }

    async initFromTokenSearchResults() {

        this.fromTokenSearchResults = this.fromTokenSearchControl.valueChanges.pipe(
            startWith(''),
            map(term => {

                let result = Object.values(this.tokens);

                if (term === '') {

                    result = result
                        .sort((firstEl, secondEl) => {

                            if (!firstEl['balance']) {
                                firstEl['balance'] = ethers.utils.bigNumberify(0);
                            }

                            if (!secondEl['balance']) {
                                secondEl['balance'] = ethers.utils.bigNumberify(0);
                            }

                            return secondEl['balance'].sub(firstEl['balance']).add(firstEl['symbol']
                                .localeCompare(secondEl['symbol'])).toString();
                        });

                } else {

                    return result
                        .filter(v => {

                            return (v['name'].toLowerCase().indexOf(term.toLowerCase()) > -1 || v['symbol']
                                .toLowerCase()
                                .indexOf(term.toLowerCase()) > -1);

                        })
                        .slice(0, 10)
                        .sort((firstEl, secondEl) => {

                            if (!firstEl['balance']) {
                                firstEl['balance'] = ethers.utils.bigNumberify(0);
                            }

                            if (!secondEl['balance']) {
                                secondEl['balance'] = ethers.utils.bigNumberify(0);
                            }

                            return secondEl['balance'].sub(firstEl['balance']).add(firstEl['symbol']
                                .localeCompare(secondEl['symbol'])).toString();
                        });
                }

                return result;
            })
        );
    }

    clearTokenBalances() {

        const tokens = Object.values(this.tokens);

        for (let i = 0; i < tokens.length; i++) {

            this.tokens[tokens[i]['symbol']].balance = 0;
        }
    }

    async loadBalancesOfTokens() {

        try {

            if (
                this.web3Service.walletAddress
            ) {

                const tokens = Object.values(this.tokens);

                this.balancesOfTokens = await this.tokenService.balancesOfTokens(
                    await this.web3Service.walletAddress,
                    tokens.map((token) => {

                        return token['address'];

                    })
                );

                for (let i = 0; i < this.balancesOfTokens.length; i++) {

                    this.tokens[tokens[i]['symbol']].balance = this.balancesOfTokens[i];
                }

                this.tokens['ETH'].balance = await this.web3Service.provider
                    .getBalance(this.web3Service.walletAddress);
            }
        } catch (e) {

            // console.error(e);
        }
    }

    async refresh() {

        this.onChangeEvent(this.getRequestIdentifier(), true);
    }

    async setFromToken(token) {

        this.fromToken = token.symbol;
        this.fromTokenDropDown.close();

        localStorage.setItem('fromToken', this.fromToken);

        this.fromTokenSearchControl.setValue('');

        this.onChangeFromToken();
    }

    async onChangeFromToken() {

        this.dataLoading = true;

        // this.fromTokenAmountControl.setValue('0.0');
        // this.fromTokenBalance = '0.0';
        // this.fromTokenBalanceBN = ethers.utils.bigNumberify(0);

        await this.loadTokenBalance();

        if (this.fromTokenBalance === '0.0') {

            if (this.fromTokenAmount === '0.0') {

                this.fromTokenAmountControl.setValue('1.0');
            }
        } else {

            this.fromTokenAmountControl.setValue(this.fromTokenBalance);
        }

        // this.dataLoading = false;

        this.onChange();
    }

    async loadTokenBalance() {

        if (
            this.web3Service.walletAddress
        ) {

            if (this.fromToken === 'ETH') {

                this.fromTokenBalanceBN = (await this.web3Service.provider.getBalance(this.web3Service.walletAddress)).mul(95).div(100);

                this.fromTokenBalance = ethers.utils.formatEther(
                    this.fromTokenBalanceBN
                );

            } else {

                this.fromTokenBalanceBN = await this.tokenService.getTokenBalance(
                    this.fromToken,
                    await this.web3Service.walletAddress
                );

                this.fromTokenBalance = this.tokenService.formatAsset(
                    this.fromToken,
                    this.fromTokenBalanceBN
                );
            }

            this.fromTokenBalance = this.toFixed(this.fromTokenBalance, 18);

            if (this.fromTokenBalance === '0') {
                this.fromTokenBalance = '0.0';
                this.fromTokenBalanceBN = ethers.utils.bigNumberify(0);
            }
        }
    }

    toFixed(num, fixed) {
        const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    getRequestIdentifier() {

        return this.fromToken + this.fromTokenAmount;
    }

    async onChange() {

        this.changeEvent.next(
            this.getRequestIdentifier()
        );
    }

    async approve(pool) {

        this.done = false;
        this.error = false;
        this.loading = true;

        try {

            await this.poolsService.approveToken(
                pool,
                this.fromToken
            );

            this.onChangeEvent(this.getRequestIdentifier(), true);

        } catch (e) {

            console.error(e);
            this.error = true;
        }

        this.loading = false;
    }

    async withdraw(pool) {

        this.done = false;
        this.error = false;
        this.loading = true;

        try {

            const tx = await this.poolsService.withdraw(
                pool,
                this.fromToken
            );

            this.onChangeEvent(this.getRequestIdentifier(), true);

            this.done = true;
            this.transactionHash = tx.hash;

        } catch (e) {

            console.error(e);
            this.error = true;
        }

        this.loading = false;
    }

    async deposit(pool) {

        this.done = false;
        this.error = false;
        this.loading = true;

        try {

            const tx = await this.poolsService.deposit(
                pool,
                this.fromToken,
                this.fromTokenAmount
            );

            this.onChangeEvent(this.getRequestIdentifier(), true);

            // console.log('tx', tx);

            this.done = true;
            this.transactionHash = tx.hash;

        } catch (e) {

            console.error(e);
            this.error = true;
        }

        this.loading = false;
    }

    connect() {

        this.connectService.startConnectEvent.next();
    }

    async onChangeEvent(identifier, force = false) {

        if (!force && this.getRequestIdentifier() !== identifier) {

            return false;
        }

        try {

            if (
                !this.fromTokenAmount ||
                this.fromTokenAmount === '0'
            ) {

                return;
            }

            this.pools = [];

            this.dataLoading = true;

            const result = await this.onChangeBackgroundEvent(identifier, force);

            if (!result || this.getRequestIdentifier() !== identifier) {

                return false;
            }
        } catch (e) {

            console.error(e);
            this.error = true;
        }

        this.dataLoading = false;
    }

    async onChangeBackgroundEvent(identifier, force = false) {

        if (
            !this.fromTokenAmount ||
            this.fromTokenAmount === '0'
        ) {

            return false;
        }

        if (!force && this.getRequestIdentifier() !== identifier) {

            return false;
        }

        const pools = await this.poolsService.getPools(
            this.fromToken,
            this.tokenService.parseAsset(
                this.fromToken,
                this.fromTokenAmount
            )
        );

        if (this.getRequestIdentifier() !== identifier) {

            return false;
        }

        this.pools = pools.sort((firstEl, secondEl) => {

            return secondEl['interest'] - firstEl['interest'];
        });

        return true;
    }

    async setFromTokenAmount() {

        this.fromTokenAmountControl.setValue(this.fromTokenBalance);
    }

    async initOnChangeStream() {

        this.changeEvent.pipe(
            debounceTime(200),
            distinctUntilChanged(),
        )
            .subscribe(async (identifier) => {

                await this.onChangeEvent(identifier);
            });
    }
}
