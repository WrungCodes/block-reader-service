import mongoose from 'mongoose';
import { Blockchain, BlockchainDoc } from "./models/blockchain";

import "reflect-metadata"
import { Extractor } from "./services/extractor";

const start = async () => {

    const mongouri = "mongodb+srv://danieltosinfayemi:mEyya0oKtGWEwUMI@cluster0.2ixnhz5.mongodb.net/softpayextract?retryWrites=true&w=majority"
    // /**
    //  * This is the key used to authenticate the Kafka
    //  */
    // if (!process.env.KAFKA_KEY) {
    //     throw new Error('KAFKA_KEY must be defined');
    // }

    /**
     * This key is for mongodb database
     */
    // if (!process.env.MONGO_URI) {
    //     throw new Error('MONGO_URI must be defined');
    // }

    /**
     * Here we try to connect to the mongodb database using the Key before procedding
     * This would save some errors from occuring, mostly errors due to Invalid Mongo Credentials
     * or Some Database unavalability
     */
    try {
        await mongoose.connect(mongouri);
        // await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDb');
    } catch (err) {
        console.error(err);
    }

    let blockchainsInDatabase: (BlockchainDoc & {_id: mongoose.Types.ObjectId; })[] = [];

    /**
    * Get all enabled blockchains in the database so we can begin extracting
    */
    try {
        blockchainsInDatabase = await Blockchain.find({ enabled: true });
    } catch (err) {
        console.error(err);
    }

    console.log(blockchainsInDatabase)

    for (const blockchain of blockchainsInDatabase) {
        
        /**
         * List of Extractor Instance being run for a particular blockchain
         */
        const extractors : Extractor[] = []

        /**
         * If the confirmation of this blockchain is greater than zero, i.e requires an addition of 
         * x blocks ahead to be confirmed then we should create a DIRTY BLOCK EXTRACTOR
         */
        if(blockchain.confirmations > 0)
        {
            /**
             * We are adding the extractor to extractors list, 
             * NT. the second param of isConfirmedType is false because this extractor would process unconfirmed blocks
             */
            extractors.push(new Extractor(blockchain, false, 'DIRTY'))
        }

        /**
         * We are adding a comfirmed block extractor to the list of extractors
         * NT. the second param of isConfirmedType is true because this extractor would process confirmed blocks
         */
        extractors.push(new Extractor(blockchain, true, 'CONFIRMED'))

        /**
         * We are adding an extractor to rescan blocks on Demand.
         * NT. the second param of isConfirmedType is true because we can only rescan confirmed blocks 
         */
        // extractors.push(new Extractor(blockchain, true, 'RESCAN'))

        /**
         * Loop through all the extractor created and initialize them
         */
        for (const extractor of extractors) {
            try {
                await extractor.init()
                console.log(`Extractor [${blockchain.name}][${extractor.type}] is starting ....`)
            } catch (error) {
                console.log(`Extractor [${blockchain.name}][${extractor.type}] error ${error} ....`)
            }
        }
    }
};

start();
