import BufferHelper from "../utils/buffer-helper";
import { logger } from "../utils/logger";
import { FlvDemuxerCallbacks, FlvMediaData, FlvMediaInfo, MediaType } from "./flv-type";
import AVCVideoPacket from "./structs/avc-video-packet";
import FlvHead from "./structs/flv-head";
import FlvTag from "./structs/flv-tag";
import AMF from "./structs/flv-amf";
import AACAudioPacket, { AACPacketType, AudioSpecificConfig } from "./structs/aac-audio-packet";

enum FlvTagTypes {
    AudioTag = 8,
    VideoTag = 9,
    ScriptTag = 18
}

class FlvDemuxer {
    private position: number = 0;
    private flvHead?: FlvHead;
    private cacheBuffer: ArrayBuffer = new ArrayBuffer(0);
    private flvMediaInfo: FlvMediaInfo;
    private callbacks: FlvDemuxerCallbacks;
    private naluSizeLength: number = 4;
    private nalStart = new Uint8Array([0x00, 0x00, 0x00, 0x01]);

    private audioSpecificConfig?: AudioSpecificConfig;

    constructor(callbacks: FlvDemuxerCallbacks) {
        this.callbacks = callbacks;

        this.flvMediaInfo = {
            hasAudio: false,
            hasVideo: false,
            width: 0,
            height: 0,
            fps: 0,
            audioConfig: {
                channelCount: 2,
                sampleRate: 8000
            }
        };
    }

    destroy(): void {
        this.flvHead = undefined;
        this.cacheBuffer = new ArrayBuffer(0);
        this.flvMediaInfo = {
            hasAudio: false,
            hasVideo: false,
            width: 0,
            height: 0,
            fps: 0,
            audioConfig: {
                channelCount: 2,
                sampleRate: 8000
            }
        };
        this.audioSpecificConfig = undefined;
    }

