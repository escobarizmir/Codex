import { contextBridge, ipcRenderer, IpcRendererEvent, nativeTheme } from "electron";
import * as feather from "feather-icons";
import * as fs from "fs";

/* eslint-disable @typescript-eslint/no-var-requires */

// Just load the HLJS core library and the C++ language
const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("cpp", require("highlight.js/lib/languages/cpp"));

const customTitlebar = require("@treverix/custom-electron-titlebar");

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

    ipcSendSync: (channel: string, ...args: any[]): any => {
        return ipcRenderer.sendSync(channel, args);
    },

    fsExistsSync: (path: string): boolean => {
        return fs.existsSync(path);
    },

    fsReadFileSync: (path: string): string => {
        return fs.readFileSync(path, "utf-8");
    },

    fsWriteFileSync: (path: string, data: string): void => {
        fs.writeFileSync(path, data, "utf-8");
    },

});

// Initialize custom titlebar
window.addEventListener("DOMContentLoaded", () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex("#343A40"),
            unfocusEffect: true,
            icon: "../assets/icons/icon.ico"
    });
});