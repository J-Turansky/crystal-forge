import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {planHardware} from '../hardware-layout.js';
import {baseSurfaceHeight} from '../geometry-v3.js';

function bounds(points){
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(const point of points)for(let axis=0;axis<3;axis++){
  min[axis]=Math.min(min[axis],point[axis]);max[axis]=Math.max(max[axis],point[axis]);
 }
 assert(min.every(Number.isFinite)&&max.every(Number.isFinite));
 return {min,max,size:max.map((value,i)=>value-min[i])};
}
function stlPoints(bytes){
 const count=bytes.readUInt32LE(80);
 assert(count>0);
 assert.equal(bytes.length,84+50*count);
 return Array.from({length:count*3},(_,i)=>{
  const offset=96+Math.floor(i/3)*50+(i%3)*12;
  return [0,4,8].map(axis=>bytes.readFloatLE(offset+axis));
 });
}
function modelXml(bytes){
 for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
  const length=bytes.readUInt16LE(offset+26),start=offset+30+length+bytes.readUInt16LE(offset+28);
  const size=bytes.readUInt32LE(offset+18);
  if(bytes.toString('utf8',offset+30,offset+30+length)==='3D/3dmodel.model'){
   assert.equal(bytes.readUInt16LE(offset+8),0);
   return bytes.toString('utf8',start,start+size);
  }
  offset=start+size;
 }
 assert.fail('Missing 3MF model');
}

