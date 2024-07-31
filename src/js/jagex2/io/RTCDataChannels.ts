export class Host {
    private peers: Map<string, RTCDataChannel> = new Map();
    private worker: Worker;
    public uniqueId: string = self.isSecureContext ? self.crypto.randomUUID() : '0';

    constructor(worker: Worker) {
        this.worker = worker;
    }

    async setupPeerConnection(): Promise<void> {
        const pc: RTCPeerConnection = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
        const dc: RTCDataChannel = pc.createDataChannel('channel');
        const id: string = crypto.randomUUID();
        this.peers.set(id, dc);

        await pc.setLocalDescription(await pc.createOffer());

        pc.onicegatheringstatechange = async (): Promise<void> => {
            if (pc.iceGatheringState === 'complete') {
                if (self.isSecureContext) {
                    await navigator.clipboard.writeText(JSON.stringify(pc.localDescription));
                } else {
                    console.log(JSON.stringify(pc.localDescription));
                }

                let answer: string | null;
                try {
                    while ((answer = prompt('Offer copied to clipboard, paste answer here')) === null);
                    pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(answer)));
                } catch (e) {
                    console.error(e);
                }
            }
        };

        dc.onopen = (): void => {
            dc.send(JSON.stringify({type: 'id', id: id}));
            console.log('Connected to peer!');
        };

        dc.onerror = (e): void => {
            console.error(e);
        };

        dc.onmessage = (e: MessageEvent): void => {
            const msg: {type: string; data: object; id: string} = JSON.parse(e.data);

            if (msg.data) {
                msg.data = Object.values(msg.data);
            }

            if (this.worker) {
                this.worker.postMessage(msg);
            }
        };
    }

    public postMessage(e: MessageEvent): void {
        const dc: RTCDataChannel | undefined = this.peers.get(e.data.id);
        const msg: {type: string; data: Uint8Array | object; id: string} = e.data;

        if (msg.data) {
            msg.data = Array.from(e.data.data);
        }
        if (dc && dc.readyState === 'open') {
            dc.send(JSON.stringify(msg));
        }
    }
}

export class Peer {
    public pc: RTCPeerConnection;
    public dc: RTCDataChannel | undefined = undefined;
    public uniqueId: string | undefined;

    constructor(worker: Worker) {
        this.pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});

        this.pc.ondatachannel = (e: RTCDataChannelEvent): void => {
            this.dc = e.channel;

            this.dc.onopen = (): void => {
                console.log('Connected to host!');
            };

            this.dc.onerror = (e): void => {
                console.error(e);
            };

            this.dc.onmessage = (e: MessageEvent): void => {
                if (!this.uniqueId) {
                    const msg: {type: string; data: Array<number>; id: string} = JSON.parse(e.data);
                    if (msg.type === 'id') {
                        this.uniqueId = msg.id;
                        return;
                    }
                }

                if (worker.onmessage) worker.onmessage(e);
            };
        };

        this.pc.onicegatheringstatechange = async (): Promise<void> => {
            if (this.pc.iceGatheringState === 'complete') {
                if (self.isSecureContext) {
                    await navigator.clipboard.writeText(JSON.stringify(this.pc.localDescription));
                } else {
                    console.log(JSON.stringify(this.pc.localDescription));
                }
            }
        };
    }

    public async handleOffer(offer: string): Promise<void> {
        await this.pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer)));
        await this.pc.setLocalDescription(await this.pc.createAnswer());
    }
}
