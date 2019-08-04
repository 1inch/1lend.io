import {Injectable} from '@angular/core';
import {PoolInterface} from './pool.interface';
import {TokenService} from '../token.service';
import {Web3Service} from '../web3.service';
import {BigNumber} from 'ethers/utils';
import {ethers} from 'ethers';
import {ConfigurationService} from '../configuration.service';

declare let require: any;
const KYBER_ABI = require('../abi/Kyber.json');

const ETH_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

function bnsqrt(a: BigNumber): BigNumber {
    return ethers.utils.bigNumberify(
        Math.floor(
            Math.sqrt(
                Number(a.toString())
            )
        )
    );
}

@Injectable({
    providedIn: 'root'
})
export class KyberService implements PoolInterface {

    constructor(
        protected tokenService: TokenService,
        protected web3Service: Web3Service,
        protected configurationService: ConfigurationService
    ) {
    }

    async getBalance(tokenAddress: string, walletAddress: string): Promise<BigNumber> {

        return ethers.utils.bigNumberify(0);
    }

    async getFormatedBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        return this.tokenService.formatAsset(
            tokenSymbol,
            await this.getBalance(tokenSymbol, walletAddress)
        );
    }

    async getTokensBalance(tokenAddress: string, walletAddress: string) {

        return [
            ethers.utils.bigNumberify(0),
            ethers.utils.bigNumberify(0)
        ];
    }

    async getFormatedTokensBalance(tokenSymbol: string, walletAddress: string): Promise<string> {

        const tokensBalance = await this.getTokensBalance(
            this.tokenService.tokens[tokenSymbol].address,
            walletAddress
        );

        const ethAmount = tokensBalance[0];
        const tokenAmount = tokensBalance[1];

        let ethFormatedAmount = this.tokenService.formatAsset(
            'ETH',
            ethAmount
        );

        ethFormatedAmount = this.toFixed(ethFormatedAmount, 6);

        let tokenFormatedAmount = this.tokenService.formatAsset(
            tokenSymbol,
            tokenAmount
        );

        tokenFormatedAmount = this.toFixed(tokenFormatedAmount, 6);

        return ethFormatedAmount + ' ETH ' + '\n' + tokenFormatedAmount + ' ' + tokenSymbol;
    }

    toFixed(num, fixed) {
        const re = new RegExp('^-?\\d+(?:\.\\d{0,' + (fixed || -1) + '})?');
        return num.toString().match(re)[0];
    }

    async interest(tokenAddress: string): Promise<number> {

        const contract = new ethers.Contract(
            '0x0000000000000000000000000000000000000000',
            KYBER_ABI,
            this.web3Service.provider
        );

        const delta = 20000;
        const currentBlock = await this.web3Service.provider.getBlockNumber();
        const rawResults = await this.web3Service.provider.getLogs({
            address: null,
            fromBlock: currentBlock - delta,
            toBlock: currentBlock,
            topics: [
                [
                    contract.filters.TradeExecute().topics[0],
                    contract.filters.DepositToken().topics[0],
                    contract.filters.TokenWithdraw().topics[0],
                    contract.filters.EtherWithdraw().topics[0],
                ]
            ]
        });

        const oldBlock = await this.web3Service.provider.getBlock(currentBlock - delta);
        const newBlock = await this.web3Service.provider.getBlock(currentBlock);
        const duration = newBlock.timestamp - oldBlock.timestamp;

        const results = rawResults.map(res => contract.interface.parseLog(res));
        let allContracts = rawResults.map(res => res.address);
        allContracts = allContracts.filter((value, i) => allContracts.indexOf(value) === i);

        const tokenWallets: Array<string> = await Promise.all(allContracts.map(c => {
            return new Promise(async resolve => {
                try {
                    const cc = new ethers.Contract(
                        c,
                        KYBER_ABI,
                        this.web3Service.provider
                    );
                    resolve(await cc.tokenWallet(tokenAddress));
                } catch(err) {
                    resolve('0x0000000000000000000000000000000000000000')
                }
            });
        }));

        //

        const [
            currentEthBalances,
            currentTknBalances,
            // currentWalletBalances
        ]: Array<Array<BigNumber>> = await Promise.all([
            Promise.all(
                allContracts.map(c => this.web3Service.provider.getBalance(c))
            ),
            // Promise.all(
            //     allContracts.map(c => this.tokenService.getTokenBalanceByAddress(tokenAddress, c))
            // ),
            Promise.all(
                tokenWallets.map(w => w == '0x0000000000000000000000000000000000000000' ? ethers.utils.bigNumberify(0) : this.tokenService.getTokenBalanceByAddress(tokenAddress, w))
            )
        ]);

        let totalEthSum = currentEthBalances.reduce((a,b) => a.add(b), ethers.utils.bigNumberify(0));
        let totalTknSum = currentTknBalances.reduce((a,b,i) => a.add(b).add(
            //tokenWallets[i] !== allContracts[i] ? currentWalletBalances[i] : ethers.utils.bigNumberify(0)
            ethers.utils.bigNumberify(0)
        ), ethers.utils.bigNumberify(0));
        let feePercent = ethers.utils.bigNumberify(0);

        // event TradeExecute(
        //     address indexed origin,
        //     address src,
        //     uint srcAmount,
        //     address destToken,
        //     uint destAmount,
        //     address destAddress
        // );

        for (let i = results.length - 1; i > 0; i--) {

            const j = allContracts.indexOf(rawResults[i].address);
            if (j == -1) {
                continue;
            }

            if (results[i].topic === contract.filters.DepositToken().topics[0]) {

                if (results[i].values.token.toLowerCase() === tokenAddress.toLowerCase()) {

                    currentTknBalances[j] = currentTknBalances[j].sub(results[i].values.amount);
                    totalTknSum = totalTknSum.sub(results[i].values.amount);

                } else if (results[i].values.token.toLowerCase() === ETH_TOKEN_ADDRESS.toLowerCase()) {

                    currentEthBalances[j] = currentEthBalances[j].sub(results[i].values.amount);
                    totalEthSum = totalEthSum.sub(results[i].values.amount);
                }
            }

            if (results[i].topic === contract.filters.TokenWithdraw().topics[0]) {

                if (results[i].values.token.toLowerCase() === tokenAddress.toLowerCase()) {

                    currentTknBalances[j] = currentTknBalances[j].add(results[i].values.amount);
                    totalTknSum = totalTknSum.add(results[i].values.amount);

                } else if (results[i].values.token.toLowerCase() === ETH_TOKEN_ADDRESS.toLowerCase()) {

                    currentEthBalances[j] = currentEthBalances[j].add(results[i].values.amount);
                    totalEthSum = totalEthSum.add(results[i].values.amount);
                }
            }

            if (results[i].topic === contract.filters.EtherWithdraw().topics[0]) {

                currentEthBalances[j] = currentEthBalances[j].add(results[i].values.amount);
                totalEthSum = totalEthSum.add(results[i].values.amount);
            }

            if (results[i].topic === contract.filters.TradeExecute().topics[0]) {

                if (results[i].values.src.toLowerCase() === tokenAddress.toLowerCase() &&
                    results[i].values.destToken.toLowerCase() === ETH_TOKEN_ADDRESS.toLowerCase()) {

                    const invariant = currentEthBalances[j].mul(currentTknBalances[j]);
                    currentEthBalances[j] = currentEthBalances[j].add(results[i].values.destAmount);
                    currentTknBalances[j] = currentTknBalances[j].sub(results[i].values.srcAmount);
                    totalEthSum = totalEthSum.add(results[i].values.destAmount);
                    totalTknSum = totalTknSum.sub(results[i].values.srcAmount);
                    const fee = invariant.sub(currentEthBalances[j].mul(currentTknBalances[j]));
                    //feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(totalEthSum.mul(totalTknSum)));
                    feePercent = feePercent.add(results[i].values.destAmount.div(10000).mul(1e9).mul(1e9).div(currentEthBalances[j]));
                }

                if (results[i].values.src.toLowerCase() === ETH_TOKEN_ADDRESS.toLowerCase() &&
                    results[i].values.destToken.toLowerCase() === tokenAddress.toLowerCase()) {

                    const invariant = currentEthBalances[j].mul(currentTknBalances[j]);
                    currentEthBalances[j] = currentEthBalances[j].sub(results[i].values.srcAmount);
                    currentTknBalances[j] = currentTknBalances[j].add(results[i].values.destAmount);
                    totalEthSum = totalEthSum.sub(results[i].values.srcAmount);
                    totalTknSum = totalTknSum.add(results[i].values.destAmount);
                    const fee = invariant.sub(currentEthBalances[j].mul(currentTknBalances[j]));
                    //feePercent = feePercent.add(fee.mul(1e9).mul(1e9).div(totalEthSum.mul(totalTknSum)));
                    feePercent = feePercent.add(results[i].values.srcAmount.div(10000).mul(1e9).mul(1e9).div(currentEthBalances[j]));
                }
            }
        }

        return feePercent.mul(365 * 24 * 60 * 60).div(duration).mul(10000).div(1e9).div(1e9).toNumber() / 100;
    }

    async slippage(tokenAddress: string, amount: BigNumber): Promise<number> {

        // const exchangeAddress = await this.getExchangeAddress(tokenAddress);
        // const interest = await this.interest(tokenAddress);

        // const balance = await this.tokenService.getTokenBalanceByAddress(tokenAddress, exchangeAddress);

        // return balance.mul(Math.floor(interest * 100)).div(balance.add(amount)).toNumber() / 100 - interest;
        return 0;
    }

    async deposit(tokenAddress: string, amount: BigNumber) {

        // const contract = new ethers.Contract(
        //     await this.getExchangeAddress(tokenAddress),
        //     UNISWAP_ABI,
        //     this.web3Service.txProvider
        // );

        // await contract.addLiquidity(1, ethers.utils.bigNumberify(1).pow(255), 1000000000, {value: amount});
    }

    async withdraw(tokenAddress: string, walletAddress: string) {

    }
}