const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 await page.goto(process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321');
 await page.waitForFunction(()=>window.__sensoryStudio);
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,height:127,baseStyle:'Square',baseWidth:11,
  baseHeight:14,cutSockets:false,lightingMode:'none'
 },'WT021 asymmetric Crystal'));
 const model=()=>page.evaluate(()=>({id:window.__sensoryStudio.currentModel.id,revision:window.__sensoryStudio.currentModel.revision}));
 const readDimensions=async locator=>(await locator.innerText()).match(/\d+(?:\.\d+)?(?= (?:×|x|mm))/g).slice(0,3).map(Number);
 const dimensions=page.locator('#smsModelDimensions');
 await dimensions.filter({hasText:'Design preview'}).waitFor();
 const initial=await model(),design=await readDimensions(dimensions);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const build=await readDimensions(dimensions);
 assert.deepEqual(design,build);
 await page.getByRole('button',{name:'Render actual model',exact:true}).click();
 const inspector=page.locator('#smsLightInspector');
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 const prepared=await readDimensions(dimensions.filter({hasText:'Prepared'}));
 const revision=await model();
 assert.equal(revision.id,initial.id);
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const job=page.locator('#smsJobs article');
 assert.equal(await job.count(),1,await page.locator('#smsJobs').innerText());
 await job.getByText('Prepared',{exact:true}).waitFor({timeout:5000});
 const print=await readDimensions(job.getByText(/^Prepared X/));
 const download=async selector=>{
  const [file]=await Promise.all([page.waitForEvent('download'),job.locator(selector).click()]);
  return readFile(await file.path());
 };
 const stl=bounds(stlPoints(await download('[data-job-stl]')));
 const xml=modelXml(await download('[data-job-3mf]'));
 assert.match(xml,/<model unit="millimeter"/);
 assert.match(xml,/<item objectid="2" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
 const mf=bounds([...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(match=>match.slice(1).map(Number)));
 for(const key of ['min','max'])for(let axis=0;axis<3;axis++)assert(Math.abs(stl[key][axis]-mf[key][axis])<.001);
 const rounded=stl.size.map(value=>Number(value.toFixed(1)));
 assert.equal(new Set(rounded).size,3,'Fixture must distinguish every print axis');
 assert.deepEqual(design,rounded);
 assert.deepEqual(prepared,rounded);
 assert.deepEqual(print,rounded);
 assert.deepEqual(await model(),revision);
 console.log('WT-021 Crystal dimensional evidence:',JSON.stringify({initial,revision,design,build,prepared,print,stl,mf}));
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,baseHeight:35,baseWidth:18,cutSockets:true,lightingMode:'single',socketConical:true
 },'WT021 physical fitting'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const toggle=page.locator('.sms-palette').getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
 await toggle.check();
 const fit=page.locator('[data-build-fit-preview-status]');
 await fit.getByText(/insertion 22\.00 mm/).waitFor();
 assert.match(await fit.innerText(),/centre roof [\d.]+ mm/);
 assert.match(await fit.innerText(),/interfering with base/);
 await toggle.uncheck();
 assert.equal(await fit.innerText(),'');
 console.log('WT-021 Crystal physical fitting preview toggled in Build');
 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  seed:42,count:5,width:94,baseType:'integrated',baseStyle:'Square',baseHeight:24,baseWidth:32,baseDome:0,
  cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',manualPixelHoles:[],pixelProfileId:'seed',
  wireMode:'string',wireChannels:false,wireInputTailLength:150,wireOutputTailLength:150,pixelStringSpacing:100,wireWidth:3.2,
  tabCount:2,tabHolesPerTab:1,tabHoleDiameter:3.4,tabThickness:5,tabWall:3
 },'WT021 full Crystal'));
 const crystal=()=>page.evaluate(()=>window.__sensoryStudio.currentModel);
 const reveal=async locator=>{
  await locator.evaluate(element=>{for(let node=element.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;});
  return locator;
 };
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 const width=await reveal(page.locator('[data-state=width]'));
 await width.press('ArrowRight');
 assert((await crystal()).parameters.width>94);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const profile=await reveal(page.locator('#pixelProfileSelect'));
 await profile.selectOption('seed');
 await page.locator('[data-view=top]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await (await reveal(page.locator('#placePixelBtn'))).click();
 const sample=async (x,y)=>{
  await page.mouse.move(x,y);
  return page.evaluate(()=>window.__crystalForgePlacementMetrics());
 };
 const onBase=async(x,z)=>{
  const viewport=await page.locator('#viewport canvas').boundingBox();
  const {camera,target}=await page.evaluate(()=>window.__crystalForgeViewMetrics());
  const model=await crystal();
  const projection=new THREE.PerspectiveCamera(46,viewport.width/viewport.height,.1,5000);
  projection.position.fromArray(camera);
  projection.lookAt(new THREE.Vector3(...target));
  projection.updateMatrixWorld();
  const p=new THREE.Vector3(x,baseSurfaceHeight(model.editableState.crystals,model.parameters,x,z),z).project(projection);
  return {x:viewport.x+(p.x+1)*viewport.width/2,y:viewport.y+(1-p.y)*viewport.height/2};
 };
 for(const [i,x] of [-18,18].entries()){
  const location=await onBase(x,0);
  const cursor=await sample(location.x,location.y);
  assert(cursor.valid,JSON.stringify({location,cursor}));
  await page.mouse.click(location.x,location.y);
  await page.waitForFunction(count=>window.__sensoryStudio.currentModel.parameters.manualPixelHoles.length===count,i+1);
 }
 await page.keyboard.press('Escape');
 const prior=(await crystal()).parameters.manualPixelHoles;
 const p2=page.locator('.hardware-marker[data-hw-kind=pixel]').filter({hasText:'P2'});
 await p2.click();
 const marker=await p2.boundingBox();
 const destination=await onBase(32,0);
 await page.mouse.move(marker.x+marker.width/2,marker.y+marker.height/2);
 await page.mouse.down();
 await page.waitForTimeout(225);
 await page.mouse.move(destination.x,destination.y,{steps:6});
 await page.mouse.up();
 await page.waitForFunction(x=>window.__sensoryStudio.currentModel.parameters.manualPixelHoles[1].x>x+2,prior[1].x,{timeout:8000}).catch(async error=>{
  throw Error('Crystal drag did not commit: '+await page.locator('#status').innerText()+' '+JSON.stringify((await crystal()).parameters.manualPixelHoles),{cause:error});
 });
 const p2x=await reveal(page.locator('[data-hole-kind=pixel][data-hole-axis=x][data-hole-index="1"]'));
 const acceptedX=await p2x.inputValue();
 await p2x.fill('9999');await p2x.press('Tab');
 assert.equal(Number(await p2x.inputValue()),Number(acceptedX));
 await (await reveal(page.locator('[data-state=wireChannels]'))).check();
 await page.locator('#wireRouteStatus').getByText(/ready|fit/i).first().waitFor();
 await page.locator('#advancedBtn').click();
 await (await reveal(page.locator('[data-state=mount]'))).selectOption('Edge fixing tabs');
 await (await reveal(page.locator('#placeTabBtn'))).click();
 await page.keyboard.press('Escape');
 for(const [i,u] of [13,63].entries()){
  const tab=await reveal(page.locator('[data-tab-u="'+i+'"]'));
  await tab.fill(String(u));await tab.press('Tab');
 }
 assert.equal((await crystal()).parameters.manualEdgeTabs.length,2);
 await (await reveal(page.locator('#placeMountBtn'))).click();
 for(const [i,x] of [-14,14].entries()){
  const location=await onBase(x,-40);
  assert((await sample(location.x,location.y)).valid);
  await page.mouse.click(location.x,location.y);
  await page.waitForFunction(count=>window.__sensoryStudio.currentModel.parameters.manualMountHoles.length===count,i+1);
 }
 await page.keyboard.press('Escape');
 const mountZ=await reveal(page.locator('[data-hole-kind=mount][data-hole-axis=z][data-hole-index="1"]'));
 await mountZ.fill('-42');await mountZ.press('Tab');
 assert.equal((await crystal()).parameters.manualMountHoles[1].z,-42);
 const crystalCalibration=new Map([['pixelName','Crystal measured seed fit'],['pixelSocketClearance','.4']]);
 await (await reveal(page.locator('#editPixelProfileBtn'))).click();
 for(const [id,value] of crystalCalibration)await page.locator('#'+id).fill(value);
 await page.locator('#applyPixelSocketFit').click();
 const savedCrystal=await crystal();
 const hardware=planHardware(savedCrystal.editableState.crystals,savedCrystal.parameters);
 assert.equal(hardware.sockets.length,2);
 assert.equal(hardware.mounts.length,2);
 assert.equal(hardware.tabHoles.length,2);
 assert(hardware.wirePlan.ready,hardware.wirePlan.messages.join(' '));
 assert(hardware.sockets.some(socket=>Math.abs(socket.diameter-5.4)<.001));
 await page.locator('#smsProjectTitle').fill('WT-021 Crystal manufacturing journey');
 await page.locator('#smsProjectTitle').press('Tab');
 await page.locator('#smsLibrary').click();
 await page.locator('#smsSaveProject').click();
 await page.locator('#smsSavedProjects').getByRole('heading',{name:'WT-021 Crystal manufacturing journey',exact:true}).waitFor();
 const [backup]=await Promise.all([page.waitForEvent('download'),page.locator('#smsBackup').click()]);
 const backupModel=JSON.parse(await readFile(await backup.path(),'utf8')).project.models.find(model=>model.id===savedCrystal.id);
 assert.deepEqual(backupModel.parameters.manualPixelHoles,savedCrystal.parameters.manualPixelHoles);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(id=>window.__sensoryStudio?.currentModel?.id===id,savedCrystal.id);
 const restored=await crystal();
 for(const key of ['manualPixelHoles','manualMountHoles','manualEdgeTabs','pixelClearanceByProfile'])
  assert.deepEqual(restored.parameters[key],savedCrystal.parameters[key]);
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.getByRole('button',{name:'Render actual model',exact:true}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 await inspector.getByLabel('Cut section').check();
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const crystalJob=page.locator('#smsJobs article').filter({hasText:'WT021 full Crystal'});
 await crystalJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
 const getFile=async selector=>{
  const [file]=await Promise.all([page.waitForEvent('download'),crystalJob.locator(selector).click()]);
  return {name:file.suggestedFilename(),bytes:await readFile(await file.path())};
 };
 const crystalSTL=await getFile('[data-job-stl]'),crystal3MF=await getFile('[data-job-3mf]');
 const cura=await getFile('[data-job-cura]'),zip=await getFile('[data-job-export]');
 assert(cura.name.endsWith('.curaprofile')&&zip.name.endsWith('.zip'));
 const xml3MF=modelXml(crystal3MF.bytes);
 const points=[...xml3MF.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const indices=[...xml3MF.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap(match=>match.slice(1).map(Number));
 const indexed=new THREE.BufferGeometry();
 indexed.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 indexed.setIndex(indices);
 for(const [format,geometry] of [['STL',new STLLoader().parse(Uint8Array.from(crystalSTL.bytes).buffer)],['3MF',indexed]]){
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);
  const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
  const calibrated=hardware.sockets.find(socket=>Math.abs(socket.diameter-5.4)<.001);
  const bore=[calibrated.x,-calibrated.z,4];
  const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
  assert(left&&right&&Math.abs(left.distanceTo(right)-5.4)<.04,format+' calibrated Crystal bore');
  const route=[0,0,1];
  const startWall=hit(route,[0,-1,0]),endWall=hit(route,[0,1,0]);
  assert(startWall&&endWall&&Math.abs(startWall.distanceTo(endWall)-3.2)<.04,format+' routed width survives the fit change');
  for(const hole of [...hardware.mounts,...hardware.tabHoles])
   assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined,format+' Crystal through-holes are open');
  for(const hole of hardware.tabHoles){
   const tabTop=hit([hole.x+2.5,-hole.z,7],[0,0,-1]);
   assert(tabTop&&Math.abs(tabTop.z-5)<.01,format+' 5 mm positive Crystal tab stock');
  }
  material.dispose();geometry.dispose();
 }
 console.log('WT-021 full Crystal manufacturing journey verified');
 {
  const importedName='Crystal imported fit witness';
  await page.evaluate(name=>window.__sensoryStudio.addModel('crystals',{count:5,baseHeight:22,width:96,depth:82,
   cutSockets:true,pixelFit:.15,wireChannels:false,lightingMode:'single'},name),importedName);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const palette=page.locator('.sms-palette'),libraryInput=palette.getByLabel('Import pixel profiles');
  const profileId='custom-wt021-crystal-fit-import';
  const measured={id:profileId,name:'Imported Crystal 5 mm fit',kind:'seed',bodyDiameter:5,bodyHeight:9,
   flangeDiameter:5,flangeHeight:0,capHeight:1,wireWidth:2,wireDepth:1.5,
   measuredFit:{bodyDiameter:5,printedBoreDiameter:5.25}};
  const importProfile=async custom=>libraryInput.setInputFiles({name:'pixel-library.json',mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify({version:1,pixelProfiles:[custom]}))});
  await importProfile(measured);
  const selection=palette.getByLabel('Active Pixel Profile');
  await selection.getByRole('option',{name:measured.name,exact:true}).waitFor({state:'attached'});
  await selection.selectOption(profileId);
  await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelClearanceByProfile?.[id]===.25,profileId);
  const fit=await reveal(page.locator('[data-state=pixelFit]'));
  await fit.press('ArrowRight');
  await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelClearanceByProfile[id]===.3,profileId);
  await importProfile({...measured,measuredFit:{bodyDiameter:5,printedBoreDiameter:5.6}});
  const copy=selection.getByRole('option',{name:measured.name+' (imported copy)',exact:true});
  await copy.waitFor({state:'attached'});
  const revisedId=await copy.getAttribute('value');
  assert.notEqual(revisedId,profileId);
  const importJob=page.locator('#smsJobs article').filter({hasText:importedName});
  const measureImported=async(id,diameter)=>{
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await selection.selectOption(id);
   await page.waitForFunction(id=>window.__sensoryStudio.currentModel.parameters.pixelProfileId===id,id);
   const model=await crystal(),[socket]=planHardware(model.editableState.crystals,model.parameters).sockets;
   assert(socket&&Math.abs(socket.diameter-diameter)<.001);
   await page.locator('.sms-workspace-nav [data-tab=print]').click();
   if(await importJob.count())await importJob.locator('[data-job-prepare]').click();
   else await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
   await importJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   for(const format of ['stl','3mf']){
    const [file]=await Promise.all([page.waitForEvent('download'),importJob.locator('[data-job-'+format+']').click()]);
    const bytes=await readFile(await file.path());
    const geometry=new THREE.BufferGeometry();
    if(format==='stl')geometry.copy(new STLLoader().parse(Uint8Array.from(bytes).buffer));
    else{
     const xml=modelXml(bytes);
     const points=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     const indices=[...xml.matchAll(/<triangle v1="([^"]+)" v2="([^"]+)" v3="([^"]+)"/g)].flatMap(match=>match.slice(1).map(Number));
     geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
     geometry.setIndex(indices);
    }
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),mesh=new THREE.Mesh(geometry,material);
    const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
     new THREE.Vector3(socket.x,-socket.z,4),new THREE.Vector3(0,sign,0)).intersectObject(mesh)[0].distance,0);
    assert(Math.abs(width-diameter)<.04,format+' imported Crystal clearance '+width);
    geometry.dispose();material.dispose();
   }
  };
  await measureImported(revisedId,5.6);
  await measureImported(profileId,5.3);
  console.log('WT-021 Crystal imported measured default and local fit verified');
 }
}finally{await browser.close();}
