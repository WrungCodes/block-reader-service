import { lastValueFrom } from "rxjs";
import { Direction, IBlockchainExtractor, IBlockData, ITransaction } from "../interfaces";
import Long from 'long';
import BigNumber from 'bignumber.js';

/**
 * Extra Blockchain features for etherium like blockchains
 */
 export interface ETHLikeFeatures {
    /**
     * Setting this to true can enable searching & extracting for ERC20 like token transactions in blocks
     */
    includeERC20: boolean; // add ERC20 Tokens

    /**
     * The name given or attached to the found ERC20 like token
     */
    erc20ProviderName?: string;

    /**
     * The name of the native currency name e.g ETH, BNB ...
     */
    nativeProviderName: string;
}

export abstract class ETHLike implements IBlockchainExtractor {

    /**
     * Provider is the blockchain provider of the ETH blockchain like e.g ETH, BSC
     */
    abstract provider: string;

    /**
     * the blocktime of the blockchain in seconds
     */
    abstract blockTime: number;

    features: ETHLikeFeatures = {
        includeERC20: false,
        erc20ProviderName: 'ERC20',
        nativeProviderName: 'ETH'
    };

    /**
     * Indicates if the blockchain is testnet
     */
    protected testnet: boolean = false;

    /**
     * Web3 Package. e.g require('web3') 
     */
    protected web3: any;

    /**
     * web3 instance loaded with uri
     */
    protected api: any;

    /**
     * Add event signature that shows a erc20 transfer occured
     */
    protected transferEventSignature: any;

    /**
     * used to decode the amount from each erc20 token transaction 
     */
    protected decoder: any | undefined;

    /**
     * the address to be ignored, this address is used for subsidy
     */
    protected subsidyAddress: string = '';

    async getLatestBlock(): Promise<number> {
        return this.api.eth.getBlockNumber();
    }

    async extract(number: number): Promise<IBlockData> {        

        const transactions: ITransaction[] = [];

        const block: IBlockETHLike = await this.api.eth.getBlock(number, true)

        if (block.transactions && block.transactions.length) {

            const timestamp = Long.fromNumber(block.timestamp,true);

            const transaction = {
                blockchain: this.provider,
                number: block.number,
                timestamp: timestamp,
            };

            const transactionDataList = [];

            for( const trans of block.transactions ) 
            {
                transactionDataList.push([trans.hash, trans.value])
            }

            // get all transaction receipt or events from actions in Smart Contracts
            const receipts = await Promise.all(transactionDataList.map(([txHash, txValue]) => this.api.eth.getTransactionReceipt(txHash)));

            // get the event data from each of the receipts
            const txData = transactionDataList.map((v, i) => [v, receipts[i]]);

            for (const [[hash, value], receipt] of txData) 
            {
                if (!receipt || !receipt.status) 
                {
                    // Transaction was not successful, EVM reverted it so skip
                    continue; 
                }

                // add all the provider transactions
                // first check if the address is the subsidy address
                if (
                    receipt.from 
                    && receipt.to 
                    && value !== '0' 
                    && receipt.from.toLowerCase() !== this.subsidyAddress 
                    && receipt.to.toLowerCase() !== this.subsidyAddress
                ) {
                    const blockchainTx = {
                        provider: this.features.nativeProviderName,
                        transactionHash: receipt.transactionHash,
                        address: receipt.to,
                        amount: value,
                        direction: Direction.TO,
                        ...transaction
                    };

                    transactions.push(blockchainTx);
                }

                // check if the include erc20 token transactions is enabled
                if (!this.features.includeERC20) {
                    continue;
                }

                let tokensProvider: string = this.features.erc20ProviderName ? this.features.erc20ProviderName : 'ERC20';
                tokensProvider = this.testnet ?  `${tokensProvider}_TESTNET` : tokensProvider;

                // see if any smart contract execution and it's results
                for (const log of receipt.logs) 
                {
                    // We are only looking for 'Transfer' events as they declared by ERC20
                    if (this.transferEventSignature === log.topics[0] && log.topics.length === 3) 
                    {
                        const toAddress = this.api.eth.abi.decodeParameter('address', log.topics[2]).toLowerCase();
                        const blockchainAmount = this.api.eth.abi.decodeParameter('uint256', log.data);

                        let amountValue = blockchainAmount;

                        const indexObj = this.getIndex(tokensProvider, transaction.number, log);

                        const blockchainTx = {
                            provider: tokensProvider,
                            transactionHash: receipt.transactionHash,
                            address: toAddress,
                            amount: amountValue,
                            blockchainAmount,
                            direction: Direction.TO,
                            currency: {
                                id: log.address.toLowerCase(),
                            },
                            ...indexObj,
                            ...transaction
                        };

                        transactions.push(blockchainTx);
                    }
                }
            }

        }
        
        const blockData: IBlockData = {
            provider: this.provider,
            blocknumber: number,
            transactions
        }

        return blockData;
    }

    getBlockchain(): string {
        return this.provider;
    }

    getBlockTime(): number {
        return this.blockTime;
    }

    async getBlockData(number: number): Promise<IBlockData> {
        return await this.extract(number)
    }

    getIndex(tokensProvider: string, blocknum: number, log: any) {
        return {}
    }
}

export interface IBlockETHLike {
    number: number;
    hash: string;
    parentHash: string;
    nonce: number;
    sha3Uncles: string;
    logsBloom: string;
    transactionRoot: string;
    stateRoot: string;
    miner: string;
    difficulty: string;
    totalDifficulty: string;
    extraData: string;
    size: number;
    gasLimit: number;
    gasUsed: number;
    timestamp: number;
    transactions: ITransactionETHLike[];
    uncles: string[];
}

export interface ITransactionETHLike {
    hash: string;
    nonce: number;
    blockHash: string;
    blockNumber: number;
    transactionIndex: number;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gas: number;
    input: string;
}

export interface IReceiptETHLike {
    status: boolean;
    blockHash: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    from: string;
    to: string;
    contractAddress: string;
    cumulativeGasUsed: number;
    gasUsed: number;
    logs: ILogETHLike[];
}

export interface ILogETHLike {
    address: string;
    data: string;
    topics: string[];
    logIndex: number;
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
}