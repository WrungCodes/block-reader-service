import { retryUntilSuccess } from "@softpay/common";
import { Writable } from "stream";
import { IBlockData } from "../blockchains/interfaces";
import { Extractor } from "../services/extractor";

export class EventWriter extends Writable{

    constructor(private service: Extractor){
        super({ objectMode: true });
    }

    async _write(chunk: IBlockData, encoding: BufferEncoding, callback: (error?: Error | null | undefined) => void): Promise<void> {

        await retryUntilSuccess(this, this.writeBlock, [chunk], {
            sleep: 30 * 1000,
            retry: Infinity,
            failMessage: `Event writer stream for ${this.service.model.name} (${this.service.type}) failed`
        });
        
        callback();
    }

    private async writeBlock(chunk: IBlockData): Promise<void> {
        const maxTx = 10000;
        const time = process.hrtime.bigint();

        // raise and event to our event provider that block has been recieved

        console.info(`[${this.service.model.name}][${this.service.type}] BLOCK #${chunk.blocknumber} HAS BEEN WRITTEN`);
    }
}