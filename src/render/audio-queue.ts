export interface AudioQueueData {
    timestamp: number;
    buffer: Float32Array;
}

class AudioQueue {
    private readonly LEN = 5000;

    private _sampleRate: number;
    private _channels: number;
    private _bufferSize: number;

    private _pendingPos: number = 0;
    private _audioData: AudioQueueData;
    private _item: Array<AudioQueueData>;

    constructor(sampleRate: number, channels: number, size: number) {
        this._sampleRate = sampleRate;
        this._channels = channels;
        this._bufferSize = this._channels * size;

        this._audioData = {
            timestamp: 0,
            buffer: new Float32Array(this._bufferSize)
        }
        this._item = [];
    }

    flush() {
        this._audioData = {
            timestamp: 0,
            buffer: new Float32Array(this._bufferSize)
        }
        this._item = [];
        this._pendingPos = 0;
    }
    push(timestamp: number, buffer: Float32Array) {
        let frameSize = buffer.length;
        if (this._pendingPos == 0) {
            this._audioData.timestamp = timestamp;
        }
        for (let i = 0; i < frameSize; i++) {
            this._audioData.buffer[this._pendingPos] = buffer[i];
            if (this._audioData.timestamp == 0) {
                let currentTimestamp = Math.round(timestamp + 1000 * (i - 1) / this._sampleRate);
                this._audioData.timestamp = currentTimestamp;
            }
            if (++this._pendingPos == this._bufferSize) {
                if (this._item.length >= this.LEN) {
                    this._item.shift();
                }
                this._item.push(this._audioData);
                this._pendingPos = 0;
                this._audioData = {
                    timestamp: timestamp,
                    buffer: new Float32Array(this._bufferSize)
                }
            }
        }
    }
    pop(): AudioQueueData {
        let result = {
            timestamp: 0,
            buffer: new Float32Array(this._bufferSize)
        }
        if (this._item.length > 0) {
            result = this._item[0];
            this._item.shift();
        } else {
            result = this._audioData;
            this._pendingPos = 0;
            this._audioData = {
                timestamp: 0,
                buffer: new Float32Array(this._bufferSize)
            }
        }
        return result;
    }
    peek() {
        return this._item[0];
    }
    count() {
        return this._item.length;
    }
}
export default AudioQueue;