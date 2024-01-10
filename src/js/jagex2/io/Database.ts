export default class Database {
    private readonly db: IDBDatabase;

    constructor(db: IDBDatabase) {
        db.onerror = this.onerror;
        db.onclose = this.onclose;
        this.db = db;
    }

    static openDatabase = (): Promise<IDBDatabase> => {
        return new Promise<IDBDatabase>((resolve, reject): void => {
            const request: IDBOpenDBRequest = indexedDB.open('lostcity', 1);

            request.onsuccess = (event: Event): void => {
                const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
                console.log('database success!');
                resolve(target.result);
            };

            request.onupgradeneeded = (event: Event): void => {
                const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
                target.result.createObjectStore('cache');
            };

            request.onerror = (event: Event): void => {
                const target: IDBOpenDBRequest = event.target as IDBOpenDBRequest;
                console.error('database error!: ', target.error);
                reject(target.result);
            };
        });
    };

    cacheload = (name: string): Promise<Int8Array | undefined> => {
        return new Promise<Int8Array | undefined>((resolve): void => {
            const transaction: IDBTransaction = this.db.transaction('cache', 'readonly');
            const store: IDBObjectStore = transaction.objectStore('cache');
            const request: IDBRequest<Int8Array> = store.get(this.genHash(name));

            request.onsuccess = (): void => {
                console.log('cacheload successful!');
                resolve(request.result);
            };

            request.onerror = (event: Event): void => {
                console.error('cacheload error!:', event);
                resolve(undefined);
            };
        });
    };

    cachesave = (name: string, src: Int8Array): Promise<void> => {
        return new Promise<void>((resolve, reject): void => {
            if (src.length > 2000000) {
                reject();
                return;
            }

            const transaction: IDBTransaction = this.db.transaction('cache', 'readwrite');
            const store: IDBObjectStore = transaction.objectStore('cache');
            const request: IDBRequest<IDBValidKey> = store.put(src, this.genHash(name));

            request.onsuccess = (): void => {
                console.log('cachesave successful!');
                resolve();
            };

            request.onerror = (event: Event): void => {
                console.error('cachesave error!:', event);
                reject();
            };
        });
    };

    onclose = (event: Event): void => {
        console.log('database close!');
    };

    onerror = (event: Event): void => {
        console.log('database error!');
    };

    private genHash = (str: string): number => {
        const trimmed: string = str.trim();
        let hash: number = 0;
        for (let i: number = 0; i < trimmed.length && i < 12; i++) {
            const c: string = trimmed.charAt(i);
            hash *= 37;

            if (c >= 'A' && c <= 'Z') {
                hash += c.charCodeAt(0) + 1 - 65;
            } else if (c >= 'a' && c <= 'z') {
                hash += c.charCodeAt(0) + 1 - 97;
            } else if (c >= '0' && c <= '9') {
                hash += c.charCodeAt(0) + 27 - 48;
            }
        }
        return hash;
    };
}
