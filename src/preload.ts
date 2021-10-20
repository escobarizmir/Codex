import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import * as feather from "feather-icons";
import * as fs from "fs";

/* eslint-disable @typescript-eslint/no-var-requires */

// Just load the HLJS core library and the C++ language
const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("cpp", require("highlight.js/lib/languages/cpp"));

// TODO: Find a better way to get the userData path to renderer
// without using @electron/remote
const { app } = require("@electron/remote");

/* eslint-enable @typescript-eslint/no-var-requires */

contextBridge.exposeInMainWorld("mainAPI", {

    featherReplace: feather.replace,

    hljsHighlightCpp: (text: string): string => {
        return hljs.highlight(text, {language: "cpp", ignoreIllegals: "false"}).value;
    },

    ipcHandle: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
        ipcRenderer.on(channel, listener);
    },

    ipcSend: (channel: string, ...args: any[]): void => {
        ipcRenderer.send(channel, args);
    },

    defaultDataDir: app.getPath("userData"),

    fsExistsSync: (path: string): boolean => {
        return fs.existsSync(path);
    },

    fsReadFileSync: (path: string): string => {
        return fs.readFileSync(path, "utf-8");
    },

    jsonParse: (text: string): any => {
        return JSON.parse(text);
    }
});