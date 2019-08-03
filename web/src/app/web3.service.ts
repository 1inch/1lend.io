import {Injectable} from '@angular/core';
import {ethers} from 'ethers';
import {ConfigurationService} from './configuration.service';
import Jazzicon from 'jazzicon';
import WalletConnectProvider from '@walletconnect/web3-provider';
import Portis from '@portis/web3';
import Squarelink from 'squarelink';
import Fortmatic from 'fortmatic';

import Web3 from 'web3';
import {Subject} from 'rxjs';

declare let require: any;
declare let web3: any;
declare let ethereum: any;
declare let window: any;

@Injectable({
    providedIn: 'root'
})
export class Web3Service {

    public provider;

    public txProvider = null;
    public txProviderName;

    public thirdPartyProvider = null;

    public walletAddress = '';
    public walletEns = '';
    public walletIcon = null;
    public walletIconSmall = null;

    connectEvent = new Subject<any>();
    disconnectEvent = new Subject<void>();

    constructor(
        private configurationService: ConfigurationService
    ) {

        this.txProviderName = localStorage.getItem('txProviderName');
        this.initWeb3();
    }

    async initWeb3() {

        const infura = new ethers.providers.InfuraProvider('homestead', this.configurationService.INFURA_KEY);

        this.provider = new ethers.providers.FallbackProvider([
            infura,
        ]);

        if (this.txProviderName) {

            try {

                await this.connect(this.txProviderName);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async disconnect(wallet = null) {

        if (this.thirdPartyProvider) {
            console.log('thirdPartyProvider', this.thirdPartyProvider);

            switch (this.txProviderName) {
                case 'torus':
                    window.location.reload();
                    break;
                case 'metamask':
                default:

                    break;
            }
        }

        this.txProvider = null;
        this.txProviderName = '';
        this.walletAddress = '';
        this.walletIcon = null;
        this.walletEns = '';

        localStorage.setItem('txProviderName', '');

        if (wallet !== null) {

            localStorage.setItem('txProviderName', wallet);
        }

        this.disconnectEvent.next();
    }

    async connect(wallet) {

        await this.disconnect(wallet);

        switch (wallet) {
            case 'torus':
                await this.enableTorusTxProvider();
                break;
            case 'portis':
                await this.enablePortisTxProvider();
                break;
            case 'fortmatic':
                await this.enableFortmaticTxProvider();
                break;
            case 'squarelink':
                await this.enableSquarelinkTxProvider();
                break;
            case 'wallet-connect':
                await this.enableWalletConnectTxProvider();
                break;
            case 'metamask':
            default:
                await this.enableWeb3TxProvider();
                break;
        }

        localStorage.setItem('txProviderName', wallet);

        this.walletAddress = (await this.txProvider.eth.getAccounts())[0];
        this.walletIconSmall = Jazzicon(16, parseInt(this.walletAddress.slice(2, 10), 16));
        this.walletIcon = Jazzicon(32, parseInt(this.walletAddress.slice(2, 10), 32));

        try {

            this.walletEns = await this.provider.lookupAddress(this.walletAddress);

        } catch (e) {

            // console.error(e);
        }

        this.connectEvent.next({
            walletAddress: this.walletAddress,
            walletIcon: this.walletIcon
        });
    }

    async enableWeb3TxProvider() {

        try {

            if (typeof ethereum !== 'undefined') {

                this.txProvider = new Web3(ethereum);

                try {

                    // Request account access if needed
                    await ethereum.enable();
                } catch (error) {

                    // User denied account access...
                    // alert('Please connect your Web3 Wallet to the dApp!');
                    throw new Error('No web3 provider!');
                }

                if (typeof ethereum.on !== 'undefined') {

                    ethereum.on('accountsChanged', function (accounts) {

                        window.location.reload();
                    });

                    ethereum.on('networkChanged', function (netId) {

                        window.location.reload();
                    });
                }

            } else if (typeof window.web3 !== 'undefined') {

                this.txProvider = new Web3(window.web3.currentProvider);

            } else if (typeof web3 !== 'undefined') {

                this.txProvider = new Web3(web3.currentProvider);
            } else {

                // alert('No Web3 provider found! Please install Metamask or use TrustWallet on mobile device.');
                throw new Error('No web3 provider!');
            }

            this.txProviderName = 'metamask';
        } catch (e) {

            alert(e);
            console.error(e);
            throw new Error(e);
        }
    }

    async enableTorusTxProvider() {

        try {

            await (new Promise((resolve, reject) => {

                const embed = require('@toruslabs/torus-embed');

                window.addEventListener('message', async message => {

                    if (
                        typeof message.data.target !== 'undefined' &&
                        message.data.target === 'embed_metamask' &&
                        typeof message.data.data !== 'undefined' &&
                        message.data.data.name === 'publicConfig'
                    ) {

                        window.ethereum.enable().then(async accounts => {

                            this.txProviderName = 'torus';
                            this.txProvider = new Web3(window.ethereum);
                            this.thirdPartyProvider = window.ethereum;
                            resolve();
                        });
                    }
                });
            }));

        } catch (e) {

            console.error(e);
            throw new Error(e);
        }
    }

    async enableSquarelinkTxProvider() {

        try {

            const sqlk = new Squarelink('2685917105c01ad933ea');

            this.txProvider = new Web3(
                sqlk.getProvider()
            );

            await this.txProvider.eth.getAccounts();

            this.txProviderName = 'squarelink';
            this.thirdPartyProvider = sqlk;
        } catch (e) {

            console.error(e);
            throw new Error(e);
        }
    }

    async enableFortmaticTxProvider() {

        try {
            const fm = new Fortmatic('pk_live_7BCE996AE3CFEEC5');

            this.txProvider = new Web3(
                fm.getProvider()
            );

            await fm.user.login();

            this.txProviderName = 'fortmatic';
            this.thirdPartyProvider = fm;
        } catch (e) {

            console.error(e);
            throw new Error(e);
        }
    }

    async enablePortisTxProvider() {

        try {

            const portis = new Portis('4775c8d9-e6fe-4cdf-8c54-2f199d73b62a', 'mainnet');

            this.txProvider = new Web3(
                portis.provider
            );

            this.txProviderName = 'portis';
            this.thirdPartyProvider = portis;
        } catch (e) {

            console.error(e);
            throw new Error(e);
        }
    }

    async enableWalletConnectTxProvider() {

        try {

            const walletConnectProvider = new WalletConnectProvider({
                bridge: 'https://bridge.walletconnect.org'
            });

            this.txProvider = new Web3(
                walletConnectProvider
            );

            await walletConnectProvider.enable();

            this.txProviderName = 'wallet-connect';
            this.thirdPartyProvider = walletConnectProvider;
        } catch (e) {

            console.error(e);
            throw new Error(e);
        }
    }
}
