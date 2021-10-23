import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {

    ipcSend: (channel: string, ...args: any[]): void => {
        ipcRenderer.send(channel, args);
    },

});