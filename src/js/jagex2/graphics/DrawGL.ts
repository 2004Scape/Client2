import { gl } from "./Canvas";
import Draw2D from "./Draw2D";
import Draw3D from "./Draw3D";
import GLBuffer from "./GLBuffer";
import GLFloatBuffer from "./GLFloatBuffer";
import GLIntBuffer from "./GLIntBuffer";
import { GLShader } from "./GLShader";
import Model from "./Model";

export default class DrawGL {

    static GL_ENABLED: boolean = true;

    static uniformIntBuffer: GLIntBuffer;
    static vertexBuffer: GLIntBuffer;
    static uvBuffer: GLFloatBuffer;

    static targetBufferOffset : number;
    static glInitted : boolean = false;
    static renderDistance : number = 25;

	private static readonly TEXTURE_SIZE = 128;

    private static readonly tmpVertexBuffer: GLBuffer = new GLBuffer("vertex buffer");
    private static readonly tmpUvBuffer: GLBuffer = new GLBuffer("uv buffer");
    private static readonly uniformBuffer : GLBuffer = new GLBuffer("uniform buffer");

    private static readonly GameShaderProgram : GLShader = new GLShader()
        .add(gl.VERTEX_SHADER, "gpu/vert.glsl")
        .add(gl.FRAGMENT_SHADER, "gpu/frag.glsl");

    private static readonly UIShaderProgram : GLShader = new GLShader()
        .add(gl.VERTEX_SHADER, "gpu/vertui.glsl")
        .add(gl.FRAGMENT_SHADER, "gpu/fragui.glsl");

    private static glProgram: WebGLProgram;
    private static glUiProgram: WebGLProgram;
	private static vaoTemp : any;

	private static interfaceTexture : WebGLTexture|null;
	private static interfacePbo : any;

	private static vaoUiHandle : any;
	private static vboUiHandle : any;

    private static textureArrayId : WebGLTexture = -1;
    private static tileHeightTex : any;

    private static lastCanvasWidth : any;
    private static lastCanvasHeight : any;

    private static cameraX : number = 1;
    private static cameraY : number = 1;
    private static cameraZ : number = 10;
    private static cameraYaw : number = 128;
    private static cameraPitch : number = 128;


    private static uniProjectionMatrix: WebGLUniformLocation;
    private static uniBrightness: WebGLUniformLocation;
    private static uniSmoothBanding: WebGLUniformLocation;
    private static uniUseFog: WebGLUniformLocation;
    private static uniFogColor: WebGLUniformLocation;
    private static uniFogDepth: WebGLUniformLocation;
    private static uniDrawDistance: WebGLUniformLocation;
    private static uniExpandedMapLoadingChunks: WebGLUniformLocation;
    private static uniTextureLightMode: WebGLUniformLocation;
    private static uniTick: WebGLUniformLocation;
    private static uniBlockMain: number;
    private static uniTextures: WebGLUniformLocation;
    private static uniTextureAnimations: WebGLUniformLocation;

    private static uniTex: WebGLUniformLocation;
    private static uniTexSamplingMode: WebGLUniformLocation;
    private static uniTexTargetDimensions: WebGLUniformLocation;
    private static uniTexSourceDimensions: WebGLUniformLocation;
    private static uniUiAlphaOverlay: WebGLUniformLocation;

    private static glRenderer: string;
    private static glVersion: string;

    // debug
    private static noDraw:boolean = false;

    static init = async (): Promise<void> => {
        if (!gl) {
            throw new Error('WebGL 2.0 not supported');
        }
        else {
            DrawGL.glVersion = gl.getParameter(gl.VERSION);
            DrawGL.glRenderer = gl.getParameter(gl.RENDERER);
            DrawGL.GL_ENABLED = true;
        }

        DrawGL.targetBufferOffset = 0;

        //GLManager.initSortingBuffers();

        console.log('DrawGL.init()');
        // check errors
        DrawGL.checkGLErrors();

        // buffers
        DrawGL.uniformIntBuffer = new GLIntBuffer();
        DrawGL.vertexBuffer = new GLIntBuffer();
        DrawGL.uvBuffer = new GLFloatBuffer();


        //sync mode (TODO: is this needed? it is for frame rate limiting/unlocking but original code swaps the AWT context. not sure if valid in webgl context)
        console.log('DrawGL buffers created');

        // init buffers
        DrawGL.initBuffers();
        console.log('DrawGL initBuffers() done');

        // init vao
        DrawGL.initVao();
        console.log('DrawGL initVao() done');


        // init program
        await DrawGL.initProgram();
        
        console.log('DrawGL initProgram() done');


        // init textures
        DrawGL.initInterfaceTexture();

        // init uniform buffer
        //DrawGL.initUniformBuffer2();

        console.log('DrawGL initUniformBuffer() !');

        DrawGL.lastCanvasHeight = -1;
        DrawGL.lastCanvasWidth = -1;
        DrawGL.textureArrayId = -1;

        DrawGL.glInitted = true;
        DrawGL.checkGLErrors();
        console.log('DrawGL.init() done');
    };

