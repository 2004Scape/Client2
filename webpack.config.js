const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';
const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const pages = ['index', 'playground', 'viewer', 'mesanim', 'items', 'sounds'];
const htmlPlugins = pages.map(name => {
    return new HtmlWebpackPlugin({
        template: `src/html/${name}.html`,
        filename: `${name}.html`,
        chunks: [name]
    })
});

const config = {
    entry: {
        index: './src/js/client.ts',
        playground: './src/js/playground.js',
        viewer: './src/js/viewer.ts',
        mesanim: './src/js/mesanim.ts',
        items: './src/js/items.ts',
        sounds: './src/js/sounds.ts',
    },

    plugins: [
        ...htmlPlugins,
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            foundation: 'Foundation'
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css'
        }),
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'src', 'public') },
                { from: path.resolve(__dirname, 'src', 'js', 'vendor', 'bz2.wasm') },
            ],
        })
    ],

    output: {
        path: path.resolve(__dirname, 'public'),
        publicPath: isProduction ? '/Client2/' : '/' // used for GitHub Pages, maybe control via env var?
    },

    devServer: {
        open: true,
        host: 'localhost',
        static: 'public',
        liveReload: true,
        compress: true
    },

    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true
    },

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: 'ts-loader',
                exclude: ['/node_modules/']
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    stylesHandler,
                    'css-loader',
                    'postcss-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(sf2|wasm)$/i,
                type: 'asset'
            },
        ]
    },

    resolve: {
        extensions: ['.ts', '.js', '.scss', '...'],
        extensionAlias: {
            '.js': ['.js', '.ts'],
        },
        modules: [
            path.resolve(__dirname, 'src'),
            'node_modules',
            'node_modules/foundation-sites/scss'
        ],
        alias: {
            jagex2$: path.resolve(__dirname, 'src', 'js', 'jagex2'),
            vendor$: path.resolve(__dirname, 'src', 'js', 'vendor'),
            style$: path.resolve(__dirname, 'src', 'style'),
        }
    }
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
        config.plugins.push(new MiniCssExtractPlugin());
    } else {
        config.mode = 'development';
    }

    return config;
};
