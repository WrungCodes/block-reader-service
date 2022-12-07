import { BSC } from './ether-like/bsc/bsc';

// const blockchains : Map<string, Function> = new Map<string, Function>([]);
const blockchains : Map<any, any> = new Map<any, any>([]);

blockchains.set(BSC.blockchainName, BSC);

export default blockchains;