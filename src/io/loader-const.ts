export enum LoaderStatus {
    IDLE = 'Idle',
    CONNECTING = 'Connecting',
    BUFFERING = 'Buffering',
    ABORT = 'Abort',
}
export enum LoaderErrorStatus {
    OK = 'OK',
    EXCEPTION = 'Exception',
    TIMEOUT = 'Timeout',
    HTTP_STATUS_CODE_INVALID = 'HttpStatusCodeInvalid'
};