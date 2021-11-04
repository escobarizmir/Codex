# Codex 2.0 Application Design

With this rewrite I tried to structure Codex securely so that it will be compatible with future Electron updates.

Compiling the application is now split up into two steps:

* Main and Preload scripts
* Renderer script

## Main and Preload scripts

The Main and Preload scripts are meant to use Nodejs `require()` statements to load dependencies, so they can just be compiled regularly with the TypeScript compiler.

The Preload script is meant to expose a short list of functions to the renderer that have to do with file IO and IPC calls. It also initializes the custom titlebar and highlights the example code in the Settings page.

## Renderer script

The Renderer script is isolated from Nodejs for security and should use the functions exposed with the Preload script to communicate with the main thread and make file IO operations.

But the renderer also needs access to the ProseMirror packages to make the editor work, and setting that up in the preload script does not work.

So the renderer script is bundled with **Webpack** so that all of the dependencies that it needs get bundled into a single js file with no need to `require()` anything.

Webpack first compiles the TypeScript `renderer.ts` file using ts-loader, which can only use the global `tsconfig.json` file and can't use a different one. That's why the main and preload scripts are compiled with `--project tsconfig.main.json`. Then it bundles all of the dependencies and spits out a single renderer.js file that Electron can use.