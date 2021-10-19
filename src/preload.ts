import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import * as feather from "feather-icons";
import * as hljs from "highlight.js";

/* eslint-disable  @typescript-eslint/no-explicit-any */
contextBridge.exposeInMainWorld("mainAPI", {
    featherReplace: feather.replace,
    hljs: hljs,
    ipcHandle: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
        ipcRenderer.on(channel, listener);
    }
});