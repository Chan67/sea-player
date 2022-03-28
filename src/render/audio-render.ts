import { logger } from "../utils/logger";
import AudioQueue from "./audio-queue";

class AudioRender {
    private readonly BUFFER_SIZE = 4096;
    private _sampleRate: number;
    private _channels: number;

    private _decodeWaitBuffers: ArrayBuffer = new ArrayBuffer(0);
    private _timestamps: number[] = [];
    // private _bufferQueue: AudioQueue;
    private _audioCtx: AudioContext;
    // private _scriptNode: ScriptProcessorNode;
    private _gainNode: GainNode;

    private _currentTime: number = 0;
    private _muted: boolean = true;
    private _volume: number = 1.0;

    private _playing: boolean = false;
    private _audioBuffers: AudioBuffer[] = [];

    constructor(sampleRate: number, channels: number) {
        logger.info(`AudioRender ${sampleRate} ${channels}`);
        this._sampleRate = sampleRate;
        this._channels = channels;

        // this._bufferQueue = new AudioQueue(this._sampleRate, this._channels, this.BUFFER_SIZE);
        this._audioCtx = new AudioContext({
            sampleRate: this._sampleRate
        });

        // this._scriptNode = this._audioCtx.createScriptProcessor(this.BUFFER_SIZE, this._channels, this._channels);
        // this._scriptNode.onaudioprocess = this._audioProcess.bind(this);
        //音量控制
        this._gainNode = this._audioCtx.createGain();
        this._gainNode.gain.value = this._volume;
        // this._scriptNode.connect(this._gainNode);
        this._gainNode.connect(this._audioCtx.destination);
    }

    get muted() {
        return this._muted;
    }
    set muted(val) {
        this._muted = val;
        this._gainNode.gain.value = this._muted ? 0 : this._volume;
    }
    get volume() {
        return this._volume;
    }
    set volume(val) {
        this._volume = val;
        this._gainNode.gain.value = this._volume;
    }
    get currentTime() {
        return this._currentTime;
    }

    destroy() {
        this._sampleRate = 0;
        this._channels = 0;
        if (this._audioCtx) {
            // this._scriptNode.disconnect();
            this._gainNode.disconnect();
            this._audioCtx.close();
        }
        this._decodeWaitBuffers = new ArrayBuffer(0);
        this._timestamps = [];

        this._currentTime = 0;
        this._muted = true;
        this._volume = 1.0;
    }
    push(chunk: Uint8Array, timestamp: number) {
        let merge = this._decodeWaitBuffers;
        this._decodeWaitBuffers = this._mergeBuffer(merge, chunk.buffer);
        if (this._decodeWaitBuffers.byteLength > 2 * this._channels * 1024) {
            this._timestamps.push(timestamp);
            // logger.info('音频解码');
            this._audioCtx.decodeAudioData(this._decodeWaitBuffers).then((audioBuffer) => {
                this._audioBuffers.push(audioBuffer);
                if (!this._playing) {
                    this._playing = true;
                    this._play();
                }
            });
            this._decodeWaitBuffers = new ArrayBuffer(0);
        }
    }
    private _play() {
        this._currentTime = this._timestamps.shift() || 0;
        let audioBuffer = this._audioBuffers.shift();
        if (audioBuffer) {
            let bufferSource = this._audioCtx.createBufferSource();
            bufferSource.connect(this._gainNode);
            bufferSource.buffer = audioBuffer;
            bufferSource.start();
            bufferSource.onended = () => {
                this._play();
            }
        } else {
            this._playing = false;
        }
    }
    // private _audioProcess(evt: AudioProcessingEvent) {
    //     let audioData = this._bufferQueue.pop();
    //     if (audioData == null) {
    //         return
    //     }
    //     this._currentTime = Math.min(Math.round(this._audioCtx.currentTime * 1000), audioData.timestamp);
    //     let inputBuffer = audioData.buffer;
    //     let offset;
    //     for (let channel = 0; channel < this._channels; channel++) {
    //         let channelData = evt.outputBuffer.getChannelData(channel);
    //         offset = channel;
    //         for (let i = 0; i < inputBuffer.length; i++) {
    //             channelData[i] = inputBuffer[offset];
    //             offset += this._channels;
    //         }
    //     }
    // }

    private _mergeBuffer(...buffers: ArrayBuffer[]): ArrayBuffer {
        return buffers.reduce((pre, val) => {
            const merge = new Uint8Array((pre.byteLength | 0) + (val.byteLength | 0));
            merge.set(new Uint8Array(pre), 0);
            merge.set(new Uint8Array(val), pre.byteLength | 0);
            return merge.buffer;
        }, new Uint8Array());
    }
}
export default AudioRender;