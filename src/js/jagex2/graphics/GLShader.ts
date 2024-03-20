import { gl } from "./Canvas";

export class GLShader {
    private units: Unit[] = [];

    public add(type: number, filename: string): GLShader {
        this.units.push(new Unit(type, filename));
        return this;
    }

    public async compile(): Promise<WebGLProgram> {
        const program: WebGLProgram = gl.createProgram()!;
        const shaders: WebGLShader[] = new Array(this.units.length);
        let i: number = 0;
        let ok: boolean = false;

        try {
            while (i < shaders.length) {
                const unit: Unit = this.units[i];
                const shader: WebGLShader | null = gl.createShader(unit.getType);

                if (shader === null) {
                    throw new ShaderException(`Unable to create shader of type ${unit.getType}`);
                }
                console.log(unit.getFilename);
                
                let resp = await fetch(unit.getFilename);
                let source = await resp.text();
                gl.shaderSource(shader, source);
                gl.compileShader(shader);

                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    const err: string | null = gl.getShaderInfoLog(shader);
                    gl.deleteShader(shader);
                    throw new ShaderException(err);
                }

                gl.attachShader(program, shader);
                shaders[i++] = shader;
            }

            gl.linkProgram(program);

            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                const err: string | null = gl.getProgramInfoLog(program);
                throw new ShaderException(err);
            }

            gl.validateProgram(program);

            if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
                const err: string | null = gl.getProgramInfoLog(program);
                throw new ShaderException(err);
            }

            ok = true;
        } finally {
            while (i > 0) {
                const shader: WebGLShader = shaders[--i];
                gl.detachShader(program, shader);
                gl.deleteShader(shader);
            }

            if (!ok) {
                gl.deleteProgram(program);
            }
        }

        return program;
    }
}

class Unit {
    constructor(private readonly type: number, private readonly filename: string) {}

    public get getType(): number {
        return this.type;
    }

    public get getFilename(): string {
        return this.filename;
    }
}

class ShaderException extends Error {
    constructor(message: string | null) {
        super(message ?? '');
        this.name = 'ShaderException';
    }
}