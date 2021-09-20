import { contextBridge } from 'electron';
import * as feather from 'feather-icons';
import * as hljs from 'highlight.js';

contextBridge.exposeInMainWorld('mainAPI', {
    featherReplace: () => feather.replace(),
    hljs: hljs
});