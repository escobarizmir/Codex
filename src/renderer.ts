/* Expose the variables/functions sent through the preload.ts */

/* eslint-disable  @typescript-eslint/no-explicit-any */
type BridgedWindow = Window & typeof globalThis & {
    mainAPI: any
}
const mainAPI: any = (window as BridgedWindow).mainAPI;
/* eslint-enable  @typescript-eslint/no-explicit-any */

console.log("Renderer loaded!");
console.debug(mainAPI.desktop);

mainAPI.feather.replace();