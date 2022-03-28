export interface RenderAudioMediaInfo {
    timestamp: number;
    chunk: Uint8Array;
}

export interface RenderVideoMediaInfo {
    timestamp: number;
    chunk: Uint8Array;
    width: number;
    height: number;
}
export interface RenderMediaInfo {
    videoData?: RenderVideoMediaInfo;
    audioData?: RenderAudioMediaInfo;
}