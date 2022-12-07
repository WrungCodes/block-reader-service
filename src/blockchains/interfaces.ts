import Long from "long";

export interface IBlockchainExtractor {
    extract(blocknumber: number): Promise<IBlockData>;
    getLatestBlock(): Promise<number>;
}

export interface IBlock {}

export interface IBlockchainUtils{}

export enum Direction {
    FROM = 0,
    TO = 1,
}

export interface ICurrency {
    id: string;
    name?: string;
}

export interface IBlockData {
    provider: string;
    blocknumber?: number;
    height?: number;
    transactions: ITransaction[];
}

export interface ITransaction {
    blockchain: string;
    provider: string;
    number: number;
    address: string;
    transactionHash: string;
    direction: Direction;
    currency?: ICurrency;
    amount: string;
    blockchainAmount?: string;
    timestamp?: Long;
    memo?: string;
    index?: number;
}