import {pixelBuilderMarkup,bindPixelBuilder} from './studio-pixel-builder.js';
import {createModel,addModel,findModel,openTab,closeTab,reorderTabs,duplicateModel,editModel,
 queueModel,beginPreparation,finishPreparation,cancelPreparation,canExport,saveLibraryRevision,
 insertLibraryModel,availableLinkedUpdate,acceptLinkedUpdate,breakLink,modelFingerprint,validateProject,WORKSPACE_KEY,newId} from './studio-documents.js';
import {makeCatalogue,applyBuildModules,generators} from './studio-catalogue.js';
import {previewRecipe,disposeGroup} from './studio-geometry.js';
import {exportMaterialBodies} from './studio-material-export.js';
import {installExactValueEditors} from './exact-value-editors.js';
import {createCuraProfile,zipProfileEntries,curaFallbackText,calculateCuraSettings} from './cura-profiles.js';
import {StudioVault} from './studio-vault.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
export function installSensoryStudio({THREE,scene,camera,orbit,renderer,bootstrap,adapter}){
 const state=bootstrap,project=state.project;
 const unified=new URLSearchParams(location.search).get('layout')!=='legacy';
 let printExpanded=false;
 state.savedProjects??=[];project.printer={printer:'Ultimaker 3 Extended',curaNozzle:.4,curaMaterial:'PLA',curaQuality:60,curaIntent:'balanced',...project.printer};
 const crystalAdapter={typeId:'crystals',typeVersion:1,displayName:'Crystal Clusters',category:'Lighting',defaultParameters:adapter.capture().settings,
  parameterSchema:[],presets:[],capabilities:{supportsBase:true,supportsLEDs:true,supportsMounting:true,supportsTactileSurfaces:false,supportsMechanisms:false,supportsDualMaterial:false,supportsPartSplitting:true},
  validateParameters:p=>({valid:!!p,errors:[],parameters:p}),generatePreview:()=>adapter.capture(),
  generateManufacturingGeometry:()=>adapter.capture(),estimateBounds:()=>adapter.bounds(),migrateParameters:(_,p)=>p};
 const registry=makeCatalogue(crystalAdapter),cache=new Map(),histories=new Map(),prepared=new Map(),workers=new Map();
 let currentId=null,mode='model',stage='design',switching=false,saveTimer=null,dirty=false,search='',filter='all',studioVault=null,vaultClient=null,previewBuilds=0;
 const link=document.createElement('link');link.rel='stylesheet';link.href='./sensory-studio.css';document.head.append(link);
 const bar=document.createElement('nav');bar.className='studio-modelbar';bar.setAttribute('aria-label','Project and model workspaces');
 bar.innerHTML='<input id="smsProjectTitle" class="sms-project-input project-title" aria-label="Project name"><button id="smsLibrary">Library</button><div id="smsTabs" class="studio-modeltabs" role="tablist" aria-label="Open models"></div><button id="smsNew" aria-label="Add a model">＋ New model</button><button id="smsPrint">Print Centre</button><button id="smsReload" title="Save your project and load the latest published Studio">↻ Reload Studio</button><span id="smsSaveState" role="status"></span>';
 document.querySelector('.topbar').before(bar);
 const panel=document.createElement('div');panel.id='smsEditor';panel.className='sms-controls';panel.hidden=true;document.querySelector('.left').prepend(panel);
 const overlay=document.createElement('div');overlay.className='sms-overlay';overlay.hidden=true;overlay.id='smsOverlay';document.querySelector('.viewarea').style.position='relative';document.querySelector('.viewarea').append(overlay);
 const shell=unified?setupShell():null;
 function setupShell(){
  document.body.classList.add('sms-unified');
  const layout=document.querySelector('.layout'),left=layout.querySelector('.left'),right=layout.querySelector('.right'),viewer=layout.querySelector('.viewarea');
  const rail=document.createElement('aside');rail.className='sms-rail';rail.setAttribute('aria-label','Models');
  rail.append($('smsTabs'),$('smsNew'));
  const centre=document.createElement('section');centre.className='sms-centre';
  const palette=document.createElement('section');palette.className='sms-palette';palette.setAttribute('aria-label','Visual choices');
  const split=document.createElement('input');split.type='range';split.min=35;split.max=78;split.value=56;
  split.className='sms-split';split.setAttribute('aria-label','3D viewport height');
  try{split.value=localStorage.getItem('wt-viewport-height')||56;}catch{}
  const resize=()=>centre.style.setProperty('--sms-view-height',split.value+'%');
  split.oninput=resize;split.onchange=()=>{try{localStorage.setItem('wt-viewport-height',split.value);}catch{}};
  resize();centre.append(viewer,split,palette,overlay);
  const settings=document.createElement('aside');settings.className='sms-settings';settings.setAttribute('aria-label','Precision settings');
  const search=document.createElement('input');search.type='search';search.placeholder='Search settings';search.setAttribute('aria-label','Search settings');
  const searchSettings=()=>{
   const query=search.value.trim().toLowerCase();
   for(const item of settings.querySelectorAll('.sms-panel-details,.collapsible-section')){
    item.toggleAttribute('data-filtered',!!query&&!item.textContent.toLowerCase().includes(query));
    if(query&&!item.hasAttribute('data-filtered')&&item.tagName==='DETAILS')item.open=true;
   }
  };
  search.oninput=searchSettings;settings.append(search,left,right);
  layout.prepend(rail,centre,settings);
  const button=(label,action,id)=>{const node=document.createElement('button');node.type='button';node.textContent=label;if(id)node.id=id;node.onclick=action;return node;};
  const home=button('⌂ Home',()=>showHome(),'smsHome');
  const undoButton=button('↶ Undo',()=>shellUndo(-1),'smsGlobalUndo');
  const redoButton=button('↷ Redo',()=>shellUndo(1),'smsGlobalRedo');
  const styleNav=document.querySelector('.workspace-tabs');
  styleNav.prepend(home,$('smsLibrary'));bar.append(undoButton,redoButton);
  $('smsPrint').hidden=true;$('smsPrint').classList.add('sms-replaced-print');
  const focus=button('Focus 3D',()=>{
   const full=document.body.classList.toggle('sms-focused');focus.textContent=full?'Exit focus':'Focus 3D';focus.setAttribute('aria-pressed',String(full));
  },'smsFocus');
  focus.setAttribute('aria-pressed','false');viewer.querySelector('.vcolumn').append(focus);
  window.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('sms-focused'))focus.click();});
  return {palette,home,searchSettings,search,focus};
 }
 function shellUndo(delta){
  if(mode!=='model'||active()?.link)return;
  if(active()?.generator.typeId==='crystals')adapter.undo(delta);else undo(delta);
 }
 const picker=document.createElement('dialog');picker.id='smsPicker';picker.setAttribute('aria-labelledby','smsPickerTitle');
 picker.innerHTML='<h2 id="smsPickerTitle">Create a model</h2><div class="sms-grid"></div><form method="dialog"><button>Close</button></form>';
 document.body.append(picker);
 const presetThumbnails=new Map();
 function openPicker(){renderPicker();picker.showModal();}
 function visualPresets(family){
  if(family.typeId!=='gears')return family.presets;
  return [...family.presets].sort((a,b)=>Number(b.parameters.webStyle!=='Legacy')-Number(a.parameters.webStyle!=='Legacy'));
 }
 function renderPicker(generator=null){
  const title=picker.querySelector('h2'),grid=picker.querySelector('.sms-grid');
  title.textContent=generator?generator.displayName+' starting points':'Create a model';
  grid.replaceChildren();
  const appendCard=(family,preset)=>{
   const tile=document.createElement('article');tile.className='sms-tile sms-picker-tile';tile.dataset.modelTheme=family.typeId;
   const button=document.createElement('button');button.className='sms-picker-choice';button.type='button';
   if(preset)button.dataset.preset=preset.id;else button.dataset.generator=family.typeId;
   const label=document.createElement('span');label.textContent=preset?.name||family.displayName;
   const key=family.typeId+':'+(preset?.id||'default');
   if(!presetThumbnails.has(key)){
    let preview=null;
    if(family.typeId==='crystals'){
     const cluster=project.models.find(model=>model.generator.typeId==='crystals');
     preview=cluster?.thumbnail||(active()?.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null);
    }else preview=recipeThumbnail(family,preset?.parameters||family.defaultParameters);
    if(preview)presetThumbnails.set(key,preview);
   }
   button.append(modelPicture(presetThumbnails.get(key)),label);
   button.onclick=()=>{picker.close();add(family.typeId,preset?.parameters,preset?.name);};
   tile.append(button);
   if(!preset&&family.presets.length){
    const variants=document.createElement('button');variants.type='button';variants.textContent='Browse '+family.presets.length+' starting points';
    variants.setAttribute('aria-label','Browse '+family.displayName+' starting points');
    variants.onclick=()=>{renderPicker(family);grid.querySelector('button')?.focus();};
    tile.append(variants);
   }
   grid.append(tile);
  };
  if(generator){
   const back=document.createElement('button');back.type='button';back.className='sms-picker-back';back.textContent='← All model types';
   back.onclick=()=>{renderPicker();grid.querySelector('[data-generator="'+generator.typeId+'"]')?.focus();};
   grid.append(back);
   for(const preset of visualPresets(generator))appendCard(generator,preset);
  }else{
   for(const family of registry.list())appendCard(family,null);
  }
 }
 const snapshot=adapter.capture();
 if(!project.models.length)addModel(project,createModel({name:snapshot.settings.title||'Crystal Mine',typeId:'crystals',parameters:snapshot.settings,editableState:{crystals:snapshot.crystals,selectedId:snapshot.selectedId}}));
 if(!project.tabs.length)openTab(project,project.models[0].id);
 $('smsProjectTitle').value=project.title;
 $('smsProjectTitle').onchange=()=>{project.title=$('smsProjectTitle').value.trim()||'Untitled project';save();};
 $('smsReload').onclick=()=>{
  try{
   saveImmediately();
  }catch(error){
   $('smsSaveState').textContent='Reload paused — download a backup';
   adapter.status('Your work is still open. '+error.message);
   return;
  }
  const url=new URL(window.location.href);
  url.searchParams.set('reload',String(Date.now()));
  window.location.replace(url.href);
 };
 const release=document.querySelector('meta[name="studio-release"]')?.content;
 if(release)$('smsReload').title+=' · Build '+release.slice(0,7);
 $('smsLibrary').onclick=()=>showLibrary();$('smsPrint').onclick=()=>showPrint();$('smsNew').onclick=openPicker;
 const editors=installExactValueEditors();
 function active(){return currentId?findModel(project,currentId):null;}
 function captureCrystal(){
  if(switching||active()?.generator.typeId!=='crystals')return;
  const v=adapter.capture(),model=active();
  if(model.link){adapter.status('This is a pinned library model. Create an independent variant before editing.');return;}
  editModel(project,model.id,{parameters:v.settings,editableState:{crystals:v.crystals,selectedId:v.selectedId}});
  save();renderTabs();
 }
 function save(){
  dirty=true;$('smsSaveState').textContent='Saving…';clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
   try{validateProject(project);localStorage.setItem(WORKSPACE_KEY,JSON.stringify(state));dirty=false;$('smsSaveState').textContent='Saved locally';}
   catch(error){$('smsSaveState').textContent='Save failed — download a backup';adapter.status('Your work is still in memory. '+error.message);}
  },120);
 }
 function saveImmediately(){clearTimeout(saveTimer);validateProject(project);localStorage.setItem(WORKSPACE_KEY,JSON.stringify(state));dirty=false;}
 window.addEventListener('beforeunload',event=>{try{if(dirty)saveImmediately();}catch{event.preventDefault();event.returnValue='';}});
 function remember(){
  if(!currentId)return;const model=active();
  if(model.generator.typeId==='crystals'){
   captureCrystal();cache.set(currentId,{...adapter.detach(),kind:'crystals',fingerprint:modelFingerprint(model)});
  }else{
   const c=cache.get(currentId);if(c?.group)c.group.removeFromParent();if(c)c.view={camera:camera.position.toArray(),target:orbit.target.toArray()};
  }
 }
 function switchModel(id){
  if(id===currentId&&mode==='model'){renderEditor();return;}
  editors.cancel();remember();switching=true;
  try{
   const model=findModel(project,id);currentId=id;openTab(project,id);mode='model';overlay.hidden=true;
   document.body.classList.toggle('sms-generic-mode',model.generator.typeId!=='crystals');
   document.body.classList.toggle('sms-sidebar-mode',model.generator.typeId!=='crystals');
   panel.hidden=model.generator.typeId==='crystals';
   if(model.generator.typeId==='crystals'){
    adapter.activate(model,cache.get(id)?.fingerprint===modelFingerprint(model)?cache.get(id):null);
   }else showGeneric(model);
   renderTabs();renderEditor();save();
   if($('smsIndependentCrystal'))setCrystalReadonly(model.generator.typeId==='crystals'&&!!model.link);
  }catch(error){panel.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.innerHTML='<p class="sms-error">'+esc(error.message)+'</p><p>The document is preserved. Export a backup before recovery.</p>';}
  finally{switching=false;}
 }
 function showGeneric(model){
  const generator=registry.get(model.generator.typeId),fingerprint=modelFingerprint(model);let c=cache.get(model.id);
  if(!c?.group||c.fingerprint!==fingerprint){
   if(c?.group&&c.group.parent)c.view={camera:camera.position.toArray(),target:orbit.target.toArray()};
   if(c?.group)disposeGroup(c.group);
   const recipe=applyBuildModules(generator.recipe(model.parameters),model.build,generator.capabilities);
   const group=previewRecipe(THREE,recipe,[model.materials.primary?.colour||0x88bbff,model.materials.secondary?.colour||0xffcf70]);previewBuilds++;c={kind:'generic',group,fingerprint,view:c?.view};cache.set(model.id,c);
   model.thumbnail=thumbnail(group);
  }
  scene.add(c.group);
  if(c.view){camera.position.fromArray(c.view.camera);orbit.target.fromArray(c.view.target);camera.lookAt(orbit.target);}
  else frame(c.group);
  adapter.status('Ready — '+generator.displayName+'. Preview is editable geometry; prepare the print job before exporting.');
 }
 function frame(group){
  const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),centre=box.getCenter(new THREE.Vector3());
  orbit.target.copy(centre);const distance=Math.max(size.length()*1.5,70);camera.position.copy(centre).add(new THREE.Vector3(1,.9,1).normalize().multiplyScalar(distance));camera.lookAt(centre);orbit.update();
 }
 let thumbRenderer=null;
 function thumbnail(group){
  try{
   thumbRenderer??=new THREE.WebGLRenderer({antialias:true,alpha:false});thumbRenderer.setSize(200,150);thumbRenderer.setPixelRatio(1);
   const thumbScene=new THREE.Scene();thumbScene.background=new THREE.Color(0xeaf0f7);thumbScene.add(new THREE.AmbientLight(0xffffff,2));
   const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(80,140,100);thumbScene.add(light);
   const clone=group.clone(true);thumbScene.add(clone);const box=new THREE.Box3().setFromObject(clone);if(box.isEmpty())return null;
   const centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());const view=new THREE.PerspectiveCamera(38,4/3,.1,5000);
   view.position.copy(centre).addScaledVector(new THREE.Vector3(1,1.3,1).normalize(),Math.max(40,size.length()*1.9));view.lookAt(centre);thumbRenderer.render(thumbScene,view);
   return thumbRenderer.domElement.toDataURL('image/png');
  }catch{return null;}
 }
 function recipeThumbnail(generator,parameters,build={},colours){
  let group;
  try{
   group=previewRecipe(THREE,applyBuildModules(generator.recipe(parameters),build,generator.capabilities),colours);
   return thumbnail(group);
  }catch{return null;}
  finally{if(group)disposeGroup(group);}
 }
 function modelPicture(src){
  if(typeof src==='string'&&/^data:image\/(png|jpeg|webp);base64,/.test(src)){
   const img=document.createElement('img');img.alt='';img.src=src;img.loading='lazy';img.decoding='async';return img;
  }
  const placeholder=document.createElement('span');placeholder.className='sms-picture-empty';placeholder.textContent='Preview unavailable';return placeholder;
 }
 function renderTabs(){
  if(shell){$('smsGlobalUndo').disabled=mode!=='model'||!!active()?.link;$('smsGlobalRedo').disabled=$('smsGlobalUndo').disabled;document.body.dataset.studioView=mode;shell.home.toggleAttribute('aria-current',mode==='home');$('smsLibrary').toggleAttribute('aria-current',mode==='library');if(mode!=='model'&&document.body.classList.contains('sms-focused'))shell.focus.click();}
  const type=mode==='model'?active()?.generator.typeId:null;
  document.body.dataset.modelTheme=type||'workspace';
  document.body.classList.add('sms-workspace');
  for(const button of document.querySelectorAll('.topbar [data-tab]')){
   const step=button.dataset.tab;
   button.textContent={design:'1 · Design',build:'2 · Build',print:'3 · Print Centre'}[step];
   const selected=mode==='print'?step==='print':mode==='model'&&step===(type==='crystals'?document.querySelector('.topbar [data-tab].active')?.dataset.tab:stage);
   if(selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  }
  const root=$('smsTabs');root.replaceChildren();
  for(const id of project.tabs){const model=findModel(project,id),button=document.createElement('button');button.role='tab';button.dataset.modelTheme=model.generator.typeId;button.id='model-tab-'+id;button.setAttribute('aria-selected',String(currentId===id&&mode==='model'));button.tabIndex=currentId===id?0:-1;
   button.textContent=model.name+(project.printJobs.some(j=>j.modelId===id&&j.status==='preparing')?' ⏳':'');button.draggable=true;
   if(shell)button.prepend(modelPicture(model.thumbnail||(model.id===currentId&&model.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null)));
   const close=document.createElement('span');close.textContent='×';close.className='close-tab';close.setAttribute('aria-hidden','true');button.append(close);
   button.onclick=e=>{if(e.target===close){closeModel(id);return;}switchModel(id);};
   button.title='Double-click to rename. Drag or use Alt+Up/Down to reorder. Delete closes the tab.';
   button.ondblclick=()=>{const name=prompt('Model name',model.name);if(name?.trim()){if(model.link){adapter.status('Make an independent variant before renaming a linked model.');return;}editModel(project,id,{name:name.trim()});renderTabs();save();}};
   button.onkeydown=e=>{const i=project.tabs.indexOf(id);if(shell&&e.altKey&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const to=Math.max(0,Math.min(project.tabs.length-1,i+(e.key==='ArrowUp'?-1:1)));const ids=[...project.tabs];ids.splice(i,1);ids.splice(to,0,id);reorderTabs(project,ids);renderTabs();save();$('model-tab-'+id)?.focus();return;}if(e.key==='Delete'){e.preventDefault();closeModel(id);}if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?project.tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+project.tabs.length)%project.tabs.length;switchModel(project.tabs[target]);$('model-tab-'+project.tabs[target])?.focus();}};
   button.ondragstart=e=>e.dataTransfer.setData('text/plain',id);button.ondragover=e=>e.preventDefault();button.ondrop=e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain');if(!project.tabs.includes(from))return;const ids=project.tabs.filter(x=>x!==from);ids.splice(ids.indexOf(id),0,from);reorderTabs(project,ids);renderTabs();save();};root.append(button);
  }
 }
 function closeModel(id){
  if(currentId===id){remember();currentId=null;}
  closeTab(project,id);const c=cache.get(id);
  if(c?.group)disposeGroup(c.group);else if(c)adapter.release(c);cache.delete(id);
  if(project.activeTab)switchModel(project.activeTab);else showLibrary();save();
 }
 function add(typeId,parameters=null,name=null){
  const g=registry.get(typeId),p={...g.defaultParameters,...parameters};
  const editableState=typeId==='crystals'?adapter.createCrystals(p):{};
  const model=createModel({name:name||g.displayName,typeId,parameters:p,editableState});addModel(project,model);switchModel(model.id);return model;
 }
 function control(schema,p){
  const key=esc(schema.key),label=esc(schema.label||schema.key),value=p[schema.key];
  if(schema.type==='select')return '<label>'+label+'<select data-model-param="'+key+'">'+schema.options.map(o=>'<option '+(o===value?'selected':'')+'>'+esc(o)+'</option>').join('')+'</select></label>';
  if(schema.type==='boolean')return '<label><input type="checkbox" data-model-param="'+key+'" '+(value?'checked':'')+'> '+label+'</label>';
  return '<div class="sms-model-control"><label>'+label+'<output data-value-for="'+key+'">'+esc(value)+' '+esc(schema.unit||'')+'</output></label><input type="range" data-model-param="'+key+'" min="'+schema.min+'" max="'+schema.max+'" step="'+(schema.step||.1)+'" value="'+value+'"></div>';
 }
 function details(title,descriptor,html){return '<details class="sms-panel-details"><summary>'+esc(title)+'<small>'+esc(descriptor)+'</small></summary><div>'+html+'</div></details>';}
 function designSections(generator,model){
  const groups=[
   ['Form and silhouette','Choose the outline, teeth or surface pattern.',/mode|outline|pattern|character|top|symbol|style/i],
   ['Size and proportions','Set the overall size and depth.',/^(?!grip|socket).*?(width|height|depth|thickness|diameter|head|legs)/i],
   ['Edges and surface feel','Change the relief, curves and edge profile.',/corner|relief|density|variation|amplitude|frequency|orientation|phase|facets|direction|round|tooth|grip|leverAngle/i],
   ['Holes and fittings','Make space for shafts, spokes or other hardware.',/shaft|bore|hub|spokes|socket|tolerance|opening|cable|hole/i],
   ['Light and materials','Choose material regions and lighting options.',/dualMaterial|illuminated|wall|inlay/i]
  ];
  const family=generator.parameterSchema.find(field=>field.key==='controlStyle');
  const style=model.parameters.controlStyle||'Pushbutton';
  const familyFields={
   outline:['Pushbutton'],top:['Pushbutton'],
   symbol:['Pushbutton','Rotary knob','Rotary selector'],
   cornerRound:style==='Pushbutton'&&model.parameters.outline==='Square'?['Pushbutton']:[],
   gripProfile:['Rotary knob','Rotary selector'],gripCount:['Rotary knob','Rotary selector'],gripDepth:['Rotary knob','Rotary selector'],
   leverAngle:['Toggle lever','Rocker'],
   socketProfile:['Rotary knob','Rotary selector','Toggle lever','Rocker','Fader cap','Thumb joystick','Directional pad','Indicator lens']
  };
  const remaining=new Set(generator.parameterSchema.filter(field=>field!==family&&(!family||!familyFields[field.key]||familyFields[field.key].includes(style))));
  const output=groups.map(([title,description,pattern])=>{
   const controls=[...remaining].filter(field=>pattern.test(field.key));
   controls.forEach(field=>remaining.delete(field));
   return controls.length?details(title,description,controls.map(field=>control(field,model.parameters)).join('')):'';
  });
  if(remaining.size)output.push(details('Fine adjustments','Adjust the seed or other generator settings.',[...remaining].map(field=>control(field,model.parameters)).join('')));
  return (family?control(family,model.parameters):'')+output.join('');
 }
 const selectedParts=new Map();
 const partRay=new THREE.Raycaster();
 const pointer=new THREE.Vector2();
 let partPress=null;
 renderer.domElement.addEventListener('pointerdown',event=>{
  partPress=event.button===0?[event.clientX,event.clientY]:null;
 });
 renderer.domElement.addEventListener('pointerup',event=>{
  const start=partPress;
  partPress=null;
  const model=active();
  if(!start||Math.hypot(event.clientX-start[0],event.clientY-start[1])>4||mode!=='model'||stage!=='design'||!model||model.generator.typeId==='crystals')return;
  const group=cache.get(model.id)?.group;
  if(!group||!$('smsPartSelect'))return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  partRay.setFromCamera(pointer,camera);
  const hit=partRay.intersectObjects(group.children,false).find(intersection=>intersection.object.userData.partId);
  if(hit){
   panel.querySelector('#smsPartEditor').open=true;
   selectRecipePart(model,hit.object.userData.partId);
  }
 });
 function partEditor(model){
  const meshes=(cache.get(model.id)?.group?.children||[]).filter(mesh=>mesh.userData.partId);
  if(!meshes.length)return '';
  const options=meshes.map(mesh=>{
   const id=mesh.userData.partId;
   const [,index,shape]=id.split('-');
   const role=mesh.userData.materialRole==='primary'?'Body':'Detail';
   return '<option value="'+id+'">'+role+' '+(Number(index)+1)+' · '+shape+'</option>';
  });
  const axes=[['X','Left / right'],['Y','Lift'],['Z','Front / back']];
  return '<details class="sms-panel-details" id="smsPartEditor"><summary>Individual parts<small>Pick a part in the preview or choose it here.</small></summary><div>'+
   '<label>Part<select id="smsPartSelect"><option value="">Choose a part</option>'+options.join('')+'</select></label>'+
   '<fieldset id="smsPartOffsets"><legend>Offset from generated position (mm)</legend>'+
   axes.map(([axis,label],index)=>'<label>'+label+' ('+axis+')<input type="number" data-part-axis="'+index+'" min="'+(index===1?0:-50)+'" max="50" step=".1" value="0"></label>').join('')+
   '<button id="smsPartApply" type="button">Apply offset</button><button id="smsPartReset" type="button">Reset offset</button></fieldset></div></details>';
 }
 function selectRecipePart(model,id){
  const selector=$('smsPartSelect');
  if(!selector)return;
  selector.value=id;
  id=selector.value;
  selectedParts.set(model.id,id);
  const offset=model.build.partOffsets?.[id]||[0,0,0];
  $('smsPartOffsets').disabled=!id||!!model.link;
  panel.querySelectorAll('[data-part-axis]').forEach(input=>{input.value=offset[Number(input.dataset.partAxis)];});
  for(const mesh of cache.get(model.id)?.group?.children||[]){
   mesh.material.emissive?.setHex(id&&mesh.userData.partId===id?0x116047:0);
  }
 }
 function bindPartEditor(model){
  const selector=$('smsPartSelect');
  if(!selector)return;
  selectRecipePart(model,selectedParts.get(model.id)||'');
  selector.onchange=()=>selectRecipePart(model,selector.value);
  function apply(offset){
   const id=selector.value;
   if(!id)return;
   const partOffsets={...model.build.partOffsets};
   if(offset.some(Boolean))partOffsets[id]=offset;
   else delete partOffsets[id];
   commit({build:{...model.build,partOffsets}});
   selectRecipePart(model,id);
  }
  $('smsPartApply').onclick=()=>{
   const fields=[...panel.querySelectorAll('[data-part-axis]')];
   if(fields.every(input=>input.reportValidity()&&Number.isFinite(input.valueAsNumber)))apply(fields.map(input=>input.valueAsNumber));
  };
  $('smsPartReset').onclick=()=>apply([0,0,0]);
 }
 function showHome(){
  captureCrystal();mode='home';overlay.hidden=false;panel.hidden=true;renderTabs();
  overlay.innerHTML='<h1>Wonder Trunks Studio</h1><div class="sms-actions"><button id="smsHomeNew">New model</button><button id="smsHomeLibrary">Open Library</button><button id="smsHomeProject">Name current project</button></div><label>Find recent work <input type="search" id="smsHomeSearch"></label><h2>Recent models and saved projects</h2><div id="smsHomeModels" class="sms-grid"></div>';
  $('smsHomeNew').onclick=openPicker;$('smsHomeLibrary').onclick=showLibrary;
  $('smsHomeProject').onclick=()=>{$('smsProjectTitle').focus();$('smsProjectTitle').select();};
  const render=()=>{
   const query=$('smsHomeSearch').value.toLowerCase().trim(),root=$('smsHomeModels');root.replaceChildren();
   for(const model of [...project.models].reverse()){
    const family=registry.get(model.generator.typeId).displayName;
    if(![model.name,family].some(value=>value.toLowerCase().includes(query)))continue;
    const item=document.createElement('button');item.className='sms-tile';item.append(modelPicture(model.thumbnail||(model.id===currentId&&model.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null)),model.name);item.onclick=()=>switchModel(model.id);root.append(item);
   }
   for(const saved of state.savedProjects.filter(item=>item.title.toLowerCase().includes(query))){
    const item=document.createElement('button');item.textContent='Open project: '+saved.title;item.onclick=()=>{if(!confirm('Open this project and save a copy of the current project?'))return;remember();state.savedProjects.push(copy(project));replaceProject(saved);};root.append(item);
   }
   if(!root.children.length)root.textContent='No matching work. Clear search or create a model.';
  };
  $('smsHomeSearch').oninput=render;render();
 }
 function renderPalette(){
  if(!shell||mode!=='model')return;
  const model=active(),family=registry.get(model.generator.typeId);
  const build=model.generator.typeId==='crystals'?document.querySelector('.topbar [data-tab=build]').classList.contains('active'):stage==='build';
  const root=shell.palette;root.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=build?'Build tools':'Design choices';root.append(heading);
  const controls=document.createElement('div');controls.className='sms-context-controls';root.append(controls);
  if(!build&&family.presets.length){
   const cards=document.createElement('div');cards.className='sms-preset-strip';
   for(const preset of visualPresets(family)){
    const key=family.typeId+':'+preset.id;
    if(!presetThumbnails.has(key))presetThumbnails.set(key,recipeThumbnail(family,preset.parameters));
    const card=document.createElement('button');card.append(modelPicture(presetThumbnails.get(key)),preset.name);card.disabled=!!model.link;
    card.onclick=()=>{commit({parameters:copy(preset.parameters)});renderEditor();};cards.append(card);
   }
   const presets=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent='Illustrated starting points';presets.append(summary,cards);root.append(presets);
  }
  const addAction=(label,target)=>{
   if(!target)return;
   const button=document.createElement('button');button.type='button';button.textContent=label;button.disabled=target.disabled||!!model.link;
   button.onclick=()=>target.click();controls.append(button);
  };
  if(build){
   if(model.generator.typeId==='crystals'){
    addAction('Fit base for gumdrop',$('fitPixelBaseBtn'));
    addAction('Print a pixel fit test',$('calibrationBtn'));
   }else{
    const count=document.createElement('p');count.textContent=(model.build.pixelHoles?.length||0)+' pixel holes in this model';controls.append(count);
    addAction('Add pixel hole',$('smsPixelAdd'));
    addAction('Download pixel fit test',$('smsPixelCoupon'));
   }
  }else if(model.generator.typeId==='crystals'){
   for(const [key,label] of [['count','Crystal count'],['spacing','Crystal spacing'],['width','Cluster width']]){
    const original=document.querySelector('input[data-state="'+key+'"]');
    if(original)visualRange(controls,{key,label,min:original.min,max:original.max,step:original.step},original.value,value=>{
     original.value=value;original.dispatchEvent(new Event('input',{bubbles:true}));original.dispatchEvent(new Event('change',{bubbles:true}));
    },!!model.link);
   }
  }else{
   const keys=family.visualFields||{
    'tactile-tiles':['pattern','width','height','relief'],
    waves:['amplitude','frequency','width'],
    'control-caps':['diameter','height','gripDepth'],
    characters:['character','width','depth'],
    'light-pods':['width','height','facets']
   }[family.typeId]||[];
   const parameters={...family.defaultParameters,...model.parameters};
   const apply=(key,value)=>{
    const open=[...panel.querySelectorAll('details')].map(group=>group.open);
    if(!commit({parameters:{...model.parameters,[key]:value}}))return false;
    renderEditor();
    panel.querySelectorAll('details').forEach((group,index)=>{if(open[index])group.open=true;});
    shell.palette.querySelector('[data-palette-key="'+key+'"]')?.focus({preventScroll:true});
    return true;
   };
   for(const key of keys){
    const field=family.parameterSchema.find(item=>item.key===key);if(!field)continue;
    if(field.type==='number'){
     visualRange(controls,field,parameters[key],value=>apply(key,Number(value)),!!model.link);
    }else if(field.type==='select'){
     const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=field.label;group.append(legend);
     for(const option of field.options){
      const button=document.createElement('button');button.type='button';button.textContent=option;button.disabled=!!model.link;
      button.setAttribute('aria-pressed',String(parameters[key]===option));
      if(parameters[key]===option)button.dataset.paletteKey=key;
      button.onclick=()=>apply(key,option);group.append(button);
     }
     controls.append(group);
    }
   }
  }
  shell.searchSettings();
 }
 function visualRange(root,field,value,apply,disabled){
  const label=document.createElement('label'),caption=document.createElement('span'),out=document.createElement('output');
  caption.textContent=field.label;
  const input=document.createElement('input');input.type='range';input.dataset.paletteKey=field.key;
  for(const key of ['min','max','step'])input[key]=field[key]??.1;
  input.value=value;input.disabled=disabled;input.setAttribute('aria-label',field.label);
  const update=()=>{out.textContent=input.value+(field.unit?' '+field.unit:'');};
  input.oninput=update;
  input.onchange=()=>{if(apply(input.value)===false){input.value=value;update();}};
  update();label.append(caption,out,input);root.append(label);
 }
 function renderEditor(){
  if(mode!=='model'||!active())return;const model=active(),g=registry.get(model.generator.typeId);
  if(model.generator.typeId==='crystals'){panel.hidden=true;renderPalette();return;}
  panel.hidden=false;
  $('footerStats').textContent=g.displayName;
  const update=availableLinkedUpdate(model,state.library);
  panel.innerHTML='<h2>'+esc(g.displayName)+'</h2><label>Name<input id="smsModelName" value="'+esc(model.name)+'"></label>'+
   '<div class="sms-actions">'+(stage==='design'?'<button id="smsBuild" class="primary">Next → Build</button>':'<button id="smsDesign">← Design</button><button id="smsSend" class="primary">Next → Queue for print</button>')+'</div>'+
   (model.link?'<p class="sms-descriptor">Linked to library revision '+model.link.revision+'.</p><button id="smsBreak">Make an independent variant</button>'+(update?'<button id="smsAccept">Accept library revision '+update.revision+'</button>':''):'')+
   '<div class="sms-actions"><button id="smsUndo">Undo</button><button id="smsRedo">Redo</button><button id="smsDuplicate">Duplicate</button><button id="smsSaveModel">Save to Library</button></div>'+
   (stage==='design'?'<label>Starting point<select id="smsPreset"><option value="">Choose a preset…</option>'+g.presets.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select></label>'+designSections(g,model)+partEditor(model):
    (g.capabilities.supportsBase?details('Base and backing','Add a flat backing and set its thickness.','<label><input type="checkbox" data-build="base" '+(model.build.base?'checked':'')+'> Integrated flat base</label><label>Base thickness (mm)<input type="number" data-build="baseThickness" value="'+(model.build.baseThickness||3)+'" min="2" max="15"></label>'):'')+(g.capabilities.supportsMounting?details('Mounting holes','Choose plain or recessed fixing holes.','<label><input type="checkbox" data-build="mounting" '+(model.build.mounting?'checked':'')+'> Two mounting holes</label><label>Fixing profile<select data-build="mountStyle">'+['Through holes','Underside counterbores','Underside countersinks'].map(value=>'<option'+(model.build.mountStyle===value?' selected':'')+'>'+value+'</option>').join('')+'</select></label><label>Hole diameter (mm)<input type="number" data-build="holeDiameter" value="'+(model.build.holeDiameter||3.4)+'" min="2" max="8" step=".1"></label>'):'')+(g.capabilities.supportsLEDs?details('Lighting and cable access','Set the cavity and opening in Design.','<p>Use the Light and materials and Holes and fittings sections to size the cavity and cable exit.</p>'):'')+details('Pixel holes','Place and size holes to fit real pixels.',pixelBuilderMarkup(model,esc)))+
   '<div id="smsModelError" class="sms-descriptor" role="status"></div>';
  $('smsModelName').onchange=e=>commit({name:e.target.value.trim()||g.displayName});
  if($('smsDesign'))$('smsDesign').onclick=()=>{stage='design';renderTabs();renderEditor();};if($('smsBuild'))$('smsBuild').onclick=()=>{stage='build';renderTabs();renderEditor();};if($('smsSend'))$('smsSend').onclick=()=>send(model.id);
  $('smsDuplicate').onclick=()=>{const duplicate=duplicateModel(project,model.id);switchModel(duplicate.id);};$('smsSaveModel').onclick=()=>saveModel(model);
  $('smsUndo').onclick=()=>undo(-1);$('smsRedo').onclick=()=>undo(1);
  if($('smsBreak'))$('smsBreak').onclick=()=>{breakLink(project,model.id);renderEditor();save();};
  if($('smsAccept'))$('smsAccept').onclick=()=>{acceptLinkedUpdate(project,model.id,state.library,update.revision);showGeneric(model);renderEditor();save();};
  if($('smsPreset'))$('smsPreset').onchange=e=>{const preset=g.presets.find(p=>p.id===e.target.value);if(preset){commit({parameters:copy(preset.parameters)});renderEditor();}};
  panel.querySelectorAll('[data-model-param]').forEach(input=>input.oninput=()=>{
   const schema=g.parameterSchema.find(s=>s.key===input.dataset.modelParam),value=input.type==='checkbox'?input.checked:schema.type==='number'?Number(input.value):input.value;
   if(schema.key==='controlStyle'){
    const preset=g.presets.find(item=>item.parameters.controlStyle===value);
    if(preset)commit({parameters:{...preset.parameters,seed:model.parameters.seed,dualMaterial:model.parameters.dualMaterial}});
    renderEditor();
    return;
   }
   if(schema.key==='outline'&&g.typeId==='control-caps'){
    commit({parameters:{...model.parameters,outline:value}});
    renderEditor();
    return;
   }
   const output=panel.querySelector('[data-value-for="'+schema.key+'"]');if(output)output.textContent=value+' '+(schema.unit||'');commit({parameters:{...model.parameters,[schema.key]:value}});
  });
  const coupon=$('smsPixelCoupon');
  if(coupon)coupon.onclick=async()=>{
   coupon.disabled=true;
   try{
    const sizes=await adapter.pixelFitCoupon(model.build.pixelHoles?.[0]?.diameter??5);
    adapter.status('Pixel test STL downloaded. Engraved diameters: '+sizes.map(size=>size.toFixed(2)).join(', ')+' mm.');
   }catch(error){adapter.status('Pixel test STL failed: '+error.message);}
   finally{coupon.disabled=false;}
  };
  const pixelSection=$('smsPixelAdd')?.closest('details');
  if(pixelSection)bindPixelBuilder(panel,{
   holes:Array.isArray(model.build.pixelHoles)?model.build.pixelHoles:[],
   getBounds:()=>applyBuildModules(g.recipe(model.parameters),{...model.build,pixelHoles:[]},g.capabilities).bounds,
   onChange:pixelHoles=>commit({build:{...model.build,pixelHoles}}),
   onError:message=>{$('smsModelError').textContent=message;},
   reopen:()=>{renderEditor();$('smsPixelAdd').closest('details').open=true;}
  });
  panel.querySelectorAll('[data-build]').forEach(input=>input.onchange=()=>commit({build:{...model.build,[input.dataset.build]:input.type==='checkbox'?input.checked:input.tagName==='SELECT'?input.value:Number(input.value)}}));
  bindPartEditor(model);
  editors.refresh();renderPalette();
 }
 function commit(changes,{history=true}={}){
  const model=active();if(model.link){$('smsModelError').textContent='Make an independent variant before editing.';return;}
  const old=copy(model);try{
   const generator=registry.get(model.generator.typeId),candidate={...model,...changes};
   if(candidate.generator.typeId!=='crystals')applyBuildModules(generator.recipe(candidate.parameters),candidate.build,generator.capabilities);
   if(history){let h=histories.get(model.id);if(!h){h={items:[{parameters:old.parameters,build:old.build}],index:0};histories.set(model.id,h);}h.items.splice(h.index+1);h.items.push({parameters:copy(candidate.parameters),build:copy(candidate.build)});h.index=h.items.length-1;}
   editModel(project,model.id,changes);showGeneric(model);renderTabs();save();if($('smsModelError'))$('smsModelError').textContent='Updated. Prepare again before exporting.';
   return true;
  }catch(error){if($('smsModelError'))$('smsModelError').textContent=error.message;}
 }
 function undo(delta){const h=histories.get(currentId),next=(h?.index??0)+delta;if(!h||next<0||next>=h.items.length)return;h.index=next;commit(copy(h.items[next]),{history:false});renderEditor();}
 function saveModel(model){
  try{if(model.generator.typeId==='crystals'){captureCrystal();model.thumbnail=thumbnail(adapter.previewGroup());}
   const record=state.library.find(r=>r.id===model.id);saveLibraryRevision(state.library,model,{expectedRevision:record?.versions.at(-1)?.revision||0});save();adapter.status('Saved '+model.name+' to your reusable library.');
  }catch(error){adapter.status(error.message);}
 }
 function showLibrary(){captureCrystal();mode='library';overlay.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.hidden=false;
  panel.innerHTML='<h2>Library</h2><p class="sms-descriptor">Your models, starting points and complete projects.</p><label>Search<input id="smsSearch" value="'+esc(search)+'"></label><label>Model type<select id="smsFilter"><option value="all">All types</option>'+registry.list().map(g=>'<option value="'+g.typeId+'" '+(filter===g.typeId?'selected':'')+'>'+esc(g.displayName)+'</option>').join('')+'</select></label><button id="smsBrowseModels">Browse model starting points</button><button id="smsDemo">Open Wonder Trunks examples</button><button id="smsSaveProject">Save project to Library</button><button id="smsBackup">Download complete backup</button><label>Restore backup or old Crystal JSON<input id="smsImport" type="file" accept=".json"></label><p class="sms-descriptor">Connect your private GitHub repository in a Crystal model’s saved-project controls. Your token stays in memory.</p>';
  const syncActions=document.createElement('div');syncActions.className='sms-actions';syncActions.innerHTML='<button id="smsCloudPush">Upload studio backup</button><button id="smsCloudPull">Pull and reconcile studio backup</button><p id="smsSyncState" role="status">Local — no sync requested</p>';panel.append(syncActions);
  $('smsCloudPush').onclick=()=>syncStudio(false);$('smsCloudPull').onclick=()=>syncStudio(true);
  $('smsSearch').oninput=e=>{search=e.target.value;renderLibraryCards();};$('smsFilter').onchange=e=>{filter=e.target.value;renderLibraryCards();};
  $('smsBrowseModels').onclick=openPicker;$('smsDemo').onclick=demo;$('smsSaveProject').onclick=()=>{state.savedProjects.push(copy(project));save();renderLibraryCards();};$('smsBackup').onclick=backup;$('smsImport').onchange=importFile;
  renderTabs();renderLibraryCards();
 }
 function renderLibraryCards(){
  overlay.innerHTML='<h1>Your model library</h1><p>Closing a tab keeps its model here.</p><h2>In this project</h2><div id="smsProjectModels" class="sms-grid"></div><h2>Saved models</h2><div id="smsSavedModels" class="sms-grid"></div><h2>Saved projects</h2><div id="smsSavedProjects" class="sms-grid"></div>';
  const matches=m=>(filter==='all'||m.generator.typeId===filter)&&(!search||m.name.toLowerCase().includes(search.toLowerCase()));
  function card(model,root,libraryRecord=null){
   const tile=document.createElement('article');tile.className='sms-tile';
   const generator=registry.list().find(g=>g.typeId===model.generator.typeId);
   const src=model.thumbnail||(generator?.recipe?recipeThumbnail(generator,model.parameters,model.build,[model.materials?.primary?.colour||0x88bbff,model.materials?.secondary?.colour||0xffcf70]):null);
   tile.dataset.modelTheme=model.generator.typeId;
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p class="sms-descriptor">'+esc(generator?.displayName||model.generator.typeId)+' · revision '+(libraryRecord?.versions.at(-1).revision||model.revision)+'</p><div class="sms-actions"></div>';
   tile.prepend(modelPicture(src));
   const actions=tile.querySelector('.sms-actions');
   const action=(name,fn)=>{const b=document.createElement('button');b.textContent=name;b.onclick=fn;actions.append(b);};
   if(!libraryRecord){action('Open',()=>switchModel(model.id));action('Save to library',()=>saveModel(model));action('Duplicate',()=>{const m=duplicateModel(project,model.id);switchModel(m.id);});}
   else{
    action('Independent copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id);switchModel(m.id);});
    action('Linked copy',()=>{const m=insertLibraryModel(project,state.library,libraryRecord.id,{linked:true});switchModel(m.id);});
    if(libraryRecord.versions.length>1)action('Older revision',()=>{const versions=libraryRecord.versions;const chosen=prompt('Revision to open ('+versions.map(v=>v.revision).join(', ')+')',String(versions.at(-2).revision));if(chosen){const m=insertLibraryModel(project,state.library,libraryRecord.id,{revision:Number(chosen)});switchModel(m.id);}});
   }
   action('Export editable JSON',()=>adapter.download(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),model.generator.typeId+'-model.json'));
   root.append(tile);
  }
  project.models.filter(matches).forEach(m=>card(m,$('smsProjectModels')));
  state.library.filter(r=>matches(r.versions.at(-1).model)).forEach(r=>card(r.versions.at(-1).model,$('smsSavedModels'),r));
  for(const saved of state.savedProjects){const button=document.createElement('button');button.textContent=saved.title+' · '+saved.models.length+' models';button.onclick=()=>{if(!confirm('Open this saved project? Your current project will be kept as a saved copy.'))return;remember();state.savedProjects.push(copy(project));replaceProject(saved);};$('smsSavedProjects').append(button);}
 }
 async function syncStudio(pull){
  const label=$('smsSyncState');
  try{
   const client=adapter.vault();if(!client?.connected)throw Error('Connect a PRIVATE repository first using the saved-project controls in a Crystal model.');
   if(client!==vaultClient){vaultClient=client;studioVault=new StudioVault(client);}
   captureCrystal();saveImmediately();if(label)label.textContent=pull?'Checking and downloading…':'Uploading changed assets…';
   if(pull){
    const remote=await studioVault.pull();localStorage.setItem('sensory-model-studio-before-cloud-'+Date.now(),JSON.stringify(state));
    const sourceIds=new Map();
    for(const record of remote.library){const local=state.library.find(r=>r.id===record.id);
     if(local&&JSON.stringify(local)!==JSON.stringify(record)){const old=record.id;record.id=newId();sourceIds.set(old,record.id);for(const version of record.versions){version.model.id=record.id;version.model.name+=' (cloud copy)';}state.library.push(record);}
     else if(!local)state.library.push(record);
    }
    const all=[...state.savedProjects,project];
    for(const candidate of [remote.project,...remote.savedProjects]){
     for(const model of candidate.models)if(model.link&&sourceIds.has(model.link.sourceId))model.link.sourceId=sourceIds.get(model.link.sourceId);
     if(all.some(p=>JSON.stringify(p)===JSON.stringify(candidate)))continue;
     if(all.some(p=>p.id===candidate.id)){candidate.id=newId();candidate.title+=' (cloud copy)';}
     state.savedProjects.push(candidate);all.push(candidate);
    }
    saveImmediately();renderLibraryCards();if(label)label.textContent='Synced — local and cloud versions preserved. Open the cloud project copy from Saved projects.';
   }else{await studioVault.push(state);if(label)label.textContent='Synced — complete private backup saved.';}
  }catch(error){if(label)label.textContent='Sync paused / conflict: '+error.message;adapter.status(error.message);}
 }
 function send(id){captureCrystal();queueModel(project,id);save();showPrint();}
 function showPrint(){if(shell)printExpanded=false;captureCrystal();mode='print';overlay.hidden=false;document.body.classList.add('sms-sidebar-mode');panel.hidden=false;
  panel.innerHTML='<h2>Print Centre</h2><p class="sms-descriptor">One printer setup for every queued model.</p><label>Printer<select id="smsPrinter"><option>Ultimaker 3 Extended</option><option>Ultimaker 2+</option><option>Custom / other</option></select></label><label>Nozzle / AA core<select id="smsNozzle">'+[.25,.4,.6,.8].map(n=>'<option>'+n+'</option>').join('')+'</select></label><label>Material<select id="smsMaterial"><option>PLA</option><option>PETG</option></select></label><label>Quality<input id="smsQuality" type="number" min="0" max="100" value="'+project.printer.curaQuality+'"></label><p class="sms-descriptor">Dual material uses the UM3. Confirm both AA cores, materials, extruder assignments and layer support in Cura.</p><button id="smsCura">Download Cura settings</button><button id="smsPrepareAll">Prepare queued jobs</button><button id="smsPrintBackup">Save project and jobs</button><p id="smsPrintStatus" role="status"></p>';
  $('smsPrinter').value=project.printer.printer;$('smsNozzle').value=project.printer.curaNozzle;$('smsMaterial').value=project.printer.curaMaterial;
  for(const [id,key]of[['smsPrinter','printer'],['smsNozzle','curaNozzle'],['smsMaterial','curaMaterial'],['smsQuality','curaQuality']])$(id).onchange=e=>{project.printer[key]=['curaNozzle','curaQuality'].includes(key)?Number(e.target.value):e.target.value;for(const job of project.printJobs){if(workers.has(job.id)){workers.get(job.id).terminate();workers.delete(job.id);}job.status='stale';job.requestId=null;prepared.delete(job.id);}save();renderJobs();};
  $('smsCura').onclick=()=>{try{const p=createCuraProfile(curaOptions(project.printer));adapter.download(new Blob([p.bytes]),p.filename);}catch(error){$('smsPrintStatus').textContent=error.message;}};
  $('smsPrepareAll').onclick=()=>{for(const job of project.printJobs.filter(j=>j.status!=='prepared'&&j.status!=='preparing'))prepare(job.id);};$('smsPrintBackup').onclick=backup;
  renderTabs();renderJobs();
 }
 function curaOptions(p){return {machine:p.printer,nozzle:p.curaNozzle,material:p.curaMaterial,quality:p.curaQuality,intent:p.curaIntent||'balanced',qualityType:'auto'};}
 function renderJobs(){
  if(mode!=='print')return;overlay.innerHTML=(shell?'<h1>Quick Print</h1><div id="smsPrintCurrent" class="sms-tile"></div><div class="sms-actions"><button id="smsExpandPrint">'+(printExpanded?'Show current model only':'Add more models')+'</button></div><div id="smsPrintModels" class="sms-actions"></div>':'<h1>Print jobs</h1><p>Each job belongs to one model and revision. Editing a model makes its old job stale.</p>')+'<div id="smsJobs" class="sms-grid"></div>';
  if(shell){
   const model=active(),card=$('smsPrintCurrent');
   if(model){
    const name=document.createElement('strong');name.textContent=model.name;card.append(modelPicture(model.thumbnail||(model.generator.typeId==='crystals'?thumbnail(adapter.previewGroup()):null)),name);
    if(!project.printJobs.some(job=>job.modelId===model.id)){
     const start=document.createElement('button');start.textContent='Prepare current model';start.onclick=()=>{const job=queueModel(project,model.id);prepare(job.id);};card.append(start);
    }
   }
   $('smsExpandPrint').onclick=()=>{printExpanded=!printExpanded;renderJobs();};
   $('smsPrepareAll').hidden=!printExpanded;
   if(printExpanded)for(const item of project.models.filter(item=>!project.printJobs.some(job=>job.modelId===item.id))){
    const button=document.createElement('button');button.textContent='Add '+item.name;button.onclick=()=>{queueModel(project,item.id);save();renderJobs();};$('smsPrintModels').append(button);
   }
  }
  for(const job of project.printJobs){if(shell&&!printExpanded&&job.modelId!==currentId)continue;const model=findModel(project,job.modelId),tile=document.createElement('article');tile.className='sms-tile';const can=canExport(project,job.id)&&prepared.has(job.id);
   let dims='';const result=prepared.get(job.id);if(result){const all=result.bodies.flatMap(b=>Array.from(b.mesh.vertProperties||b.mesh.points));const stride=result.bodies[0].mesh.numProp||3;const size=[0,1,2].map(axis=>{let min=Infinity,max=-Infinity;for(let i=axis;i<all.length;i+=stride){min=Math.min(min,all[i]);max=Math.max(max,all[i]);}return max-min;});dims=size.map(n=>n.toFixed(1)).join(' × ')+' mm';const bed=project.printer.printer==='Ultimaker 2+'?[223,223,205]:[215,215,300];if(size.some((n,i)=>n>bed[[0,2,1][i]]))dims+=' — exceeds printer envelope';}
   tile.innerHTML='<h3>'+esc(model.name)+'</h3><p>'+esc(job.status)+' · source revision '+job.revision+'</p><p class="sms-descriptor">'+esc(dims)+'</p><div class="sms-actions"><button data-job-prepare>'+ (job.status==='preparing'?'Preparing…':'Prepare')+'</button><button data-job-cancel>Cancel</button><button data-job-export '+(!can?'disabled':'')+'>Download production ZIP</button><button data-job-3mf '+(!can?'disabled':'')+'>Download 3MF</button><button data-job-remove>Remove</button></div><p class="sms-descriptor">'+esc(job.error||job.progress||'Exports are locked until this revision is prepared.')+'</p>';
   tile.querySelector('[data-job-prepare]').disabled=job.status==='preparing';tile.querySelector('[data-job-prepare]').onclick=()=>prepare(job.id);
   tile.querySelector('[data-job-cancel]').onclick=()=>{workers.get(job.id)?.terminate();workers.delete(job.id);cancelPreparation(project,job.id);prepared.delete(job.id);save();renderJobs();};
   tile.querySelector('[data-job-remove]').onclick=()=>{workers.get(job.id)?.terminate();workers.delete(job.id);prepared.delete(job.id);project.printJobs=project.printJobs.filter(j=>j.id!==job.id);save();renderJobs();};
   tile.querySelector('[data-job-export]').onclick=()=>exportJob(job.id,false);tile.querySelector('[data-job-3mf]').onclick=()=>exportJob(job.id,true);$('smsJobs').append(tile);
  }
 }
 function prepare(id){
  if(workers.has(id))return;const ticket=beginPreparation(project,id);prepared.delete(id);const worker=new Worker(new URL('./studio-model-worker.js',import.meta.url),{type:'module'});workers.set(id,worker);
  const finish=()=>{worker.terminate();workers.delete(id);save();renderJobs();renderTabs();};
  worker.onmessage=({data})=>{const job=project.printJobs.find(j=>j.id===id);if(!job||job.requestId!==ticket.requestId){if(workers.get(id)===worker){worker.terminate();workers.delete(id);renderTabs();}return;}
   if(data.type==='progress'){job.progress=data.stage;renderJobs();return;}
   if(finishPreparation(project,ticket,{error:data.type==='error'?data.message:null})){if(data.type==='complete')prepared.set(id,data.prepared);}finish();
  };
  worker.onerror=e=>{finishPreparation(project,ticket,{error:e.message||'Worker failed.'});finish();};worker.postMessage({ticket});save();renderJobs();renderTabs();
 }
 function exportJob(id,only3MF){
  try{if(!canExport(project,id)||!prepared.has(id))throw Error('Prepare the current model revision first.');
   const job=project.printJobs.find(j=>j.id===id),model=findModel(project,job.modelId),result=prepared.get(id);
   if(result.bodies.length>1&&project.printer.printer!=='Ultimaker 3 Extended')throw Error('Choose the UM3 Extended for two materials, or turn off dual material and prepare again.');
   const exported=exportMaterialBodies(result,{name:model.name});
   if(only3MF){adapter.download(new Blob([exported.threeMF],{type:'model/3mf'}),exported.filename);return;}
   const entries=exported.stls.map(s=>[s.name,s.bytes]);entries.push([exported.filename,exported.threeMF],['editable-model.json',JSON.stringify(model,null,2)],['material-roles.json',JSON.stringify(exported.assignments,null,2)],['print-report.json',JSON.stringify(result.report,null,2)]);
   try{const profile=createCuraProfile(curaOptions({...project.printer,...model.printerOverrides,...job.overrides}));entries.push([profile.filename,profile.bytes],['cura-manual-settings.txt',profile.fallbackText]);}catch(error){entries.push(['cura-manual-review.txt',error.message]);}
   entries.push(['READ-ME.txt',exported.warnings.join('\n')+'\nThe STL files share one origin. Import them together as parts, not independently auto-arranged objects.']);
   adapter.download(new Blob([zipProfileEntries(entries)],{type:'application/zip'}),'sensory-model-production.zip');
  }catch(error){adapter.status(error.message);if($('smsPrintStatus'))$('smsPrintStatus').textContent=error.message;}
 }
 function backup(){captureCrystal();adapter.download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'wonder-trunks-studio-backup.json');}
 function replaceProject(saved){
  for(const worker of workers.values())worker.terminate();workers.clear();prepared.clear();
  for(const c of cache.values())if(c.group)disposeGroup(c.group);else adapter.release(c);cache.clear();
  currentId=null;Object.assign(project,copy(saved));for(const job of project.printJobs){job.status='stale';job.requestId=null;job.preparedRevision=null;}
  $('smsProjectTitle').value=project.title;switchModel(project.activeTab||project.models[0]?.id);save();
 }
 async function importFile(e){
  const file=e.target.files[0];if(!file)return;
  try{const data=JSON.parse(await file.text());
   if(data.schemaVersion===1&&data.project){validateProject(data.project);saveImmediately();localStorage.setItem('sensory-model-studio-before-import-'+Date.now(),JSON.stringify(state));state.savedProjects.push(copy(project));state.library.push(...(data.library||[]).filter(r=>!state.library.some(ours=>ours.id===r.id)));replaceProject(data.project);}
   else if(data.schemaVersion===1&&data.generator){addModel(project,data);switchModel(data.id);}
   else if(data.settings&&Array.isArray(data.crystals)){const model=createModel({name:data.settings.title||file.name,typeId:'crystals',parameters:data.settings,editableState:{crystals:data.crystals,selectedId:null}});addModel(project,model);switchModel(model.id);}
   else throw Error('This is not a supported studio backup or Crystal project.');
  }catch(error){adapter.status('Import failed. '+error.message);}
 }
 function demo(){
  const entries=[['tactile-tiles','Grass tile',{pattern:'grass'}],['characters','Goat silhouette',{character:'Goat'}],['tactile-tiles','Wool tile',{pattern:'wool'}],['waves','Thawmor river',{}],['tactile-tiles','River ripple tile',{pattern:'river'}],['light-pods','River light pod',{}],['crystals','McDigger crystal mine',null],['tactile-tiles','Mineral tile',{pattern:'mineral'}],['light-pods','Faceted pebble',{facets:12}],['gears','Weather cog',{}],['control-caps','Weather button',{}],['tactile-tiles','Raindrop tile',{pattern:'rain',dualMaterial:true}]];
  for(const [type,name,p] of entries)add(type,p,name);project.title='The Snowsmith — Wonder Trunks';$('smsProjectTitle').value=project.title;save();showLibrary();
 }
 document.addEventListener('click',e=>{
  const button=e.target.closest('[data-tab]');if(!button)return;
  queueMicrotask(()=>{renderTabs();if(active()?.generator.typeId==='crystals')renderPalette();});
  if(button.dataset.tab==='print'){e.preventDefault();e.stopImmediatePropagation();showPrint();}
  else if(active()?.generator.typeId!=='crystals'){e.preventDefault();e.stopImmediatePropagation();stage=button.dataset.tab;mode='model';overlay.hidden=true;renderTabs();renderEditor();}
  else if(mode!=='model'){mode='model';overlay.hidden=true;document.body.classList.remove('sms-sidebar-mode');panel.hidden=true;renderTabs();}
 },true);
 document.addEventListener('keydown',e=>{
  if(e.target.closest('input,textarea,select,[contenteditable]'))return;
  if(active()?.link&&['g','r','s','Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();adapter.status('Make an independent variant before editing this pinned model.');return;}
  if(active()?.generator.typeId!=='crystals'&&(e.ctrlKey||e.metaKey)&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();undo(e.key.toLowerCase()==='y'||e.shiftKey?1:-1);}
 },true);
 $('saveBtn').onclick=backup;
 // Preserve the established Crystal Open workflow; studio backups have their
 // own explicit import control in Library.
 const crystalTools=document.createElement('div');crystalTools.className='sms-actions';
 crystalTools.innerHTML='<button id="smsSaveCrystal">Save model to Library</button><button id="smsSendCrystal">Send model to Print Centre</button><button id="smsIndependentCrystal" hidden>Make independent to edit</button>';
 document.querySelector('.left').insertBefore(crystalTools,panel.nextSibling);
 $('smsSaveCrystal').onclick=()=>saveModel(active());$('smsSendCrystal').onclick=()=>send(currentId);
 $('smsIndependentCrystal').onclick=()=>{breakLink(project,currentId);setCrystalReadonly(false);save();};
 function setCrystalReadonly(enabled){
  for(const section of document.querySelectorAll('.left>[data-workspace],.right'))section.inert=enabled;
  $('smsIndependentCrystal').hidden=!enabled;
 }
 const initial=project.activeTab||project.tabs[0];currentId=initial;
 if(findModel(project,initial).generator.typeId==='crystals'){
  switching=true;adapter.activate(findModel(project,initial),null);switching=false;renderTabs();
 }else{currentId=null;adapter.detach();switchModel(initial);}
 for(const job of project.printJobs)if(['preparing','prepared'].includes(job.status)){job.status='stale';job.requestId=null;job.preparedRevision=null;}
 if(shell)showHome();
 save();
 window.__sensoryStudio={project,registry,get currentModel(){return active();},get mode(){return mode;},switchModel,addModel:add,showLibrary,showPrint,send,prepare,saveImmediately,get cacheSize(){return cache.size;},get metrics(){return {previewBuilds,geometries:renderer.info.memory.geometries,activeWorkers:workers.size};}};
 return {onCrystalChange:captureCrystal,backup};
}
