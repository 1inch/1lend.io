import { BigNumber } from 'ethers/utils';

export interface PoolInterface {
    getFormatedBalance(tokenSymbol: string, wallet: string): Promise<string>;
    getBalance(tokenSymbol: string, wallet: string): Promise<BigNumber>;
    interest(tokenSymbol: string): Promise<number>;
    deposit(tokenSymbol: string, amount: BigNumber);
    withdraw(tokenSymbol: string, amount: BigNumber);
}