    parseChunks(chunk: ArrayBuffer) {
        let buffer: ArrayBuffer = this.cacheBuffer ? this._mergeBuffer(this.cacheBuffer, chunk) : chunk;
        this.cacheBuffer = new ArrayBuffer(0);
        let offset = 0;
        if (!this.flvHead) {
            if (buffer.byteLength < 13) {
                this._pushCache(buffer);
                return;
            }
            //FLV header
            let headBuffer = buffer.slice(0, 9);
            this.flvHead = new FlvHead(headBuffer);
            offset += 9;
            if (this.flvHead != null && this.flvHead.valid()) {
                this.flvMediaInfo.hasAudio = this.flvHead.hasAudio;
                this.flvMediaInfo.hasVideo = this.flvHead.hasVideo;
            }

            //PreviousTagSize0
            let tagSizeBuf = buffer.slice(offset, offset + 4);
            let prevTagSize0 = BufferHelper.readUint32(tagSizeBuf);
            if (prevTagSize0 !== 0) {
                logger.error(`prevTagSize0: ${prevTagSize0} ??!`);
            }
            offset += 4;
        }

        let bufferLen = buffer.byteLength;
        while (offset < bufferLen) {
            let dataSize = BufferHelper.readUint24(buffer.slice(offset + 1, offset + 1 + 3));
            // tag
            let tagSize = 11 + dataSize + 4;
            if (bufferLen < offset + tagSize) {
                let cache = buffer.slice(offset);
                this._pushCache(cache);
                break;
            }
            let flvTagBuf = buffer.slice(offset, offset + tagSize);

            let flvTag = new FlvTag(flvTagBuf);
            if (!flvTag.valid()) {
                logger.error(`Invalid flvTag !`);
            }
            // logger.log(`${flvTag.tagType} ${flvTag.dataSize}`);

            switch (flvTag.tagType) {
                case FlvTagTypes.AudioTag:
                    this._parseAudioPacket(flvTag.tagData, flvTag.timestamp);
                    break;
                case FlvTagTypes.VideoTag:
                    this._parseAVCVideoPacket(flvTag.tagData, flvTag.timestamp);
                    break;
                case FlvTagTypes.ScriptTag:
                    this._parseScript(flvTag.tagData)
                    break;
                default:
                    break;
            }

            offset += tagSize;  // tagBody + dataSize + prevTagSize
        }
    }
    private _parseAVCVideoPacket(data: Uint8Array, tagTimestamp: number): void {
        let avcVideoPacket = new AVCVideoPacket(data);
        // logger.info(tagTimestamp, avcVideoPacket);
        if (avcVideoPacket.avcPacketType == 0) { // AVCDecoderConfigurationRecord
            if (avcVideoPacket.decoderConfigurationRecord != null) {
                this.naluSizeLength = avcVideoPacket.decoderConfigurationRecord?.naluSizeLength;
                // sps pps
                let sps = avcVideoPacket.decoderConfigurationRecord?.spsNalus[0];
                let pps = avcVideoPacket.decoderConfigurationRecord?.ppsNalus[0];
                let merge = this._mergeBuffer(this.nalStart, sps, this.nalStart, pps);
                this.callbacks.onMediaData({
                    type: MediaType.Video,
                    timestamp: -1,
                    chunk: merge
                });
            }
        } else if (avcVideoPacket.avcPacketType == 1) { // One or more Nalus
            let dataSize = avcVideoPacket.data.length;
            let offset = 0;
            let chunk = new ArrayBuffer(0);
            while (offset < dataSize) {
                let naluSize = BufferHelper.readUint32(avcVideoPacket.data.slice(offset, offset + 4));
                offset += 4;
                let nalus = avcVideoPacket.data.slice(offset, offset + naluSize);
                chunk = this._mergeBuffer(chunk, this.nalStart, nalus);
                offset += naluSize;
            }
            let mediaData: FlvMediaData = {
                type: MediaType.Video,
                timestamp: tagTimestamp,
                chunk: chunk,
                codecId: avcVideoPacket.codecId,
            }
            this.callbacks.onMediaData(mediaData);
        } else if (avcVideoPacket.avcPacketType == 2) {
            // empty, AVC end of sequence
        } else {
            // error
        }
    }
    private _parseScript(data: Uint8Array) {
        let scriptData = AMF.parseScriptData(data.buffer);
        // logger.info(scriptData);
        if (scriptData.hasOwnProperty('onMetaData')) {
            let onMetaData = scriptData.onMetaData;

            if (typeof onMetaData.width === 'number') {  // width
                this.flvMediaInfo.width = onMetaData.width;
            }
            if (typeof onMetaData.height === 'number') {  // height
                this.flvMediaInfo.height = onMetaData.height;
            }
            if (typeof onMetaData.framerate === 'number') {  // framerate
                this.flvMediaInfo.fps = onMetaData.framerate;
            }
            if (!this.flvMediaInfo.hasAudio) {
                this.callbacks.onMediaInfo(this.flvMediaInfo);
            }
        }
    }
    private _parseAudioPacket(data: Uint8Array, tagTimestamp: number) {
        // logger.info(`len ${data.length} tagTimestamp ${tagTimestamp}`);
        let soundSpec = data[0];
        let soundFormat = soundSpec >>> 4;
        if (soundFormat === 10) { //AAC
            let aacAudioPacket = new AACAudioPacket(data);
            if (aacAudioPacket.aacPacketType == AACPacketType.SEQUENCE_HEADER) {
                this.audioSpecificConfig = aacAudioPacket.audioSpecificConfig;
                if (this.audioSpecificConfig != null) {
                    this.flvMediaInfo.audioConfig.channelCount = this.audioSpecificConfig.channelConfiguration;
                    this.flvMediaInfo.audioConfig.sampleRate = this.audioSpecificConfig.samplingRate;
                }

                this.callbacks.onMediaInfo(this.flvMediaInfo);
            } else if (aacAudioPacket.aacPacketType == AACPacketType.AAC_RAW) {
                if (this.audioSpecificConfig != null) {
                    /**
                     * https://blog.jianchihu.net/flv-aac-add-adtsheader.html
                     */
                    const AdtsHeader = new Uint8Array(7);
                    AdtsHeader[0] = 0xff;
                    AdtsHeader[1] = 0xf0;
                    AdtsHeader[1] |= 0 << 3;
                    AdtsHeader[1] |= 0 << 1;
                    AdtsHeader[1] |= 1;
                    AdtsHeader[2] = (this.audioSpecificConfig.audioObjectType - 1) << 6;
                    AdtsHeader[2] |= (this.audioSpecificConfig.samplingFrequencyIndex & 0x0f) << 2;
                    AdtsHeader[2] |= 0 << 1;
                    AdtsHeader[2] |= (this.audioSpecificConfig.channelConfiguration & 0x04) >> 2;
                    AdtsHeader[3] = (this.audioSpecificConfig.channelConfiguration & 0x03) << 6;
                    AdtsHeader[3] |= 0 << 5;
                    AdtsHeader[3] |= 0 << 4;
                    AdtsHeader[3] |= 0 << 3;
                    AdtsHeader[3] |= 0 << 2;

                    const AdtsLen = aacAudioPacket.data.length + 7;
                    AdtsHeader[3] |= (AdtsLen & 0x1800) >> 11;
                    AdtsHeader[4] = (AdtsLen & 0x7f8) >> 3;
                    AdtsHeader[5] = (AdtsLen & 0x7) << 5;
                    AdtsHeader[5] |= 0x1f;
                    AdtsHeader[6] = 0xfc;

                    let aacData = this._mergeBuffer(AdtsHeader, aacAudioPacket.data);
                    let mediaData: FlvMediaData = {
                        type: MediaType.Audio,
                        timestamp: tagTimestamp,
                        chunk: aacData
                    }
                    this.callbacks.onMediaData(mediaData);
                }
            }
        } else {
            logger.error(`Flv: Unsupported Audio data`);
            return;
        }
    }

    private _pushCache(buf: ArrayBuffer): void {
        if (this.cacheBuffer) {
            this.cacheBuffer = this._mergeBuffer(this.cacheBuffer, buf);
        } else {
            this.cacheBuffer = buf;
        }
    }
    private _mergeBuffer(...buffers: ArrayBuffer[]): ArrayBuffer {
        return buffers.reduce((pre, val) => {
            const merge = new Uint8Array((pre.byteLength | 0) + (val.byteLength | 0));
            merge.set(new Uint8Array(pre), 0);
            merge.set(new Uint8Array(val), pre.byteLength | 0);
            return merge.buffer;
        }, new Uint8Array());
    }
}
export default FlvDemuxer;