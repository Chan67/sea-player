const path = require('path')

const baseConfig = {
    entry: './src/index.ts', //入口
    stats: {
        children: true
    },
    resolve: {
        // Add `.ts` as a resolvable extension.
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /worker\.ts$/,
                use: {
                    loader: 'worker-loader',
                    options: { inline: 'no-fallback' }
                }
            },
            {
                test: /\.(ts|js)$/,
                exclude: [path.resolve(__dirname, 'node_modules')],
                loader: 'babel-loader',
                options: {
                    babelrc: false,
                    presets: [
                        '@babel/preset-typescript',
                        [
                            '@babel/preset-env',
                            {
                                loose: true,
                                modules: false,
                                targets: {
                                    browsers: [
                                        'chrome >= 47',
                                        'firefox >= 51',
                                        'ie >= 11',
                                        'safari >= 8',
                                        'ios >= 8',
                                        'android >= 4',
                                    ],
                                },
                            },
                        ],
                    ],
                }
            }]
    }
}
const devConfig = {
    name: 'dev',
    mode: 'development',
    //输出
    output: {
        filename: 'seaplayer.dev.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'SeaPlayer',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',
    },
    devServer: {
        static: {
            directory: path.join(__dirname, '/'),
        },
        open: {
            target: ['demo/demo.html'],
            app: {
                name: 'Google Chrome',
            },
        },
        // liveReload: false,
        port: 8090
    },
}
const prodConfig = {
    name: 'prod',
    mode: 'production',
    //输出
    output: {
        filename: 'seaplayer.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'SeaPlayer',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',
    },
}

module.exports = (env, argv) => {
    let config = {};
    if (argv.mode === 'development') {
        config = Object.assign(devConfig, baseConfig);
    }

    if (argv.mode === 'production') {
        config = Object.assign(prodConfig, baseConfig);
    }
    return config;
};