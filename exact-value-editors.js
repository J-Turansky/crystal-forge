/* Keep the displayed units when entering exact slider values. Commit is explicit
 * (Enter); Escape, blur and switching models leave the old value unchanged. */
const percentKeys=new Set(['crystalSize','studioBrightness']);
const relativeKeys=new Set(['bottomScale','topScale']);
export function displayedNumber(key,value){return relativeKeys.has(key)?(value-1)*100:percentKeys.has(key)?value*100:value;}
export function sliderNumber(key,value){return relativeKeys.has(key)?1+value/100:percentKeys.has(key)?value/100:value;}
export function validateExactValue(key,text,min,max,{legacy=true}={}){
 if(!String(text).trim())return {valid:false,error:'Enter a number.'};
 const entered=Number(String(text).trim());
 const value=legacy?sliderNumber(key,entered):entered;
 if(!Number.isFinite(value))return {valid:false,error:'Enter a finite number.'};
 if(value<min||value>max)return {valid:false,error:'Enter a value from '+(legacy?displayedNumber(key,min):min)+' to '+(legacy?displayedNumber(key,max):max)+'.'};
 return {valid:true,value};
}
export function installExactValueEditors(root=document){
 let active=null;
 function cancel(){if(!active)return;const {output,input}=active;active=null;output.hidden=false;input.remove();}
 function enhance(){
  for(const output of root.querySelectorAll('output[data-out],output[data-value-for]')){
   if(output.dataset.exactReady)continue;
   const key=output.dataset.out||output.dataset.valueFor;
   const slider=root.querySelector('input[type="range"][data-state="'+key+'"],input[type="range"][data-model-param="'+key+'"]');
   if(!slider)continue;
   output.dataset.exactReady='true';output.tabIndex=0;output.setAttribute('role','button');
   output.title='Click or press Enter to type an exact value. Enter applies; Escape cancels.';
   output.classList.add('exact-value');
   const begin=()=>{
    if(slider.disabled)return;cancel();
    const input=document.createElement('input');input.type='text';input.inputMode='decimal';input.className='exact-value-input';
    const legacy=!!output.dataset.out;
    input.value=String(Number((legacy?displayedNumber(key,Number(slider.value)):Number(slider.value)).toFixed(6)));
    input.setAttribute('aria-label','Exact '+key+' value');input.dataset.exactInput=key;
    output.hidden=true;output.after(input);active={output,input};input.focus();input.select();
    input.addEventListener('click',event=>event.stopPropagation());
    input.addEventListener('keydown',event=>{
     if(event.key!=='Enter'&&event.key!=='Escape')return;
     event.preventDefault();event.stopPropagation();
     if(event.key==='Escape'){cancel();output.focus();return;}
     const checked=validateExactValue(key,input.value,Number(slider.min||0),Number(slider.max||100),{legacy});
     if(!checked.valid){input.setAttribute('aria-invalid','true');input.setCustomValidity(checked.error);input.reportValidity();return;}
     // Range assignment snaps to the browser's declared precision (e.g. an
     // integer crystal count), so slider and editable value stay in agreement.
     if(!new Set(['count','seed','roundSteps','pixelCount','tabCount','tabHolesPerTab','teeth','spokes','facets']).has(key))slider.step='any';
     slider.value=String(checked.value);cancel();
     slider.dispatchEvent(new Event('input',{bubbles:true}));slider.dispatchEvent(new Event('change',{bubbles:true}));output.focus();
    });
    input.addEventListener('input',()=>{input.setCustomValidity('');input.removeAttribute('aria-invalid');});
    input.addEventListener('blur',cancel);
   };
   output.addEventListener('click',event=>{event.preventDefault();begin();});
   output.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();begin();}});
  }
 }
 enhance();return {refresh:enhance,cancel};
}
