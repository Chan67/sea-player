import { logger } from "../utils/logger";

class VideoContext {
    private _fps: number = 25;
    private _frameInterval: number = 1000 / 25;
    private requestID: number;
    private _startTime: number;
    private _lastTime: number;
    private callback: (...args: any[]) => void;

    constructor(fps: number, callback: (...args: any[]) => void) {
        logger.info('Video Context');
        this._fps = fps;
        this._frameInterval = Math.round(1000 / this._fps);
        this.callback = callback;
        this._startTime = this._lastTime = Date.now();
        this.requestID = requestAnimationFrame(this.Process.bind(this));
    }
    destroy() {
        cancelAnimationFrame(this.requestID);
    }
    get fps() {
        return this._fps;
    }
    set fps(val) {
        this._fps = val;
    }

    private Process() {
        let now = Date.now();
        let delay = now - this._lastTime;
        if (this._frameInterval < delay) {
            let progress = now - this._startTime;
            this._lastTime = now;
            this.callback(progress);
        }
        requestAnimationFrame(this.Process.bind(this));
    }


}
export default VideoContext;