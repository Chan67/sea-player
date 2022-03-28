import { FlvMediaInfo } from "../demux/flv-type";
import { logger } from "../utils/logger";
import Queue from "../utils/queue";
import AudioRender from "./audio-render";
import { RenderMediaInfo, RenderVideoMediaInfo } from "./render-type";
import VideoContext from "./video-context";
import WebGLRender from "./webgl-render";

class Render {
    private webglRender: WebGLRender;
    private videoContext?: VideoContext;
    private videoQueue: Queue<RenderVideoMediaInfo>;
    private fps: number = 25;

    private audioRender?: AudioRender;

    private playing: boolean = false;
    private diff: number = 500;

    constructor() {
        this.webglRender = new WebGLRender();
        this.videoQueue = new Queue<RenderVideoMediaInfo>(5000);
    }

    destroy() {
        this.webglRender.destroy();
        this.videoQueue.clear();
        if (this.videoContext) {
            this.videoContext.destroy();
        }
        if (this.audioRender) {
            this.audioRender.destroy();
        }
    }

    load(mediaElement: HTMLElement, mediaInfo: FlvMediaInfo) {
        this.webglRender.load(mediaElement);
        if (mediaInfo != null && mediaInfo.fps != undefined) {
            this.fps = Math.round(mediaInfo.fps);
        }
        this.videoContext = new VideoContext(this.fps, this.renderFrame.bind(this));
        if (mediaInfo.hasAudio) {
            this.audioRender = new AudioRender(mediaInfo.audioConfig.sampleRate, mediaInfo.audioConfig.channelCount);
        }
    }

    pushMedia(info: RenderMediaInfo) {
        if (info.videoData != undefined) {
            this.videoQueue.enqueue(info.videoData);
        }
        if (info.audioData != undefined && this.audioRender != undefined) {
            this.audioRender.push(info.audioData.chunk, info.audioData.timestamp);
        }
    }

    private renderFrame(progress: number) {
        if (this.videoContext != null) {
            if (this.videoQueue.Count > 0) {
                let videoData = this.videoQueue.dequeue();
                if (videoData) {
                    // logger.info("视频渲染");
                    this.webglRender.draw(videoData.chunk, videoData.width, videoData.height);
                    if (this.audioRender && this.audioRender.currentTime != 0) {
                        // if (this.diff == 0) {
                        //     this.diff = this.audioRender.currentTime;
                        // }
                        let diffTimestamp = videoData.timestamp - this.audioRender.currentTime;
                        // logger.info(`diff timestamp ${diffTimestamp} ${videoData.timestamp} ${this.audioRender.currentTime}`);
                        if (diffTimestamp < -this.diff) {
                            this.renderFrame(progress);
                        }
                        if (diffTimestamp > 300) {
                            this.videoQueue.enqueueFront(videoData);
                        }
                    }
                }
            }
        }
    }
}
export default Render;