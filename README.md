# Client2

This project is a comprehensive source port of our [Client refactor](https://github.com/2004scape/Client) from Java to TypeScript.

Click [here](https://github.com/2004scape/Client2/tree/gh-pages) to view the current deployment summary. 🚀

## Site Index

### Client

Try out the client hosted on Github!

| World           | High Detail                                                                    | Low Detail                                                                    |
|-----------------|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------|
| 1 (Central USA) | [Play Now!](https://2004scape.github.io/Client2/?world=1&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=1&detail=low&method=0) |
| 2 (Germany)     | [Play Now!](https://2004scape.github.io/Client2/?world=2&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=2&detail=low&method=0) |
| 3 (Central USA) | [Play Now!](https://2004scape.github.io/Client2/?world=3&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=3&detail=low&method=0) |
| 4 (Germany)     | [Play Now!](https://2004scape.github.io/Client2/?world=4&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=4&detail=low&method=0) |

### Playground

Testing code for an interactive model viewer. Code "playground."

https://2004scape.github.io/Client2/playground

### Viewer

Cache viewer.

https://2004scape.github.io/Client2/viewer

### Items Viewer

https://2004scape.github.io/Client2/items

## First Time Installation

```shell
npm install
npm run prepare
npm run build:dev
```

If you are on a Mac:
```shell
chmod ug+x .husky/*
chmod ug+x .git/hooks/*
```

## Local

Local development should be done with: `npm run dev`

The client will automatically launch connecting to World 1.
Local world is hosted on World 0.
You have the ability to connect to live servers from the local client by changing the param.

http://localhost:8080/?world=0&detail=high&method=0

This is not to be confused with the Java TeaVM client which is hosted here if the local server is running:

http://localhost/client?world=0&detail=high&method=0