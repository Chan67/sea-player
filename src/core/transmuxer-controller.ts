import { Config } from "../config";
import DecoderWorker from "../decoder/decoder-worker";
import FlvDemuxer from "../demux/flv-demuxer";
import { FlvMediaData, FlvMediaInfo, MediaType } from "../demux/flv-type";
import { LoaderErrors, LoaderOnSuccess } from "../io/loader";
import { LoaderDataSource } from "../io/loader-datasource";
import { LoaderInfo } from "../io/loader-info";
import { logger } from "../utils/logger";
import IOController from "./io-controller";
import { MediaAudioData, MediaVideoData, TransmuxerCallbacks } from "./transmuxer-events";

class TransmuxerController {
    private config: Config;
    private ioCtrl: IOController;
    private dataSource?: LoaderDataSource;
    private flvDemuxer: FlvDemuxer;
    private worker: Worker;
    private decoderInit: boolean = false;
    private decoderReady: boolean = false;
    private opened: boolean = false;
    private callbacks: TransmuxerCallbacks;
    private videoCache: Array<FlvMediaData> = [];

    constructor(config: Config, callbacks: TransmuxerCallbacks) {
        this.config = config;
        this.callbacks = callbacks;
        
        this.worker = new DecoderWorker();
        // this.worker.postMessage({ cmd: 'init', config: { mediaType: 1 } });

        let intiConfig = {
            decoderType: this.config.decoderType,
            decoderJs: this.config.decoderJs,
        }
        this.worker.postMessage({ cmd: 'init', config: intiConfig });
        this.worker.addEventListener('message', (evt: any) => {
            const data = evt.data;
            switch (data.cmd) {
                case 'InitComplete':
                    {
                        logger.info('Init Decoder Complete');
                        this.decodeCacheideo();
                        this.decoderReady = true;
                        if (!this.opened && this.dataSource) {
                            this.ioCtrl.open(this.dataSource);
                            this.opened = true;
                        }
                        this.callbacks.onDecoderInitComplete();
                    }
                    break;
                case 'OnFrame':
                    {
                        let mediaData: MediaVideoData = {
                            timestamp: data.info.pts,
                            chunk: data.info.output,
                            width: data.info.width,
                            height: data.info.height
                        };
                        this.callbacks.onVideoDataArrived(mediaData);
                    }
                    break;
                default:
                    break
            }
        });

        this.ioCtrl = new IOController({
            onSuccess: this.onSuccess.bind(this),
            onDataArrival: this.onDataArrival.bind(this),
            onError: this.onError.bind(this)
        });

        this.flvDemuxer = new FlvDemuxer({
            onMediaData: this.onMediaData.bind(this),
            onMediaInfo: (info: FlvMediaInfo) => {
                this.callbacks.onMediaInfo(info);
            }
        });
    }

    destroy() {
        this.ioCtrl.destroy();
        this.flvDemuxer.destroy();
        this.worker.terminate();
    }

    play(dataSource: LoaderDataSource): void {
        this.dataSource = dataSource;
        // this.ioCtrl.open(dataSource);
        // this.opened = true;
        if (this.decoderReady) {
            this.ioCtrl.open(dataSource);
            this.opened = true;
        }
    }

    private onSuccess(): void {

    }
    private onDataArrival(dataSource: LoaderDataSource, info: LoaderInfo, chunk: ArrayBuffer): void {
        this.flvDemuxer.parseChunks(chunk);
    }
    private onError(e: LoaderErrors): void {
        logger.error('IO Exception', e);
    }
    private onMediaData(data: FlvMediaData): void {
        if (data.type == MediaType.Audio) {
            let mediaData: MediaAudioData = {
                timestamp: data.timestamp,
                chunk: new Uint8Array(data.chunk),
            };
            this.callbacks.onAudioDataArrived(mediaData);
        } else if (data.type == MediaType.Video) {
            // if (!this.decoderInit) {
            //     let mediaType = data.codecId == 12 ? 1 : 0;
            //     let intiConfig = {
            //         mediaType: mediaType,
            //         decoderJs: this.config.decoderJs,
            //     }
            //     this.worker.postMessage({ cmd: 'init', config: intiConfig });
            //     this.decoderInit = true
            // } else {
            //     // logger.info(`${this.decoderReady} ${this.videoCache.length}`)
            // }
            if (!this.decoderReady) {
                this.videoCache.push(data);
            } else {
                let chunk = new Uint8Array(data.chunk);
                let pts = data.timestamp;
                this.worker.postMessage({ cmd: 'decoder', info: { chunk: chunk, pts: pts } });
            }
        }
    }
    private decodeCacheideo(): void {
        // logger.info(`cache len:${this.videoCache.length}`);
        while (this.videoCache.length > 0) {
            let cache = this.videoCache.shift();
            if (cache) {
                let chunk = new Uint8Array(cache.chunk);
                let pts = cache.timestamp;
                this.worker.postMessage({ cmd: 'decoder', info: { chunk: chunk, pts: pts } });
            }
        }
    }
}
export default TransmuxerController;