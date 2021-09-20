import { contextBridge } from 'electron';
import * as feather from 'feather-icons';

contextBridge.exposeInMainWorld('mainAPI', {
    feather: feather    
});