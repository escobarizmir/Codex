/* 

    Expose the variables/functions sent through the preload.ts 

*/

type _MainAPI = {
    featherReplace(): void,
    hljs: HLJSApi
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
type BridgedWindow = Window & typeof globalThis & {
    mainAPI: any
}
/* eslint-enable  @typescript-eslint/no-explicit-any */
const mainAPI: _MainAPI = (window as BridgedWindow).mainAPI;

/*

    Initialization

*/

function init() {

    window.addEventListener("auxclick", (event) => {
        if (event.button === 1) {
            event.preventDefault();
        }
    });
    window.addEventListener("click", (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
        }
    });

    //TODO: Set up ContextMenu

    mainAPI.featherReplace();

}

init();