    static initVao = (): void => {
        // Create temp VAO
        DrawGL.vaoTemp = gl.createVertexArray();
        gl.bindVertexArray(DrawGL.vaoTemp);

        gl.enableVertexAttribArray(0);
        gl.bindBuffer(gl.ARRAY_BUFFER, DrawGL.tmpVertexBuffer.glBufferId);
        gl.vertexAttribIPointer(0, 4, gl.INT, 0, 0);

        gl.enableVertexAttribArray(1);
        gl.bindBuffer(gl.ARRAY_BUFFER, DrawGL.tmpUvBuffer.glBufferId);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

        gl.bindVertexArray(null);

        // Create UI VAO
        DrawGL.vaoUiHandle = gl.createVertexArray();
        // Create UI buffer
        DrawGL.vboUiHandle = gl.createBuffer();
        gl.bindVertexArray(DrawGL.vaoUiHandle);

        const vboUiBuf: Float32Array = new Float32Array([
            // positions     // texture coords
            1.0, 1.0, 0.0, 1.0, 0.0, // top right
            1.0, -1.0, 0.0, 1.0, 1.0, // bottom right
            -1.0, -1.0, 0.0, 0.0, 1.0, // bottom left
            -1.0, 1.0, 0.0, 0.0, 0.0 // top left
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, DrawGL.vboUiHandle);
        gl.bufferData(gl.ARRAY_BUFFER, vboUiBuf, gl.STATIC_DRAW);

        // position attribute
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(0);

        // texture coord attribute
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(1);

        // unbind VBO
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    };

    static shutdownVbo (): void {
        gl.deleteVertexArray(DrawGL.vaoTemp);
        DrawGL.vaoTemp = null;
    }

    static initBuffers = (): void => {
		DrawGL.initGlBuffer(DrawGL.tmpVertexBuffer);
		DrawGL.initGlBuffer(DrawGL.tmpUvBuffer);
        DrawGL.initGlBuffer(DrawGL.uniformBuffer);
	};

    static initGlBuffer = (glBuffer:GLBuffer): void => {
		glBuffer.glBufferId = gl.createBuffer()!;
        console.log(`initGlBuffer: ${glBuffer.name} ${glBuffer.glBufferId}`)
	}

    private static updateTextures(textureArrayId:WebGLTexture) :void{
		const textures = Draw3D.textures;

		gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureArrayId);

		let cnt = 0;
		for (let textureId = 0; textureId < textures.length; textureId++) {
			let texture = textures[textureId];
			if (texture != null) {
                const texturePixels = texture.pixels;
				if (texturePixels.length === 0) {
					continue; // this can't happen
				}

				++cnt;

				//if (texturePixels.length != DrawGL.TEXTURE_SIZE * DrawGL.TEXTURE_SIZE) {
					// The texture storage is 128x128 bytes, and will only work correctly with the
					// 128x128 textures from high detail mode
					//continue;
				//}

                const pixels = DrawGL.convertPixels(texturePixels, DrawGL.TEXTURE_SIZE, DrawGL.TEXTURE_SIZE, DrawGL.TEXTURE_SIZE, DrawGL.TEXTURE_SIZE);
				// = new Uint8Array(texturePixels);//DrawGL.getPixelsAsUint8ArrayFromSigned(texturePixels);
				gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, textureId, DrawGL.TEXTURE_SIZE, DrawGL.TEXTURE_SIZE,
						1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			}
		}
	}

