import { BigNumber } from 'ethers/utils';

export interface PoolInterface {
    getFormatedBalance(tokenSymbol: string, wallet: string): Promise<string>;
    getBalance(tokenSymbol: string, wallet: string): Promise<BigNumber>;
    interest(tokenSymbol: string): Promise<Array<number>>;
    deposit(tokenSymbol: string, amount: BigNumber);
    withdraw(tokenAddress: string, walletAddress: string);
}
