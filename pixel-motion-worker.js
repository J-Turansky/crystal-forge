import {motionGuide} from './pixel-motion.js';
self.onmessage=({data})=>{try{self.postMessage({serial:data.serial,guide:motionGuide(data.crystals,data.settings,data.selection)});}catch(error){self.postMessage({serial:data.serial,error:error.message});}};
