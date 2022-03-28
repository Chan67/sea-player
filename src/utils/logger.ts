interface ILogFunction {
    (message?: any, ...optionalParams: any[]): void;
}

interface ILogger {
    [key: string]: ILogFunction,
    trace: ILogFunction;
    debug: ILogFunction;
    log: ILogFunction;
    warn: ILogFunction;
    info: ILogFunction;
    error: ILogFunction;
}

const noop: ILogFunction = function () { };

const fakeLogger: ILogger = {
    trace: noop,
    debug: noop,
    log: noop,
    warn: noop,
    info: noop,
    error: noop,
};

let exportedLogger: ILogger = fakeLogger;

function consolePrintFn(type: string): ILogFunction {
    const func: ILogFunction = self.console[type as keyof Console];
    if (func) {
        return func.bind(self.console, `[SeaPlayer] >`);
        // return (...optionalParams: any[]) => {
        //     console.log(optionalParams)
        //     func.call(self.console, `[SeaPlayer] >`, ...optionalParams);
        // }
    }
    return noop;
}

function exportLoggerFunctions(
    ...functions: string[]
): void {
    functions.forEach(function (type) {
        exportedLogger[type] = consolePrintFn(type);
    });
}

export function enableLogs(debug: boolean): void {
    // check that console is available
    if ((self.console && debug)) {
        exportLoggerFunctions(
            // log-level
            'trace',
            'debug',
            'log',
            'info',
            'warn',
            'error'
        );
        try {
            exportedLogger.log('open log');
        } catch (e) {
            exportedLogger = fakeLogger;
        }
    } else {
        exportedLogger = fakeLogger;
    }
}

export const logger: ILogger = exportedLogger;
