import Jagfile from '../io/Jagfile';
import SoundTone from './SoundTone';
import Packet from '../io/Packet';

export default class Wave {
    static readonly delays: number[] = new Array(1000);
    static waveBytes: Uint8Array | null = null;
    static waveBuffer: Packet | null = null;

    private static readonly tracks: Wave[] = new Array(1000);
    private readonly tones: SoundTone[] = new Array(10);

    private loopBegin: number = 0;
    private loopEnd: number = 0;

    static unpack = (sounds: Jagfile): void => {
        const dat: Packet = new Packet(sounds.read('sounds.dat'));
        this.waveBytes = new Uint8Array(441000);
        this.waveBuffer = new Packet(this.waveBytes);
        SoundTone.init();

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const id: number = dat.g2;
            if (id === 65535) {
                break;
            }

            this.tracks[id] = new Wave();
            this.tracks[id].read(dat);
            this.delays[id] = this.tracks[id].trim();
        }
    };

    static generate = (id: number, loopCount: number): Packet | null => {
        if (!this.tracks[id]) {
            return null;
        }
        const track: Wave = this.tracks[id];
        return track.getWave(loopCount);
    };

    read = (dat: Packet): void => {
        for (let tone: number = 0; tone < 10; tone++) {
            if (dat.g1 !== 0) {
                dat.pos--;
                this.tones[tone] = new SoundTone();
                this.tones[tone].read(dat);
            }
        }
        this.loopBegin = dat.g2;
        this.loopEnd = dat.g2;
    };

    trim = (): number => {
        let start: number = 9999999;
        for (let tone: number = 0; tone < 10; tone++) {
            if (this.tones[tone] && Math.trunc(this.tones[tone].start / 20) < start) {
                start = Math.trunc(this.tones[tone].start / 20);
            }
        }

        if (this.loopBegin < this.loopEnd && Math.trunc(this.loopBegin / 20) < start) {
            start = Math.trunc(this.loopBegin / 20);
        }

        if (start === 9999999 || start === 0) {
            return 0;
        }

        for (let tone: number = 0; tone < 10; tone++) {
            if (this.tones[tone]) {
                this.tones[tone].start -= start * 20;
            }
        }

        if (this.loopBegin < this.loopEnd) {
            this.loopBegin -= start * 20;
            this.loopEnd -= start * 20;
        }

        return start;
    };

    getWave = (loopCount: number): Packet | null => {
        const length: number = this.generate(loopCount);
        Wave.waveBuffer?.p4(0x52494646); // "RIFF" ChunkID
        Wave.waveBuffer?.ip4(length + 36); // ChunkSize
        Wave.waveBuffer?.p4(0x57415645); // "WAVE" format
        Wave.waveBuffer?.p4(0x666d7420); // "fmt " chunk id
        Wave.waveBuffer?.ip4(16); // chunk size
        Wave.waveBuffer?.ip2(1); // audio format
        Wave.waveBuffer?.ip2(1); // num channels
        Wave.waveBuffer?.ip4(22050); // sample rate
        Wave.waveBuffer?.ip4(22050); // byte rate
        Wave.waveBuffer?.ip2(1); // block align
        Wave.waveBuffer?.ip2(8); // bits per sample
        Wave.waveBuffer?.p4(0x64617461); // "data"
        Wave.waveBuffer?.ip4(length);
        if (Wave.waveBuffer) {
            Wave.waveBuffer.pos += length;
        }
        return Wave.waveBuffer;
    };

    private generate = (loopCount: number): number => {
        let duration: number = 0;
        for (let tone: number = 0; tone < 10; tone++) {
            if (this.tones[tone] && this.tones[tone].length + this.tones[tone].start > duration) {
                duration = this.tones[tone].length + this.tones[tone].start;
            }
        }

        if (duration === 0) {
            return 0;
        }

        let sampleCount: number = Math.trunc((duration * 22050) / 1000);
        let loopStart: number = Math.trunc((this.loopBegin * 22050) / 1000);
        let loopStop: number = Math.trunc((this.loopEnd * 22050) / 1000);
        if (loopStart < 0 || loopStop < 0 || loopStop > sampleCount || loopStart >= loopStop) {
            loopCount = 0;
        }

        let totalSampleCount: number = sampleCount + (loopStop - loopStart) * (loopCount - 1);
        for (let sample: number = 44; sample < totalSampleCount + 44; sample++) {
            if (Wave.waveBytes) {
                Wave.waveBytes[sample] = -128;
            }
        }

        for (let tone: number = 0; tone < 10; tone++) {
            if (this.tones[tone]) {
                const toneSampleCount: number = Math.trunc((this.tones[tone].length * 22050) / 1000);
                const start: number = Math.trunc((this.tones[tone].start * 22050) / 1000);
                const samples: number[] = this.tones[tone].generate(toneSampleCount, this.tones[tone].length);

                for (let sample: number = 0; sample < toneSampleCount; sample++) {
                    if (Wave.waveBytes) {
                        Wave.waveBytes[sample + start + 44] += samples[sample] >> 8; // TODO might be wrong here
                    }
                }
            }
        }

        if (loopCount > 1) {
            loopStart += 44;
            loopStop += 44;
            sampleCount += 44;
            totalSampleCount += 44;

            const endOffset: number = totalSampleCount - sampleCount;
            for (let sample: number = sampleCount - 1; sample >= loopStop; sample--) {
                if (Wave.waveBytes) {
                    Wave.waveBytes[sample + endOffset] = Wave.waveBytes[sample];
                }
            }

            for (let loop: number = 1; loop < loopCount; loop++) {
                const offset: number = (loopStop - loopStart) * loop;

                for (let sample: number = loopStart; sample < loopStop; sample++) {
                    if (Wave.waveBytes) {
                        Wave.waveBytes[sample + offset] = Wave.waveBytes[sample];
                    }
                }
            }

            totalSampleCount -= 44;
        }

        return totalSampleCount;
    };
}
