

class FlvTag {
    tagType: number;
    dataSize: number;
    timestamp: number;
    streamId: number;
    tagData: Uint8Array;
    previousTagSize: number;

    constructor(buffer: ArrayBuffer) {
        let data = new Uint8Array(buffer);
        let v = new DataView(buffer);

        this.tagType = v.getUint8(0);
        this.dataSize = v.getUint32(0) & 0x00ffffff;
        // console.log(`${this.tagType} ${this.dataSize}`)

        let timestamp = v.getUint32(3) & 0x00ffffff;
        let timestampExtended = v.getUint8(7);
        this.timestamp = timestamp + (timestampExtended << 24);

        this.streamId = v.getUint32(7) & 0x00ffffff;

        this.tagData = data.slice(11, 11 + this.dataSize);

        this.previousTagSize = v.getUint32(11 + this.dataSize);
    }

    valid(): boolean {
        return this.previousTagSize == 11 + this.dataSize;
    }
}

export default FlvTag;