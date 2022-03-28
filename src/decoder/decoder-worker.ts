import Decoder from "./decoder";
const ctx = self as any;
const decoder: Decoder = new Decoder();
ctx.onmessage = function (event: any) {
    const data = event.data
    switch (data.cmd) {
        case 'init':
            {
                let url = data.config.decoderJs.indexOf('http') > -1
                    ? data.config.decoderJs
                    : self.location.origin + data.config.decoderJs;
                ctx.Module = {
                    locateFile: (wasm: string) => url.substring(0, url.lastIndexOf('/') + 1) + wasm,
                }
                ctx.importScripts(url);

                decoder.load(ctx.Module, data.config.decoderType, {
                    OnFrame: (buffer: ArrayBuffer, width: number, height: number, pts: number) => {
                        const output = new Uint8Array(buffer);
                        ctx.postMessage({
                            cmd: 'OnFrame',
                            info: {
                                output,
                                width,
                                height,
                                pts
                            }
                        })
                    },
                    OnInitComplete: () => {
                        ctx.postMessage({ cmd: 'InitComplete' });
                    }
                });

            }
            break;
        case 'decoder':
            {
                decoder.decode(data.info.chunk, data.info.pts);
            }
            break;
        default:
            break;
    }
}
export default null as any;