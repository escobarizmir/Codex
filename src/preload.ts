import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import * as fs from "fs";

/* eslint-disable @typescript-eslint/no-var-requires */

// Just load the HLJS core library and the C++ language
const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("cpp", require("highlight.js/lib/languages/cpp"));

const customTitlebar = require("@treverix/custom-electron-titlebar");

/* eslint-enable @typescript-eslint/no-var-requires */

contextBridge.exposeInMainWorld("mainAPI", {

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

    fsMkDirSync: (path: string): void => {
        fs.mkdirSync(path);
    },

});

// Initialize custom titlebar
window.addEventListener("DOMContentLoaded", () => {

	// Set up example code block in Settings page and highlight it
    document.getElementById("exampleCode").innerHTML = "//EXAMPLE CODE BLOCK\n#include &lt;iostream&gt;\n\nint main(int argc, char *argv[]) {\n\tfor (auto i = 0; i &lt; 0xFFFF; i++)\n\t\tcout &lt;&lt; \"Hello, World!\" &lt;&lt; endl;\n\treturn -2e3 + 12l;\n}";
    document.getElementById("exampleCode").innerHTML = hljs.highlight(document.getElementById("exampleCode").innerText, {language: "cpp", ignoreIllegals: "false"}).value;

    if (process.platform === "win32") {
        new customTitlebar.Titlebar({
            backgroundColor: customTitlebar.Color.fromHex("#343A40"),
                unfocusEffect: true,
                icon: "../assets/icons/icon.ico"
        });

        document.getElementById("editorRibbon").style.marginTop = "40px";

        if (process.platform !== "win32") {
            document.documentElement.style.setProperty("--titlebar-height", "0px");
        }
    }
});