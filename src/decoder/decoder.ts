import { logger } from '../utils/logger';
import { DecoderCallbacks } from './decoder-type'

class Decoder {
    private Module: any;
    private callbacks?: DecoderCallbacks;
    private loaded: boolean = false;
    private cachePackets: Uint8Array[] = [];
    constructor() {
    }

    /**
     * 
     * @param module 
     * @param type 0:h264 1:hevc
     * @param callbacks 
     */
    load(module: any, type: number, callbacks: DecoderCallbacks) {
        this.Module = module;
        this.callbacks = callbacks;

        this.Module.onRuntimeInitialized = () => {
            // console.log('onRuntimeInitialized');
            const videoCallback = this.Module.addFunction(this.decoderYUVDataCallback.bind(this), 'viiiii');

            this.Module._init_decoder(type, videoCallback);

            this.loaded = true;

            this.callbacks?.OnInitComplete();
        }
    }

    decode(data: ArrayBuffer, pts: number) {
        // logger.info("视频解码");
        const size = data.byteLength
        const bufferPtr = this.Module._malloc(size);
        this.Module.HEAPU8.set(data, bufferPtr);
        this.Module._decode_data(bufferPtr, size, pts);
        this.Module._free(bufferPtr);
    }

    private decoderYUVDataCallback($bufferPtr: number, size: number, width: number, height: number, pts: number) {
        let arrayBuffer = this.Module.HEAPU8.subarray($bufferPtr, $bufferPtr + size);
        this.callbacks?.OnFrame(arrayBuffer, width, height, pts);
    }
}
export default Decoder;