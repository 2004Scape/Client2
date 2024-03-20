export default class GLBuffer {
	name: string;
	glBufferId: WebGLBuffer = -1;
	size: number = -1;
	constructor(name: string) {
		this.name = name;
	}
}