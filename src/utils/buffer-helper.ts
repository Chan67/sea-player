class BufferHelper {
    static readUint8(buffer: ArrayBuffer): number {
        let data = new Uint8Array(buffer);
        return data[0];
    }

    static readUint16(buffer: ArrayBuffer): number {
        let data = new Uint8Array(buffer);
        return (data[0] & 0xFF)
            | ((data[1] & 0xFF) << 8);
    }

    static readUint24(buffer: ArrayBuffer): number {
        let data = new Uint8Array(buffer);
        return ((data[0] & 0xFF) << 16)
            | ((data[1] & 0xFF) << 8)
            | (data[2] & 0xFF);
    }

    static readUint32(buffer: ArrayBuffer): number {
        let data = new Uint8Array(buffer);
        return ((data[0] & 0xFF) << 24)
            | ((data[1] & 0xFF) << 16)
            | ((data[2] & 0xFF) << 8)
            | ((data[3] & 0xFF));
    }
}
export default BufferHelper;