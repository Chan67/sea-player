import { LoaderErrorStatus, LoaderStatus } from './loader-const'
import { LoaderInfo } from './loader-info'
import { LoaderDataSource } from './loader-datasource'

export type LoaderOnSuccess = () => void;

export interface LoaderErrors {
    type: LoaderErrorStatus,
    code: number,
    message: string
}
export type LoaderOnError = (
    error: LoaderErrors
) => void;

export type LoaderOnDataArrival = (
    dataSource: LoaderDataSource,
    info: LoaderInfo,
    chunk: ArrayBuffer
) => void;

export interface LoaderCallbacks {
    onSuccess: LoaderOnSuccess;
    onError: LoaderOnError;
    onDataArrival: LoaderOnDataArrival;
}

export interface Loader {
    destroy(): void;
    abort(): void;
    open(
        dataSource: LoaderDataSource,
        callbacks: LoaderCallbacks
    ): void;
}