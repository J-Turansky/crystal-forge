/* Isolate the expensive crystal-string route search from the UI event loop.
 * The caller owns cancellation, 8s timeout and stale-snapshot protection.
 * This worker only evaluates immutable, structured-cloneable inputs. */
import {repairPixelRouting} from './pixel-motion.js';
self.onmessage=event=>{
 const {serial,crystals,settings}=event.data||{};
 try{
  if(!Number.isSafeInteger(serial)||!Array.isArray(crystals)||!settings||typeof settings!=='object')
   throw Error('Invalid automatic routing request.');
  const answer=repairPixelRouting(crystals,settings);
  self.postMessage({serial,valid:answer.valid,reason:answer.reason||null,
   settings:answer.valid?answer.settings:null});
 }catch(error){
  self.postMessage({serial,valid:false,reason:'Automatic routing could not complete: '+(error?.message||String(error)),error:true});
 }
};
