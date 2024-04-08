export default class Template {
    private readonly resourceLoaders: Array<(filename: string) => string | null> = [];

    public process(str: string): string {
        const lines: string[] = str.split('\n');
        const processedLines: string[] = [];

        for (const line of lines) {
            if (line.startsWith('#include ')) {
                const resource: string = line.substring(9).trim();
                const resourceStr: string = this.load(resource);
                processedLines.push(resourceStr);
            } else {
                processedLines.push(line);
            }
        }

        return processedLines.join('\n');
    }

    public load(filename: string): string {
        for (const loader of this.resourceLoaders) {
            const value: string | null = loader(filename);
            if (value !== null) {
                return this.process(value);
            }
        }

        return '';
    }

    public add(fn: (filename: string) => string | null): Template {
        this.resourceLoaders.push(fn);
        return this;
    }

    /*public addInclude(clazz: any): Template {
        return this.add((filename) => {
            try {
                // todo: what does getResourceAsStream do in Java when provided a class?
                const is = clazz.getResourceAsStream(filename);
                if (is !== null) {
                    return this.inputStreamToString(is);
                }
            } catch (ex) {
                console.warn(ex);
            }
            return null;
        });
    }*/

    /*private inputStreamToString(inStream: any): string {
        try {
            return inStream.toString();
        } catch (e:any) {
            throw new Error(e);
        }
    }*/
}
