import TransmuxerController from "./transmuxer-controller";
import EventEmitter from 'events';
import { LoaderDataSource } from "../io/loader-datasource";
import { logger } from "../utils/logger";
import { MediaAudioData, MediaVideoData, TransmuxerEvents } from "./transmuxer-events";
import { FlvMediaInfo } from "../demux/flv-type";
import { Config } from "../config";
class Transmuxer {
    private ctrl: TransmuxerController;
    private emitter: EventEmitter;
    constructor(config: Config) {
        this.ctrl = new TransmuxerController(config, {
            onMediaInfo: this._onMediaInfo.bind(this),
            onVideoDataArrived: this._onVideoDataArrived.bind(this),
            onAudioDataArrived: this._onAudioDataArrived.bind(this),
            onDecoderInitComplete: this._onDecoderInitComplete.bind(this)
        });
        this.emitter = new EventEmitter();
    }

    destroy() {
        this.ctrl.destroy();
        this.emitter.removeAllListeners();
    }
    on(eventName: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.addListener(eventName, listener);
    }
    off(eventName: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.removeListener(eventName, listener);
    }

    play(dataSource: LoaderDataSource) {
        this.ctrl.play(dataSource)
    }

    private _onMediaInfo(info: FlvMediaInfo) {
        this.emitter.emit(TransmuxerEvents.MEDIA_INFO, info);
    }
    private _onVideoDataArrived(data: MediaVideoData) {
        this.emitter.emit(TransmuxerEvents.VIDEO_DATA_ARRIVED, data);
    }
    private _onAudioDataArrived(data: MediaAudioData) {
        this.emitter.emit(TransmuxerEvents.AUDIO_DATA_ARRIVED, data);
    }
    private _onDecoderInitComplete(){
        this.emitter.emit(TransmuxerEvents.DECODER_INIT_COMPLETE);
    }
}
export default Transmuxer;