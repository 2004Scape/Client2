# Client2

This project is a comprehensive source port of our [Client refactor](https://github.com/2004scape/Client) from Java to TypeScript.

Click [here](https://github.com/2004scape/Client2/tree/gh-pages) to view the current deployment summary. 🚀

## Site Index

### Client

Try out the client hosted on Github! It is 100% source ported and available to use.
Create your account on the 2004scape website.

| World           | High Detail                                                                    | Low Detail                                                                    | Members |
|-----------------|--------------------------------------------------------------------------------|-------------------------------------------------------------------------------|---------|
| 1 (Central USA) | [Play Now!](https://2004scape.github.io/Client2/?world=1&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=1&detail=low&method=0) | No      |
| 2 (Central USA) | [Play Now!](https://2004scape.github.io/Client2/?world=2&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=2&detail=low&method=0) | Yes     |
| 3 (Germany)     | [Play Now!](https://2004scape.github.io/Client2/?world=3&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=3&detail=low&method=0) | Yes     |
| 4 (Germany)     | [Play Now!](https://2004scape.github.io/Client2/?world=4&detail=high&method=0) | [Play Now!](https://2004scape.github.io/Client2/?world=4&detail=low&method=0) | No      |

### <a href="https://2004scape.github.io/Client2/playground" target="_blank">Playground</a> - An Interactive Model Viewer
### <a href="https://2004scape.github.io/Client2/items" target="_blank">Items Viewer</a> - View All the Items
### <a href="https://2004scape.github.io/Client2/mesanim" target="_blank">Message Animation Viewer</a> - A Chat Message Animation Editor
### <a href="https://2004scape.github.io/Client2/sounds" target="_blank">Sounds Viewer</a> - Sounds Viewer & Listener
### <a href="https://2004scape.github.io/Client2/viewer" target="_blank">Viewer</a> - A Cache Viewer (WIP)
### <a href="https://2004scape.github.io/Client2/interface-editor" target="_blank">Interface Editor</a> - An Interface Editor (WIP)

---

## Commands

`::debug` Shows performance metrics (FPS, frame times and more).

`::fps` Set a targeted FPS (ex. `::fps 30`)

A developer can utilize the debug command for development purposes.
![debugging](https://github.com/2004scape/Client2/assets/76214316/9cec6fb5-7a79-4d81-97ed-a96a5fecd85a)

---

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

http://localhost:8080/?world=0&detail=high&method=0 (TypeScript)

This is not to be confused with the Java TeaVM client which is hosted here if the local server is running:

http://localhost/client?world=0&detail=high&method=0 (Java)
