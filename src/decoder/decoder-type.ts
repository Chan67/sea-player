export type DecoderOnFrame = (
    buffer: ArrayBuffer,
    width: number,
    height: number,
    pts: number
) => void;

export type DecoderInitComplete = () => void;

export interface DecoderCallbacks {
    OnFrame: DecoderOnFrame;
    OnInitComplete: DecoderInitComplete;
}