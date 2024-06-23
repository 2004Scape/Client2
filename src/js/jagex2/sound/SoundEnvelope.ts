import Packet from '../io/Packet';

export default class SoundEnvelope {
    start: number = 0;
    end: number = 0;
    form: number = 0;

    private length: number = 0;
    private shapeDelta: Int32Array | null = null;
    private shapePeak: Int32Array | null = null;
    private threshold: number = 0;
    private position: number = 0;
    private delta: number = 0;
    private amplitude: number = 0;
    private ticks: number = 0;

    read(dat: Packet): void {
        this.form = dat.g1;
        this.start = dat.g4;
        this.end = dat.g4;
        this.length = dat.g1;
        this.shapeDelta = new Int32Array(this.length);
        this.shapePeak = new Int32Array(this.length);

        for (let i: number = 0; i < this.length; i++) {
            this.shapeDelta[i] = dat.g2;
            this.shapePeak[i] = dat.g2;
        }
    }

    reset(): void {
        this.threshold = 0;
        this.position = 0;
        this.delta = 0;
        this.amplitude = 0;
        this.ticks = 0;
    }

    evaluate(delta: number): number {
        if (this.ticks >= this.threshold && this.shapePeak && this.shapeDelta) {
            this.amplitude = this.shapePeak[this.position++] << 15;

            if (this.position >= this.length) {
                this.position = this.length - 1;
            }

            this.threshold = ((this.shapeDelta[this.position] / 65536.0) * delta) | 0;
            if (this.threshold > this.ticks) {
                this.delta = (((this.shapePeak[this.position] << 15) - this.amplitude) / (this.threshold - this.ticks)) | 0;
            }
        }

        this.amplitude += this.delta;
        this.ticks++;
        return (this.amplitude - this.delta) >> 15;
    }
}
