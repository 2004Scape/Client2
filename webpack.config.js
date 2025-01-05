const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = isProduction ? MiniCssExtractPlugin.loader : 'style-loader';

const pages = ['index', 'playground', 'viewer', 'mesanim', 'items', 'sounds', 'interface-editor', 'JagEd', 'mapview'];
const htmlPlugins = pages.map(name => {
    return new HtmlWebpackPlugin({
        template: `src/html/${name}.html`,
        filename: `${name}.html`,
        chunks: [name]
    });
});

const config = {
    entry: {
        index: './src/js/game.ts',
        playground: './src/js/playground.js',
        viewer: './src/js/viewer.ts',
        mesanim: './src/js/mesanim.ts',
        items: './src/js/items.ts',
        sounds: './src/js/sounds.ts',
        ['interface-editor']: './src/js/interface-editor.ts',
        JagEd: './src/js/JagEd.ts',
        mapview: './src/js/mapview.ts'
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
            patterns: [{from: path.resolve(__dirname, 'src', 'public')}, {from: path.resolve(__dirname, 'src', 'js', 'vendor', 'bz2.wasm')}]
        })
    ],

    output: {
        path: path.resolve(__dirname, 'public'),
        publicPath: process.env.CI ? '/Client2/' : '/'
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
                use: [stylesHandler, 'css-loader', 'postcss-loader', 'sass-loader']
            },
            {
                test: /\.(sf2|wasm)$/i,
                type: 'asset'
            }
        ]
    },

    resolve: {
        extensions: ['.ts', '.js', '.scss', '...'],
        extensionAlias: {
            '.js': ['.js', '.ts']
        },
        modules: [path.resolve(__dirname, 'src'), 'node_modules', 'node_modules/foundation-sites/scss'],
        alias: {
            jagex2$: path.resolve(__dirname, 'src', 'js', 'jagex2'),
            vendor$: path.resolve(__dirname, 'src', 'js', 'vendor'),
            style$: path.resolve(__dirname, 'src', 'style')
        }
    }
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
        config.plugins.push(new MiniCssExtractPlugin());
        config.plugins.push(
            new TerserPlugin({
                minify: TerserPlugin.terserMinify,
                parallel: true,
                terserOptions: {
                    mangle: {
                        properties: {
                            keep_quoted: true, // needed for tinymidipcm.mjs
                            reserved: [
                                'loadTinyMidiPCM', // needed for tinymidipcm.mjs
                                'newBzip2State', // keeps renaming this to $S
                                'portOffset', // idk why but has to
                                'willReadFrequently', // terser removes this option from canvas
                                'members', // terser messes this up
                                '__liftRecord5', // the rest is for vendor
                                '__lowerRecord5',
                                '__liftString',
                                '__liftArray',
                                '__lowerArray',
                                '__liftTypedArray',
                                '__lowerTypedArray',
                                '__liftStaticArray',
                                '__lowerStaticArray',
                                '__retain',
                                '__release',
                                '__notnull',
                                '__setU8',
                                '__setU32',
                                '__getU8',
                                '__getU32',
                                '__pin',
                                '__new',
                                '__unpin',
                                'run',
                                'UTF8ArrayToString',
                                'UTF8ToString',
                                'stringToUTF8Array',
                                'stringToUTF8',
                                'lengthBytesUTF8',
                                'addOnPreRun',
                                'addOnInit',
                                'addOnPreMain',
                                'addOnExit',
                                'addOnPostRun',
                                'addRunDependency',
                                'removeRunDependency',
                                'FS_createFolder',
                                'FS_createPath',
                                'FS_createDataFile',
                                'FS_createPreloadedFile',
                                'FS_createLazyFile',
                                'FS_createLink',
                                'FS_createDevice',
                                'FS_unlink',
                                'getLEB',
                                'getFunctionTables',
                                'alignFunctionTables',
                                'registerFunctions',
                                'prettyPrint',
                                'getCompilerSetting',
                                'print',
                                'printErr',
                                'callMain',
                                'abort',
                                'keepRuntimeAlive',
                                'wasmMemory',
                                'stackAlloc',
                                'stackSave',
                                'stackRestore',
                                'getTempRet0',
                                'setTempRet0',
                                'writeStackCookie',
                                'checkStackCookie',
                                'ptrToString',
                                'zeroMemory',
                                'stringToNewUTF8',
                                'exitJS',
                                'getHeapMax',
                                'emscripten_realloc_buffer',
                                'ENV',
                                'ERRNO_CODES',
                                'ERRNO_MESSAGES',
                                'setErrNo',
                                'inetPton4',
                                'inetNtop4',
                                'inetPton6',
                                'inetNtop6',
                                'readSockaddr',
                                'writeSockaddr',
                                'DNS',
                                'getHostByName',
                                'Protocols',
                                'Sockets',
                                'getRandomDevice',
                                'warnOnce',
                                'traverseStack',
                                'UNWIND_CACHE',
                                'convertPCtoSourceLocation',
                                'readAsmConstArgsArray',
                                'readAsmConstArgs',
                                'mainThreadEM_ASM',
                                'jstoi_q',
                                'jstoi_s',
                                'getExecutableName',
                                'listenOnce',
                                'autoResumeAudioContext',
                                'dynCallLegacy',
                                'getDynCaller',
                                'dynCall',
                                'handleException',
                                'runtimeKeepalivePush',
                                'runtimeKeepalivePop',
                                'callUserCallback',
                                'maybeExit',
                                'safeSetTimeout',
                                'asmjsMangle',
                                'asyncLoad',
                                'alignMemory',
                                'mmapAlloc',
                                'writeI53ToI64',
                                'writeI53ToI64Clamped',
                                'writeI53ToI64Signaling',
                                'writeI53ToU64Clamped',
                                'writeI53ToU64Signaling',
                                'readI53FromI64',
                                'readI53FromU64',
                                'convertI32PairToI53',
                                'convertI32PairToI53Checked',
                                'convertU32PairToI53',
                                'getCFunc',
                                'ccall',
                                'cwrap',
                                'uleb128Encode',
                                'sigToWasmTypes',
                                'generateFuncType',
                                'convertJsFunctionToWasm',
                                'freeTableIndexes',
                                'functionsInTableMap',
                                'getEmptyTableSlot',
                                'updateTableMap',
                                'addFunction',
                                'removeFunction',
                                'reallyNegative',
                                'unSign',
                                'strLen',
                                'reSign',
                                'formatString',
                                'PATH',
                                'PATH_FS',
                                'intArrayFromString',
                                'intArrayToString',
                                'AsciiToString',
                                'stringToAscii',
                                'UTF16Decoder',
                                'UTF16ToString',
                                'stringToUTF16',
                                'lengthBytesUTF16',
                                'UTF32ToString',
                                'stringToUTF32',
                                'lengthBytesUTF32',
                                'allocateUTF8',
                                'allocateUTF8OnStack',
                                'writeStringToMemory',
                                'writeArrayToMemory',
                                'writeAsciiToMemory',
                                'SYSCALLS',
                                'getSocketFromFD',
                                'getSocketAddress',
                                'JSEvents',
                                'registerKeyEventCallback',
                                'specialHTMLTargets',
                                'maybeCStringToJsString',
                                'findEventTarget',
                                'findCanvasEventTarget',
                                'getBoundingClientRect',
                                'fillMouseEventData',
                                'registerMouseEventCallback',
                                'registerWheelEventCallback',
                                'registerUiEventCallback',
                                'registerFocusEventCallback',
                                'fillDeviceOrientationEventData',
                                'registerDeviceOrientationEventCallback',
                                'fillDeviceMotionEventData',
                                'registerDeviceMotionEventCallback',
                                'screenOrientation',
                                'fillOrientationChangeEventData',
                                'registerOrientationChangeEventCallback',
                                'fillFullscreenChangeEventData',
                                'registerFullscreenChangeEventCallback',
                                'JSEvents_requestFullscreen',
                                'JSEvents_resizeCanvasForFullscreen',
                                'registerRestoreOldStyle',
                                'hideEverythingExceptGivenElement',
                                'restoreHiddenElements',
                                'setLetterbox',
                                'currentFullscreenStrategy',
                                'restoreOldWindowedStyle',
                                'softFullscreenResizeWebGLRenderTarget',
                                'doRequestFullscreen',
                                'fillPointerlockChangeEventData',
                                'registerPointerlockChangeEventCallback',
                                'registerPointerlockErrorEventCallback',
                                'requestPointerLock',
                                'fillVisibilityChangeEventData',
                                'registerVisibilityChangeEventCallback',
                                'registerTouchEventCallback',
                                'fillGamepadEventData',
                                'registerGamepadEventCallback',
                                'registerBeforeUnloadEventCallback',
                                'fillBatteryEventData',
                                'battery',
                                'registerBatteryEventCallback',
                                'setCanvasElementSize',
                                'getCanvasElementSize',
                                'demangle',
                                'demangleAll',
                                'jsStackTrace',
                                'stackTrace',
                                'ExitStatus',
                                'getEnvStrings',
                                'checkWasiClock',
                                'flush_NO_FILESYSTEM',
                                'dlopenMissingError',
                                'createDyncallWrapper',
                                'setImmediateWrapped',
                                'clearImmediateWrapped',
                                'polyfillSetImmediate',
                                'uncaughtExceptionCount',
                                'exceptionLast',
                                'exceptionCaught',
                                'ExceptionInfo',
                                'exception_addRef',
                                'exception_decRef',
                                'Browser',
                                'setMainLoop',
                                'wget',
                                'FS',
                                'MEMFS',
                                'TTY',
                                'PIPEFS',
                                'SOCKFS',
                                '_setNetworkCallback',
                                'tempFixedLengthArray',
                                'miniTempWebGLFloatBuffers',
                                'heapObjectForWebGLType',
                                'heapAccessShiftForWebGLHeap',
                                'GL',
                                'emscriptenWebGLGet',
                                'computeUnpackAlignedImageSize',
                                'emscriptenWebGLGetTexPixelData',
                                'emscriptenWebGLGetUniform',
                                'webglGetUniformLocation',
                                'webglPrepareUniformLocationsBeforeFirstUse',
                                'webglGetLeftBracePos',
                                'emscriptenWebGLGetVertexAttrib',
                                'writeGLArray',
                                'AL',
                                'SDL_unicode',
                                'SDL_ttfContext',
                                'SDL_audio',
                                'SDL',
                                'SDL_gfx',
                                'GLUT',
                                'EGL',
                                'GLFW_Window',
                                'GLFW',
                                'GLEW',
                                'IDBStore',
                                'runAndAbortIfError',
                                'ALLOC_NORMAL',
                                'ALLOC_STACK',
                                'allocate',
                                'grow',
                                'iceServers',
                                'urls',
                                'malloc_u8',
                                'free_u8',
                                'gzip_decompress',
                                'gzip_compress',
                                'error_message',
                                'error_message_len',
                                'deallocate_buffer'
                            ]
                        }
                    },
                    format: {
                        quote_style: 3, // original
                        keep_quoted_props: true // needed for tinymidipcm.mjs
                    }
                }
            })
        );
    } else {
        config.mode = 'development';
    }

    return config;
};
