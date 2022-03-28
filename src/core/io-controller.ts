import FetchLoader from '../io/fetch-loader'
import { Loader, LoaderCallbacks } from '../io/loader';
import { LoaderDataSource } from '../io/loader-datasource';


class IOController {
    private loader!: Loader;
    private callbacks: LoaderCallbacks;
    private flag: boolean;
    constructor(callbacks: LoaderCallbacks) {
        this.callbacks = callbacks;

        this.flag = false;
        this.init();
    }

    destroy(): void {
        if(this.loader){
            this.loader.destroy();
        }
    }

    open(dataSource: LoaderDataSource) {
        this.loader.open(dataSource, this.callbacks);
    }
    private init() :void{
        this.loader = new FetchLoader();
    }
}

export default IOController;