    static initTextureArray():void {
		if (!Draw3D.textures === null || Draw3D.textures.length === 0) {
			return;
		}

		const textures = Draw3D.textures;

		const textureArrayId = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureArrayId);
		gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, DrawGL.TEXTURE_SIZE, DrawGL.TEXTURE_SIZE, textures.length);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

		// Set brightness to 1.0 to upload unmodified textures to GPU
		const save = Draw3D.textureBrightness;
		Draw3D.setBrightness(1.0);

		DrawGL.updateTextures(textureArrayId);

        Draw3D.setBrightness(save);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D_ARRAY, textureArrayId);
		gl.activeTexture(gl.TEXTURE0);

		DrawGL.textureArrayId = textureArrayId;
	}

    static shutdownBuffers(): void {
		DrawGL.destroyGlBuffer(DrawGL.tmpVertexBuffer);
		DrawGL.destroyGlBuffer(DrawGL.tmpUvBuffer);
		DrawGL.destroyGlBuffer(DrawGL.uniformBuffer);
	}

    static destroyGlBuffer(glBuffer:GLBuffer): void {
		if (glBuffer.glBufferId != -1) {

			gl.deleteBuffer(glBuffer.glBufferId);
			glBuffer.glBufferId = -1;
		}
		glBuffer.size = -1;
	}

    static async initProgram(): Promise<void> {
        DrawGL.glProgram = await DrawGL.GameShaderProgram.compile();
        DrawGL.glUiProgram = await DrawGL.UIShaderProgram.compile();
        DrawGL.initUniforms();
    }

    static initUniforms(): void {
        DrawGL.uniProjectionMatrix = gl.getUniformLocation(DrawGL.glProgram, "projectionMatrix")!;
        DrawGL.uniBrightness = gl.getUniformLocation(DrawGL.glProgram, "brightness")!;
        DrawGL.uniSmoothBanding = gl.getUniformLocation(DrawGL.glProgram, "smoothBanding")!;
        DrawGL.uniUseFog = gl.getUniformLocation(DrawGL.glProgram, "useFog")!;
        DrawGL.uniFogColor = gl.getUniformLocation(DrawGL.glProgram, "fogColor")!;
        DrawGL.uniFogDepth = gl.getUniformLocation(DrawGL.glProgram, "fogDepth")!;
        DrawGL.uniDrawDistance = gl.getUniformLocation(DrawGL.glProgram, "drawDistance")!;
        DrawGL.uniExpandedMapLoadingChunks = gl.getUniformLocation(DrawGL.glProgram, "expandedMapLoadingChunks")!;
        DrawGL.uniTextureLightMode = gl.getUniformLocation(DrawGL.glProgram, "textureLightMode")!;
        //DrawGL.uniTick = gl.getUniformLocation(DrawGL.glProgram, "tick")!;
        DrawGL.uniBlockMain = gl.getUniformBlockIndex(DrawGL.glProgram, "uniforms")!;
        DrawGL.uniTextures = gl.getUniformLocation(DrawGL.glProgram, "textures")!;
        //DrawGL.uniTextureAnimations = gl.getUniformLocation(DrawGL.glProgram, "textureAnimations")!;

        DrawGL.uniTex = gl.getUniformLocation(DrawGL.glUiProgram, "tex")!;
       // DrawGL.uniTexSamplingMode = gl.getUniformLocation(DrawGL.glUiProgram, "samplingMode")!;
        //DrawGL.uniTexTargetDimensions = gl.getUniformLocation(DrawGL.glUiProgram, "targetDimensions")!;
        //DrawGL.uniTexSourceDimensions = gl.getUniformLocation(DrawGL.glUiProgram, "sourceDimensions")!;
        //DrawGL.uniUiAlphaOverlay = gl.getUniformLocation(DrawGL.glUiProgram, "alphaOverlay")!;
    }

    static shutdownProgram(): void {
        gl.deleteProgram(DrawGL.glProgram);
        DrawGL.glProgram = -1;
        gl.deleteProgram(DrawGL.glUiProgram);
        DrawGL.glUiProgram = -1;
    }

	private static initInterfaceTexture(): void {
		DrawGL.interfacePbo = gl.createBuffer()!;
		DrawGL.interfaceTexture = gl.createTexture()!;
		gl.bindTexture(gl.TEXTURE_2D, DrawGL.interfaceTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // optional: gl.REPEAT
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // optional: gl.REPEAT
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	private static shutdownInterfaceTexture(): void {
		gl.deleteBuffer(DrawGL.interfacePbo);
		gl.deleteTexture(DrawGL.interfaceTexture);
		DrawGL.interfaceTexture = null;
	}

	/*private static prepareInterfaceTexture(canvasWidth: number, canvasHeight: number): void {
		if (canvasWidth != DrawGL.lastCanvasWidth || canvasHeight != DrawGL.lastCanvasHeight) {
			DrawGL.lastCanvasWidth = canvasWidth;
			DrawGL.lastCanvasHeight = canvasHeight;

			gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, DrawGL.interfacePbo);
			gl.bufferData(gl.PIXEL_UNPACK_BUFFER, canvasWidth * canvasHeight * 4, gl.STATIC_DRAW);
			gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
            
			gl.bindTexture(gl.TEXTURE_2D, DrawGL.interfaceTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
        const pixels = Draw2D.pixels;
        const pixelBuffer:Uint8Array = DrawGL.getPixelsAsUint8Array(pixels);
       
        // Upload the pixel buffer to the PBO
		gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, DrawGL.interfacePbo);
		gl.bufferSubData(gl.PIXEL_UNPACK_BUFFER, 0, pixelBuffer);
		gl.bindTexture(gl.TEXTURE_2D, DrawGL.interfaceTexture);
		gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, DrawGL.lastCanvasWidth, DrawGL.lastCanvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, 0);
		gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}*/

    

    

    static uniformBufferAlloc(): void {

        // Bind the buffer
        gl.bindBuffer(gl.UNIFORM_BUFFER, DrawGL.uniformBuffer.glBufferId);

        // Create a new Float32Array to hold your data
        let data = new Int32Array(2048 * 4 + 9);

        const centerX = Draw3D.centerY;
        const centerY = Draw3D.centerX;
        // Fill the data array
        data[2] = centerX;
        data[3] = centerY;
        data[4] = 1.0;
        data[5] = DrawGL.cameraX;
        data[6] = DrawGL.cameraY;
        data[7] = DrawGL.cameraZ;
        for (let i = 0; i < 2048; i++) {
            data[8 + i * 2] = Draw3D.sin[i];
            data[9 + i * 2] = Draw3D.cos[i];
        }

        // Fill the buffer with data
        gl.bufferData(gl.UNIFORM_BUFFER, data, gl.DYNAMIC_DRAW);
        // DrawGL.updateBufferWithData(DrawGL.uniformBuffer, gl.UNIFORM_BUFFER, uniformBuf, gl.DYNAMIC_DRAW);
        
        // Bind the buffer to a specific binding point
        let bindingPoint = 2;
        gl.bindBufferBase(gl.UNIFORM_BUFFER, bindingPoint, DrawGL.uniformBuffer.glBufferId);
    }

    static preDrawScene(eyeX: number, eyeY: number, eyeZ: number, topLevel: number, eyeYaw: number, eyePitch: number): void {
        if(typeof DrawGL.glProgram === 'undefined' || DrawGL.glProgram === -1 || this.noDraw){
            return;
        }

        // To be implemented, if necessary (unused callback)
    }

    static postDrawScene(): void {

        if(typeof DrawGL.glProgram === 'undefined' || DrawGL.glProgram === -1 || this.noDraw){
            return;
        }

        // Reverse buffers for update
        DrawGL.vertexBuffer.flip();
        DrawGL.uvBuffer.flip();

        // Update the vertex and uv buffers
        DrawGL.updateBufferWithData(DrawGL.tmpVertexBuffer, gl.ARRAY_BUFFER, DrawGL.vertexBuffer, gl.STREAM_DRAW);
        DrawGL.updateBufferWithData(DrawGL.tmpUvBuffer, gl.ARRAY_BUFFER, DrawGL.uvBuffer, gl.STREAM_DRAW);

        DrawGL.checkGLErrors();
    }

    static createProjectionMatrix(left:number, right:number, bottom:number, top:number, near:number, far:number) {
		// create a standard orthographic projection
		let tx = -((right + left) / (right - left));
		let ty = -((top + bottom) / (top - bottom));
		let tz = -((far + near) / (far - near));

        // TODO: refactor into main useProgram setup already in draw()
		gl.useProgram(DrawGL.glProgram);

        const matrix = new Float32Array([
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, -2 / (far - near), 0,
            tx, ty, tz, 1
        ]);
        gl.uniformMatrix4fv(DrawGL.uniProjectionMatrix, false, matrix, 0);
		gl.useProgram(null);
	}

    static draw(): void {
        
        if(typeof DrawGL.glProgram === 'undefined' || DrawGL.glProgram === -1 || this.noDraw){
            return;
        }
        
        const drawDistance = 25;
        const LOCAL_COORD_BITS = 7;
        const SCENE_SIZE = 104; 
        const LOCAL_TILE_SIZE = 1 << LOCAL_COORD_BITS; // 128 - size of a tile in local coordinates
        const width = gl.canvas.width;
        const height = gl.canvas.height;

        if (width != DrawGL.lastCanvasWidth || height != DrawGL.lastCanvasHeight) {
			DrawGL.createProjectionMatrix(0, width, height, 0, 0, SCENE_SIZE * LOCAL_TILE_SIZE);
            DrawGL.lastCanvasWidth = width;
            DrawGL.lastCanvasHeight = height;
        }

        // currently a misnomer. this simply uploads our array buffers
        DrawGL.postDrawScene();
        DrawGL.uniformBufferAlloc();

        // textures
        if (DrawGL.textureArrayId == -1) {
            // lazy init textures as they may not be loaded at plugin start.
            // this will return -1 and retry if not all textures are loaded yet, too.
            DrawGL.initTextureArray();
        }

        const sky: number= 0x87CEEB;//0x555555;//0x87CEEB;
		//gl.clearColor((sky >> 16 & 0xFF) / 255.0, (sky >> 8 & 0xFF) / 255.0, (sky & 0xFF) / 255.0, 1.0);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clear(gl.COLOR_BUFFER_BIT); 
        gl.viewport(0, 0, DrawGL.lastCanvasWidth, DrawGL.lastCanvasHeight);
        
        // Draw the 3D scene
        gl.useProgram(DrawGL.glProgram);
        
        //const LOCAL_HALF_TILE_SIZE = LOCAL_TILE_SIZE / 2;
        gl.uniform1i(DrawGL.uniUseFog, 0);//fogDepth > 0 ? 1 : 0
        gl.uniform4f(DrawGL.uniFogColor, (sky >> 16 & 0xFF) / 255.0, (sky >> 8 & 0xFF) / 255.0, (sky & 0xFF) / 255.0, 1.0);
        gl.uniform1i(DrawGL.uniFogDepth, 0);//fogDepth
        gl.uniform1i(DrawGL.uniDrawDistance, drawDistance * LOCAL_TILE_SIZE);
        gl.uniform1i(DrawGL.uniExpandedMapLoadingChunks, /*client.getExpandedMapLoading()*/1.0);

        // Brightness happens to also be stored in the texture provider, so we use that
        gl.uniform1f(DrawGL.uniBrightness, /*(float) textureProvider.getBrightness()*/.80);
        gl.uniform1f(DrawGL.uniSmoothBanding, 1.0/*config.smoothBanding() ? 0f : 1f*/);
        gl.uniform1f(DrawGL.uniTextureLightMode, 1); // BRIGHT TEXTURES CONFIG
        /*if (gameState == GameState.LOGGED_IN)
        {
            // avoid textures animating during loading
            gl.uniform1i(uniTick, client.getGameCycle());
        }*/

        // Bind uniforms
        gl.uniformBlockBinding(DrawGL.glProgram, DrawGL.uniBlockMain, 2);
        gl.uniform1i(DrawGL.uniTextures, 1); // texture sampler array is bound to texture1

        // We just allow the GL to do face culling. Note this requires the priority renderer
        // to have logic to disregard culled faces in the priority depth testing.
        gl.enable(gl.CULL_FACE); // Enable face culling
        gl.enable(gl.BLEND);

        //TODO; this may be the source of the texture issues.
        // Enable blending for alpha
        ///gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
	    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw buffers
        // Only use the temporary buffers, which will contain the full scene
        gl.bindVertexArray(DrawGL.vaoTemp);

        //console.log(`DrawGL.targetBufferOffset: ${DrawGL.targetBufferOffset} | VertexBuffer Length: ${DrawGL.vertexBuffer.getSize()} | UVBuffer Length: ${DrawGL.uvBuffer.getSize()}`);
        //console.dir(DrawGL.vertexBuffer.getBuffer());
        gl.drawArrays(gl.TRIANGLES, 0, DrawGL.targetBufferOffset);

        gl.disable(gl.BLEND);
        gl.disable(gl.CULL_FACE);

        gl.useProgram(null);

        DrawGL.checkGLErrors();

        DrawGL.uniformIntBuffer.clear();
        DrawGL.vertexBuffer.clear();
        DrawGL.uvBuffer.clear();
        DrawGL.targetBufferOffset = 0;

        // Draw the UI
        DrawGL.drawUi(0);
    }

	private static drawUi(overlayColor: number): void {

        const canvasWidth: number = gl.canvas.width;
        const canvasHeight: number = gl.canvas.height;

		gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        gl.bindTexture(gl.TEXTURE_2D, DrawGL.interfaceTexture);
        const pixBuf = DrawGL.getPixelsAsUint8Array(Draw2D.pixels);
       // if (!DrawGL.textureInit || canvasWidth !== DrawGL.lastCanvasWidth || canvasHeight !== DrawGL.lastCanvasHeight) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvasWidth, canvasHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixBuf);
            DrawGL.lastCanvasWidth = canvasWidth;
            DrawGL.lastCanvasHeight = canvasHeight;
        //    DrawGL.textureInit = true;
        //    console.log('DrawGL: textureInit');
        //} else {
        //    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, canvasWidth, canvasHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixBuf);
        //}

		gl.useProgram(DrawGL.glUiProgram);
		gl.uniform1i(DrawGL.uniTex, 0);
		gl.bindVertexArray(DrawGL.vaoUiHandle);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

		// Reset
        Draw3D.clear();
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindVertexArray(null);
		gl.useProgram(null);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.disable(gl.BLEND);

        DrawGL.vertexBuffer.clear();

        DrawGL.checkGLErrors();
	}

    // todo: circlular dependency with Model
    private static drawModel(model:Model, orientation: number, pitchSine: number, pitchCos: number, yawSin: number, yawCos: number, offsetX: number, offsetY: number, offsetZ: number, bitset: number): void {
        if(typeof DrawGL.glProgram === 'undefined' || DrawGL.glProgram === -1 || this.noDraw){
            return;
        }
    }

    private static updateBufferWithData(glBuffer:GLBuffer, target: number, data: any, usage: number) : void
	{
        const buffer = data.getBuffer();
        const size = buffer.length;
		gl.bindBuffer(target, glBuffer.glBufferId);
		if (size > glBuffer.size)
		{
			let newSize = Math.max(size, glBuffer.size * 2);
			glBuffer.size = newSize;
			gl.bufferData(target, newSize * buffer.BYTES_PER_ELEMENT, usage);
		}
		gl.bufferSubData(target, 0, buffer);
	}

    private static checkGLErrors(): void{
        // Check for GL errors
		for (; ; )
		{
			let err = gl.getError();
			if (err == gl.NO_ERROR)
			{
				return;
			}

			let errStr;
			switch (err)
			{
				case gl.INVALID_ENUM:
					errStr = "INVALID_ENUM";
					break;
				case gl.INVALID_VALUE:
					errStr = "INVALID_VALUE";
					break;
				case gl.INVALID_OPERATION:
					errStr = "INVALID_OPERATION";
					break;
				case gl.INVALID_FRAMEBUFFER_OPERATION:
					errStr = "INVALID_FRAMEBUFFER_OPERATION";
					break;
				default:
					errStr = "" + err;
					break;
			}

			console.log("glGetError:", new Error(errStr));
            this.noDraw = true;
            return;
		}
	}

    static convertPixels(srcPixels:Int8Array, width:number, height:number, textureWidth:number, textureHeight:number) : Uint8Array {
		const pixels = new Uint8Array(textureWidth * textureHeight * 4);

		let pixelIdx = 0;
		let srcPixelIdx = 0;

		let offset = (textureWidth - width) * 4;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let rgb = srcPixels[srcPixelIdx++];
				if (rgb != 0) {
					pixels[pixelIdx++] = (rgb >> 16);
					pixels[pixelIdx++] = (rgb >> 8);
					pixels[pixelIdx++] = rgb;
					pixels[pixelIdx++] = -1;
				} else {
					pixelIdx += 4;
				}
			}
			pixelIdx += offset;
		}
		return pixels;
	}

    private static getPixelsAsUint8Array(arr: Int32Array): Uint8Array {
        let pixels:Uint8Array = new Uint8Array(arr.buffer);
        for (let i = 0; i < pixels.length; i += 4) {
            let temp = pixels[i];
            pixels[i] = pixels[i + 2];
            pixels[i + 2] = temp;
        }
        return pixels;
    }
}