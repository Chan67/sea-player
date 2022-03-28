import { FlvOnMediaInfo } from "../demux/flv-type";

export enum TransmuxerEvents {
    IO_ERROR = 'io_error',
    MEDIA_INFO = 'media_info',
    VIDEO_DATA_ARRIVED = 'video_data_arrived',
    AUDIO_DATA_ARRIVED = 'audio_data_arrived',
    INIT_DECODER_COMPLETE = 'Init_Decoder_Complete',
}

export interface MediaVideoData {
    timestamp: number;
    chunk: Uint8Array;
    width: number;
    height: number;
}
export interface MediaAudioData {
    timestamp: number;
    chunk: Uint8Array;
}
export type VideoDataArrived = (
    data: MediaVideoData
) => void;
export type AudioDataArrived = (
    buffer: MediaAudioData
) => void;
export type DecoderInitComplete = () => void;

export interface TransmuxerCallbacks {
    onMediaInfo: FlvOnMediaInfo;
    onVideoDataArrived: VideoDataArrived;
    onAudioDataArrived: AudioDataArrived;
    onDecoderInitComplete: DecoderInitComplete;
}