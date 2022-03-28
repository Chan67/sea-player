
export enum MediaType {
    Audio,
    Video
}
export interface FlvMediaInfo {
    hasAudio: boolean;
    hasVideo: boolean;
    width: number;
    height: number;
    fps: number;
    audioConfig: AudioConfig;
}
export interface AudioConfig {
    channelCount: number;
    sampleRate: number;
}
export interface FlvMediaData {
    type: MediaType;
    timestamp: number;
    chunk: ArrayBuffer;
    codecId?: number;
}

export type FlvOnMediaInfo = (
    info: FlvMediaInfo
) => void;

export type FlvOnMediaData = (
    data: FlvMediaData
) => void;

export interface FlvDemuxerCallbacks {
    onMediaInfo: FlvOnMediaInfo;
    onMediaData: FlvOnMediaData
}