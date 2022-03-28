import { Loader, LoaderCallbacks } from './loader'
import { LoaderInfo } from './loader-info'
import { LoaderDataSource } from './loader-datasource'
import { LoaderStatus, LoaderErrorStatus } from './loader-const';
import { logger } from '../utils/logger';

export function fetchSupported() {
    // @ts-ignore
    if (self.fetch && self.AbortController && self.ReadableStream && self.Request) {
        try {
            new self.ReadableStream({}); // eslint-disable-line no-new
            return true;
        } catch (e) {
        }
    }
    return false;
}

class FetchLoader implements Loader {
    public info: LoaderInfo;
    public dataSource!: LoaderDataSource;
    private request!: Request;
    private callbacks: LoaderCallbacks | null = null;
    private _abortController?: AbortController;
    constructor() {
        this.info = new LoaderInfo();
    }
    destroy(): void {
        this.abort();
    }
    abort(): void {
        if (this.info.status == LoaderStatus.BUFFERING) {
            this.info.status = LoaderStatus.ABORT;
            if (this._abortController) {
                this._abortController.abort();
            }
        }
    }
    open(dataSource: LoaderDataSource, callbacks: LoaderCallbacks): void {
        this.dataSource = dataSource;
        this.callbacks = callbacks;
        this._abortController = new self.AbortController();
        const initParams = this.getRequestParameters(this._abortController.signal);
        this.request = this.getRequest(this.dataSource.url, initParams);
        self.fetch(this.request)
            .then((response: Response): Promise<ArrayBuffer> => {
                // Response处理
                if (!response.ok) {
                    throw new Error();
                }
                this.info.status = LoaderStatus.CONNECTING;
                return this.loadProgressively(response);
            }).catch((e) => {
                if (this._abortController && this._abortController.abort) {
                    this.info.status == LoaderStatus.ABORT;
                    return;
                }
                const code = 0;
                callbacks.onError({
                    type: LoaderErrorStatus.EXCEPTION,
                    code: code,
                    message: e ? e.message : '未知错误'
                });
            });
    }
    private loadProgressively(response: Response): Promise<ArrayBuffer> {
        // ReadableStream 读取处理
        const reader = (response.body as ReadableStream).getReader();
        this.info.status = LoaderStatus.BUFFERING;
        const _pump = (): Promise<ArrayBuffer> => {
            return reader.read().then((data) => {
                if (data.done) {
                    return Promise.resolve(new ArrayBuffer(0));
                }
                const chunk: Uint8Array = data.value;
                const len = chunk.length;
                this.info.receivedLength += len;
                this.callbacks?.onDataArrival(this.dataSource, this.info, chunk);
                return _pump();
            }).catch(() => {
                /* aborted */
                return Promise.reject();
            });
        }
        return _pump();
    }
    private getRequestParameters(signal: AbortSignal) {
        const initParams: any = {
            method: 'GET',
            mode: 'cors',
            cache: 'default',
            // The default policy of Fetch API in the whatwg standard
            // Safari incorrectly indicates 'no-referrer' as default policy, fuck it
            referrerPolicy: 'no-referrer-when-downgrade',
            signal
        };
        return initParams;
    }
    private getRequest(url: string, initParams: any) {
        return new self.Request(url, initParams);
    }
}

export default FetchLoader;