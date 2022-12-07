import { ETHLike, ETHLikeFeatures } from "../ether-like";
import Web3 from 'web3';
import InputDataDecoder from 'ethereum-input-data-decoder';

export class BSC extends ETHLike {

    static blockchainName = 'BSC';
    
    provider: string = 'BSC';

    blockTime: number = 3;

    features: ETHLikeFeatures = {
        includeERC20: true,
        nativeProviderName: 'BNB',
        erc20ProviderName: 'BEP20'
    };

    constructor( options: { uri: string, subsidy: string } ) 
    { 
        super();
        this.web3 =  Web3;
        this.api = new this.web3(options.uri);
        this.transferEventSignature = this.web3.utils.sha3('Transfer(address,address,uint256)');
        this.subsidyAddress = options.subsidy ? options.subsidy.toLowerCase() : '';
        this.decoder = new InputDataDecoder([
            {
                inputs: [
                    { internalType: 'address', name: 'recipient', type: 'address' },
                    { internalType: 'uint256', name: 'amount', type: 'uint256' }
                ],
                name: 'transfer',
                outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
                stateMutability: 'nonpayable',
                type: 'function'
            }
        ]);
        this.api.utils.hexToNumber = (value:any) => {
            if (!value) {
                return value;
            }
            try {
                return  parseInt(value, 16);
            } catch (e) {
                return  value.toString();
            }
        };
    }

    getIndex(tokensProvider: string, blocknum: number, log: any) {
        if (tokensProvider === 'BEP20' && blocknum > 14250000
            && !!log.logIndex && typeof +log.logIndex === 'number') {
            return { index: +log.logIndex }
        }
        return {}
    }
}