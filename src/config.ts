export type Config = {
    container: HTMLElement;
    debug: boolean;
    decoderType: number;
    decoderJs: String;
}

export const DefaultConfig: Config = {
    container: document.body,
    debug: true,
    decoderType: 1,
    decoderJs: '/wasm/decoder.js',
}