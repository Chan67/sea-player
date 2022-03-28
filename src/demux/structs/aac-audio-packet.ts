export enum AACPacketType {
    SEQUENCE_HEADER = 0, // AAC sequence header
    AAC_RAW = 1 // AAC raw
}
// The AudioSpecificConfig is explained in ISO 14496-3.
export interface AudioSpecificConfig {
    audioObjectType: number;
    channelConfiguration: number;
    samplingFrequencyIndex: number;
    samplingRate: number;
    // assume ISO/IEC 14496-12 AudioSampleEntry default of 16
}

class AACAudioPacket {
    soundFormat: number;
    soundRate: number;
    soundSize: number;
    soundType: number;
    aacPacketType?: AACPacketType;
    audioSpecificConfig?: AudioSpecificConfig;
    data: Uint8Array;

    private readonly _mpegSamplingRates = [
        96000, 88200, 64000, 48000, 44100, 32000,
        24000, 22050, 16000, 12000, 11025, 8000, 7350
    ];

    constructor(buffer: Uint8Array) {
        this.soundFormat = (buffer[0] & 0xf0) >> 4;
        this.soundRate = (buffer[0] & 0x0c) >> 2;
        this.soundSize = (buffer[0] & 0x02) >> 1;
        this.soundType = (buffer[0] & 1);

        this.aacPacketType = buffer[1];
        this.data = buffer.slice(2);

        if (this.aacPacketType == AACPacketType.SEQUENCE_HEADER) {
            this.audioSpecificConfig = this._parseAudioSpecificConfig(this.data);
        }
    }
    private _parseAudioSpecificConfig(buffer: Uint8Array): AudioSpecificConfig {
        let audioObjectType = buffer[0] >> 3;

        let samplingFrequencyIndex = ((buffer[0] & 0x7) << 1) | (buffer[1] >> 7);

        let samplingRate = this._mpegSamplingRates[samplingFrequencyIndex];

        let channelConfiguration = (buffer[1] >> 3) & 0x0f;

        return {
            audioObjectType,
            channelConfiguration,
            samplingFrequencyIndex,
            samplingRate
        }
    }
}
export default AACAudioPacket;