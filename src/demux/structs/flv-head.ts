class FlvHead {
    signature: string;
    version: number;
    hasAudio: boolean;
    hasVideo: boolean;
    dataOffset: number;

    constructor(buffer: ArrayBuffer) {
        let data = new Uint8Array(buffer);
        this.signature =
            String.fromCharCode(data[0]) + // F
            String.fromCharCode(data[1]) + // L
            String.fromCharCode(data[2]); // V

        this.version = data[3];
        this.hasAudio = ((data[4] & 4) >>> 2) !== 0;
        this.hasVideo = (data[4] & 1) !== 0;
        this.dataOffset = new DataView(data.buffer, 5).getUint32(0);

    }

    valid(): boolean {
        return this.signature === 'FLV';
    }
}

export default FlvHead;