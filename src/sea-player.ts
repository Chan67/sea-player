import { logger, enableLogs } from './utils/logger';
import { LoaderDataSource } from './io/loader-datasource';
import Transmuxer from './core/transmuxer';
import { Config, DefaultConfig } from './config';
import EventEmitter from 'events';
import Render from './render/render';
import { MediaAudioData, MediaVideoData, TransmuxerEvents } from './core/transmuxer-events';
import { RenderMediaInfo } from './render/render-type';
import { FlvMediaInfo } from './demux/flv-type';
import { PlayerEvents } from './player-events';
import TipsUI from './ui/tips-ui';

export default class SeaPlayer {
    private readonly config: Config;
    private _mediaElement: HTMLElement;
    private emitter: EventEmitter;

    private render: Render;
    private transmeuxer: Transmuxer;
    private dataSource!: LoaderDataSource;

    private tips: TipsUI;

    constructor(customConfig: Partial<Config> = {}) {
        this.emitter = new EventEmitter();
        this.config = Object.assign({}, DefaultConfig, customConfig);

        enableLogs(this.config.debug);

        this._mediaElement = this.config.container;
        this._mediaElement.style.position = "relative";
        this.tips = new TipsUI(this._mediaElement);
        this.tips.text('player init');
        this.transmeuxer = new Transmuxer(this.config);
        this.transmeuxer.on(TransmuxerEvents.MEDIA_INFO, this._onMediaInfo.bind(this));
        this.transmeuxer.on(TransmuxerEvents.VIDEO_DATA_ARRIVED, this._onVideoDataArrived.bind(this));
        this.transmeuxer.on(TransmuxerEvents.AUDIO_DATA_ARRIVED, this._onAudioDataArrived.bind(this));
        this.transmeuxer.on(TransmuxerEvents.INIT_DECODER_COMPLETE, () => {
            this.tips.text('init decoder complete')
        });

        this.render = new Render();
    }

    on(eventName: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.addListener(eventName, listener);
    }
    off(eventName: string | symbol, listener: (...args: any[]) => void) {
        this.emitter.removeListener(eventName, listener);
    }

    destroy() {
        this.emitter.removeAllListeners();
        this.transmeuxer.destroy();
        this.render.destroy();
        this.tips.destroy();
    }

    play(url: string) {
        this.tips.text('init decoder');
        this.dataSource = {
            url: url
        }
        this.transmeuxer.play(this.dataSource);
    }

    private _onMediaInfo(info: FlvMediaInfo) {
        this.tips.hide();
        logger.info('onMediaInfo', info)
        if (this._mediaElement != null) {
            this.render.load(this._mediaElement, info);
        }
    }
    private _onVideoDataArrived(data: MediaVideoData) {
        // logger.info('VideoDataArrived')
        let renderData: RenderMediaInfo = {
            videoData: data
        }
        this.render.pushMedia(renderData);
    }
    private _onAudioDataArrived(data: MediaAudioData) {
        // this.emitter.emit(PlayerEvents.AUDIO_DATA_ARRIVED, data);
        let renderData: RenderMediaInfo = {
            audioData: data
        }
        this.render.pushMedia(renderData);
    }
}