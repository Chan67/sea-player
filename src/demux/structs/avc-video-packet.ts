import BufferHelper from "../../utils/buffer-helper";
import { logger } from "../../utils/logger";

export interface AVCDecoderConfigurationRecord {
    version: number;
    profile: number;
    profileCompatibility: number;
    level: number;
    naluSizeLength: number;
    spsNalus: Uint8Array[];
    ppsNalus: Uint8Array[];
}

class AVCVideoPacket {
    avcPacketType: number;
    decoderConfigurationRecord?: AVCDecoderConfigurationRecord;
    cts: number;
    data: Uint8Array;
    codecId: number;

    constructor(buffer: Uint8Array) {
        // console.log(buffer)
        let spec = buffer[0];
        let frameType = (spec & 240) >>> 4;
        let codecId = spec & 15;
        this.codecId = codecId;
        // console.log(`${frameType} ${codecId}`);

        this.avcPacketType = buffer[1];

        let cts_unsigned = BufferHelper.readUint24(buffer.slice(2, 2 + 3)) & 0x00ffffff;
        this.cts = cts_unsigned << 8 >> 8;  // convert to 24-bit signed int
        this.data = buffer.slice(5);

        // 0 : AVC sequence header
        // 1 : One or more NALUs
        // 2 : AVC end of sequence
        if (this.avcPacketType === 0 && codecId == 7) {
            this.decoderConfigurationRecord = this._parseAVCDecoderConfigurationRecord(this.data);
        }
    }

    private _parseAVCDecoderConfigurationRecord(data: Uint8Array): AVCDecoderConfigurationRecord {
        let version = data[0]; // configurationVersion
        let profile = data[1]; // avcProfileIndication
        let profileCompatibility = data[2];  // profile_compatibility
        let level = data[3]; // AVCLevelIndication

        let naluSizeLength = 1 + (data[4] & 0x03);

        let spsCount = data[5] & 0x1f;
        let offset = 6;
        if (spsCount === 0) {
            logger.error(`Flv: Invalid AVCDecoderConfigurationRecord: No SPS`);
        }
        else if (spsCount > 1) {
            logger.warn(`Flv: Strange AVCDecoderConfigurationRecord: SPS Count = ${spsCount}`);
        }
        let spsNalus: Uint8Array[] = [];

        for (let i = 0; i < spsCount; i++) {
            let spsDataLength = (data[offset] << 8) | data[offset + 1];
            offset += 2;

            let sps = data.slice(offset, offset + spsDataLength);
            offset += spsDataLength;
            spsNalus.push(sps);
        }
        let ppsCount = data[offset];
        if (ppsCount === 0) {
            logger.error(`Flv: Invalid AVCDecoderConfigurationRecord: No PPS`);
        } else if (ppsCount > 1) {
            logger.warn(`Flv: Strange AVCDecoderConfigurationRecord: PPS Count = ${ppsCount}`);
        }
        offset++;
        let ppsNalus: Uint8Array[] = [];
        for (let i = 0; i < ppsCount; i++) {
            let ppsDataLength = (data[offset] << 8) | data[offset + 1];
            offset += 2;

            let pps = data.slice(offset, offset + ppsDataLength);
            ppsNalus.push(pps);
            offset += ppsDataLength;
        }

        return {
            version,
            profile,
            profileCompatibility,
            level,
            naluSizeLength,
            spsNalus,
            ppsNalus
        }
    }
}

export default AVCVideoPacket;