import { BlockchainDoc } from "../models/blockchain";
import { BlockchainReader } from "../streams/blockchain-reader";
import blockchains from "../blockchains/index"
import { EventWriter } from "../streams/event-writer";

export class Extractor {
    constructor(
        /**
         * The Blockchain object gotten from the database, to get informations about the blockchain
         */
        public model: BlockchainDoc,

        /**
         * This is to verify the type of comfirmation this is, wither its meant to confirm for dirty or confirmed block
         */
        public isConfirmedType: boolean,

        /**
         * the type of Extractor that is being run.
         * DIRTY: this is to process or extract blocks that are yet to reach confirmation
         * CONFIRMED: this is to process or extract blocks that have been confirmed
         * RESCAN: this is to process blocks that have been previously processed
         */
        public type: 'DIRTY' | 'CONFIRMED' | 'RESCAN',
    ) { }

    async init() {

        if(blockchains.has(this.model.symbol)){
            const BlockchainReaderStream = new BlockchainReader(blockchains.get(this.model.symbol), this);
            const EventWriterStream = new EventWriter(this)

            BlockchainReaderStream.pipe(EventWriterStream)
        }
        else{ console.log(`Missing Blockchain with symbol ${this.model.symbol}`) }
    }
}