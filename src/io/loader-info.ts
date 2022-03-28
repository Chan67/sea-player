import { LoaderStatus } from "./loader-const";

export class LoaderInfo {
    aborted: boolean = false;
    status: LoaderStatus = LoaderStatus.IDLE;
    receivedLength: number = 0;
}