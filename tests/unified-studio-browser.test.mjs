import {WORKSPACE_KEY} from '../studio-documents.js';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
const browser=await chromium.launch({headless:true,executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
let page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
 if(process.env.CRYSTAL_FORGE_BASELINE_URL){
  const baseline=await browser.newPage({viewport:{width:1440,height:1000}});
  await baseline.goto(process.env.CRYSTAL_FORGE_BASELINE_URL);
  await baseline.waitForFunction(()=>window.__sensoryStudio);
  await baseline.locator('#smsHomeNew').click();
  await baseline.locator('#smsPicker [data-generator=gears]').click();
  await fs.mkdir('qa',{recursive:true});
  await baseline.screenshot({path:'qa/unified-palette-before.png'});
  await baseline.setViewportSize({width:390,height:844});
  await baseline.screenshot({path:'qa/unified-wt014-before-narrow.png'});
  await baseline.close();
 }
 {
 const inspectionPage=page;
 await inspectionPage.bringToFront();
 await fs.mkdir('qa',{recursive:true});
 await inspectionPage.goto(url);
 await inspectionPage.waitForFunction(()=>window.__sensoryStudio);
 await inspectionPage.evaluate(()=>window.__sensoryStudio.addModel('crystals',{
  count:5,cutSockets:true,baseVault:false,hollowCrystals:false,targetedLightPaths:true,lightReach:15,wireChannels:false,lightingMode:'single'
 },'Inspection fixture'));
 const inspector=inspectionPage.locator('#smsLightInspector');
 assert.equal(await inspector.count(),1,JSON.stringify(await inspectionPage.evaluate(()=>({mode:window.__sensoryStudio.mode,model:window.__sensoryStudio.currentModel?.name,precision:document.getElementById('smsPrecisionContent')?.innerText.slice(0,350),error:document.querySelector('#smsEditor .sms-error')?.textContent}))));
 await inspector.waitFor();
 await inspector.locator('summary').press('Enter');
 await inspector.getByText('Preview only').waitFor();
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 const inspectedRevision=await inspectionPage.evaluate(()=>window.__sensoryStudio.currentModel.revision);
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-x.png'});
 await inspector.getByLabel('Section axis').selectOption('Z');
 const section=inspector.getByRole('slider');
 const before=await section.inputValue();
 await section.press('ArrowRight');
 assert.notEqual(await section.inputValue(),before);
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-z.png'});
 const crystalResult=inspector.getByRole('button',{name:/^Inspect /}).first();
 await crystalResult.click();
 assert.equal(await crystalResult.getAttribute('aria-pressed'),'true');
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-selected.png'});
 const issue=inspector.getByRole('listitem').filter({hasText:/skipped|blocked|unknown/}).first();
 await issue.getByRole('button').click();
 await inspectionPage.screenshot({path:'qa/unified-wt013-crystal-obstruction.png'});
 await inspector.getByLabel('Show light paths').uncheck();
 await inspector.getByRole('button',{name:'Reset section'}).click();
 assert.equal(await inspector.getByLabel('Section axis').inputValue(),'X');
 await inspector.getByRole('button',{name:'Close inspection'}).click();
 assert.equal(await inspector.evaluate(node=>node.open),false);
 assert.equal(await inspectionPage.evaluate(()=>window.__sensoryStudio.currentModel.revision),inspectedRevision,'Inspection is view-only');
 await inspectionPage.locator('.sms-workspace-nav [data-tab=build]').click();
 const strict=inspectionPage.getByLabel('Require accessible passages');
 const strictSection=strict.locator('xpath=ancestor::details[1]');
 if(!await strictSection.evaluate(node=>node.open))await strictSection.locator(':scope > summary').click();
 await strict.check();
 await inspectionPage.locator('#smsGlobalUndo').click();
 assert.equal(await strict.isChecked(),false,'Undo restores optional passage enforcement');
 await inspectionPage.locator('#smsGlobalRedo').click();
 assert.equal(await strict.isChecked(),true,'Redo restores strict passage enforcement');
 await inspector.locator('summary').press('Enter');
 await inspector.getByText('Preview only').waitFor();
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 await inspectionPage.locator('.sms-workspace-nav [data-tab=print]').click();
 await inspectionPage.getByText(/Export blocked:.*crystal passage/).waitFor();
 assert(await inspectionPage.locator('[data-job-3mf]').isDisabled());
 await inspectionPage.reload();
 await inspectionPage.waitForFunction(()=>window.__sensoryStudio?.currentModel?.parameters.requireAccessiblePassages===true);
 await inspectionPage.evaluate(()=>window.__sensoryStudio.addModel('light-pods',{illuminated:true},'Light Pod inspection'));
 await inspector.locator('summary').press('Enter');
 await inspector.getByRole('button',{name:'Prepare inspection'}).click();
 await inspector.getByText('Prepared Light Pod').waitFor({timeout:120000});
 await inspector.getByLabel('Section axis').selectOption('Z');
 await inspectionPage.screenshot({path:'qa/unified-wt013-pod-section.png'});
 await inspectionPage.setViewportSize({width:390,height:844});
 await inspectionPage.screenshot({path:'qa/unified-wt013-inspector-narrow.png'});
 assert.deepEqual(errors,[]);
 console.log('WT-013 prepared sections, strict rejection, Pod and view-only controls verified.');
 await inspectionPage.close();
 page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 page.on('pageerror',error=>errors.push(error.message));
 }
 await page.addInitScript(()=>{
  if(!localStorage.getItem('wt-workspace-panels-v1')){
   localStorage.setItem('wt-workspace-panels-v1',JSON.stringify({settingsWidth:335,rail:'hidden',settings:false,palette:false}));
   localStorage.setItem('wt-viewport-height','99');
  }
 });
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__sensoryStudio);
 await fs.mkdir('qa',{recursive:true});
 const shot=name=>page.screenshot({path:'qa/unified-'+name+'.png'});
 assert(await page.locator('body.theme-light').count(),'First visit uses light mode.');
 await page.locator('#smsHomeSearch').fill('no-such-project');
 assert.match(await page.locator('#smsHomeModels').innerText(),/No matching/);
 await page.locator('#smsHomeSearch').clear();
 await shot('home');
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="control-caps"]').click();
 const id=await page.evaluate(()=>window.__sensoryStudio.currentModel.id);
 const viewer=page.locator('#viewport');
 assert(await viewer.locator('canvas').isVisible());
 const before=await viewer.boundingBox();
 const palette=page.locator('.sms-palette');
 await palette.evaluate(node=>{node.scrollTop=node.scrollHeight;});
 assert.deepEqual(await viewer.boundingBox(),before);
 assert.equal(await page.locator('.sms-split,.sms-more').count(),0);
 assert.equal(await page.locator('.brand').innerText(),'Pixel Model Maker');
 assert((await page.locator('.version').boundingBox()).y>(await page.locator('.brand').boundingBox()).y);
 for(const id of ['simpleBtn','advancedBtn','themeBtn','helpBtn','descriptionsBtn','changelogBtn','saveBtn','loadBtn','smsReload','smsGlobalUndo','smsGlobalRedo','smsLibrary','smsHome','smsNew'])
  assert(await page.locator('#'+id).isVisible(),id+' is directly available');
 const leftPanel=page.locator('#smsTools'),rightPanel=page.locator('#smsPrecision'),bottom=page.locator('#smsModelRail');
 assert.equal(Math.round((await rightPanel.boundingBox()).width),335);
 assert((await leftPanel.boundingBox()).x<(await viewer.boundingBox()).x);
 assert((await rightPanel.boundingBox()).x>(await viewer.boundingBox()).x);
 assert((await bottom.boundingBox()).y>=(await viewer.boundingBox()).y+(await viewer.boundingBox()).height-1);
 assert.equal(await viewer.locator('.sms-palette').count(),0);
 const leftEdge=page.getByRole('separator',{name:'Resize design and build'});
 const rightEdge=page.getByRole('separator',{name:'Resize precision settings'});
 async function dragEdge(edge,dx){
  const box=await edge.boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:5});await page.mouse.up();
 }
 const leftWidth=(await leftPanel.boundingBox()).width,rightWidth=(await rightPanel.boundingBox()).width;
 await dragEdge(leftEdge,35);await dragEdge(rightEdge,-30);
 assert((await leftPanel.boundingBox()).width>leftWidth);
 assert((await rightPanel.boundingBox()).width>rightWidth);
 const resized=(await leftPanel.boundingBox()).width;
 await leftEdge.press('ArrowLeft');
 assert((await leftPanel.boundingBox()).width<resized);
 assert((await viewer.boundingBox()).width>=420);
 await shot('wt014-resized');
 const leftToggle=leftPanel.locator('header button'),rightToggle=rightPanel.locator('header button');
 await leftToggle.click();await rightToggle.press('Enter');
 assert.equal(await leftToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await rightToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await palette.isVisible(),false);
 assert(await viewer.locator('canvas').isVisible());
 await shot('wt014-collapsed');
 const savedPanels=await page.evaluate(()=>localStorage.getItem('wt-workspace-panels-v2'));
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('wt-workspace-panels-v2')),savedPanels);
 assert.equal(await leftToggle.getAttribute('aria-expanded'),'false');
 assert.equal(await rightToggle.getAttribute('aria-expanded'),'false');
 await leftToggle.click();await rightToggle.click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 await page.locator('#advancedBtn').click();
 await page.locator('#simpleBtn').click();
 for(const id of ['helpBtn','changelogBtn']){
  await page.locator('#'+id).click();
  assert(await page.locator('#infoOverlay').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#infoOverlay').isVisible(),false);
 }
 const descriptions=page.locator('#descriptionsBtn');
 const described=await descriptions.getAttribute('aria-pressed');
 await descriptions.click();assert.notEqual(await descriptions.getAttribute('aria-pressed'),described);
 await descriptions.click();
 const [savedBackup]=await Promise.all([page.waitForEvent('download'),page.locator('#saveBtn').click()]);
 assert.match(savedBackup.suggestedFilename(),/\.json$/);
 await Promise.all([page.waitForEvent('filechooser'),page.locator('#loadBtn').click()]);
 await page.locator('#smsFocus').click();
 assert(await page.locator('body.sms-focused').count());await page.keyboard.press('Escape');
 assert.equal(await page.locator('body.sms-focused').count(),0);
 await page.getByRole('searchbox',{name:'Search settings'}).fill('not a real setting');
 assert(await page.locator('.sms-settings [data-filtered]').count());
 await page.getByRole('searchbox',{name:'Search settings'}).clear();
 // WT-021 discoverability: left-hand finder indexes downloads and physical
 // tools independently of the right-hand precision settings filter.
 const findTools=page.getByRole('searchbox',{name:'Find tools and downloads'});
 await findTools.fill('pixel fit test');
 assert(await page.getByRole('button',{name:/Download pixel fit test \(STL\)/}).isVisible(),
  'Find tools locates the actual printable pixel test coupon');
 await findTools.fill('magnet');
 assert(await page.getByRole('button',{name:/Open mounting and attachments/}).isVisible());
 await findTools.fill('Cura');
 assert(await page.getByRole('button',{name:/Open Cura profile download/}).isVisible());
 await findTools.fill('fictional missing tool');
 assert(await page.getByText(/No matching tools/).isVisible());
 await findTools.fill('pixel');await findTools.press('Escape');
 assert.equal(await findTools.inputValue(),'');
 await shot('wt014-desktop');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length),1);
 await page.locator('#smsGlobalUndo').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length||0),0);
 await page.locator('#smsGlobalRedo').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length),1);
 await shot('build');
 await page.locator('#smsLibrary').click();await shot('library');
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 assert.match(await page.locator('#smsPrintCurrent').innerText(),/Buttons/);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.printJobs.length),0);
 await shot('quick-print');
 await page.locator('#smsExpandPrint').click();assert(await page.locator('#smsPrintModels button').count());
 await page.locator('#smsExpandPrint').click();
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Browse Cogs & Gears starting points'}).click();
 const gearIds=['crown-open','turbine','petal-web','scallop-lace','solid-crown','rail-pulley'];
 const images=new Set();
 for(const gear of gearIds){
  const img=page.locator('#smsPicker [data-preset="'+gear+'"] img');
  assert.equal(await img.count(),1,gear+' has a rendered preview');
  images.add(await img.getAttribute('src'));
 }
 assert.equal(images.size,6,'Six distinct rendered gear previews');
 await shot('gear-gallery');
 await page.locator('#smsPicker [data-preset="turbine"]').click();
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 const range=page.locator('.sms-palette [data-palette-key=diameter]');
 const beforeDiameter=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter);
 await range.press('ArrowRight');
 assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter)>beforeDiameter);
 const precision=page.locator('[data-model-param=diameter]');
 await precision.evaluate(input=>{input.closest('details').open=true;});
 assert.equal(await precision.inputValue(),await range.inputValue());
 await page.locator('output[data-value-for=diameter]').click();
 await page.locator('[data-exact-input=diameter]').fill('110');
 await page.locator('[data-exact-input=diameter]').press('Enter');
 assert.equal(await range.inputValue(),'110');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter),110);
 const purpose=page.locator('[data-model-param=mode]');
 await purpose.evaluate(input=>{input.closest('details').open=true;});
 await purpose.focus();
 await purpose.selectOption('Mechanical');
 assert.equal(await purpose.inputValue(),'Decorative');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.mode),'Decorative');
 assert(await purpose.evaluate(input=>document.activeElement===input));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 const pixel=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
 assert(pixel);
 assert.notDeepEqual([pixel.x,pixel.z],[25.3,0]);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette').getByRole('button',{name:'Sector',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.webStyle),'Sector');
 await shot('palette-after');
 await page.locator('#smsPartEditor > summary').click();
 const partSelector=page.locator('#smsPartSelect');
 await partSelector.selectOption({index:1});
 const partId=await partSelector.inputValue();
 const partSlider=page.locator('[data-palette-key="part-offset-0"]');
 await partSlider.focus();await partSlider.press('ArrowRight');
 await page.waitForFunction(id=>window.__sensoryStudio.currentModel.build.partOffsets?.[id]?.[0]===.1,partId);
 assert.equal(await page.locator('[data-part-axis="0"]').inputValue(),'0.1');
 await page.locator('#smsPartReset').click();
 assert.equal(await partSlider.inputValue(),'0');
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator=crystals]').click();
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.getByText('Crystal starting points — creates a new model',{exact:true}).click();
 await page.getByRole('button',{name:'Crescent geode',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.parameters.pattern==='Geode / Crescent');
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.editableState.crystals.length),13);
 await shot('crystal-palette');
 await page.locator('#smsNew').click();
 await page.locator('#smsPicker [data-generator="tactile-tiles"]').click();
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const pixelPalette=page.locator('.sms-palette');
 await pixelPalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 const getHoles=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
 const [initialHole]=await getHoles();
 await page.locator('[data-view=top]').click();
 await page.waitForTimeout(450);
 const marker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),initialHole.id);
 const viewportRect=await viewer.locator('canvas').boundingBox();
 const towardCentre=(marker.x+viewportRect.x+viewportRect.width/2)/2;
 await page.mouse.click(marker.x,marker.y);
 assert.equal(await pixelPalette.locator('[data-select-pixel]').first().getAttribute('aria-pressed'),'true');
 await page.mouse.move(marker.x,marker.y);
 await page.mouse.down();
 await page.waitForTimeout(260);
 await page.mouse.move(towardCentre,marker.y,{steps:4});
 assert.deepEqual((await getHoles())[0],initialHole,'Drag preview must not change the saved model.');
 await page.mouse.up();
 const [movedHole]=await getHoles();
 assert.equal(movedHole.id,initialHole.id);
 assert.notDeepEqual([movedHole.x,movedHole.z],[initialHole.x,initialHole.z]);
 await page.keyboard.press('Control+z');
 assert.deepEqual((await getHoles())[0],initialHole);
 await page.keyboard.press('Control+Shift+z');
 assert.deepEqual((await getHoles())[0],movedHole);
 const rotation=pixelPalette.locator('[data-pixel-field=rotation]');
 await rotation.fill('45');await rotation.press('Tab');
 assert.equal((await getHoles())[0].rotation,45);
 const precisionRotation=page.locator('.sms-panel-details [data-pixel-field=rotation]');
 assert.equal(await precisionRotation.inputValue(),'45');
 const position=pixelPalette.locator('[data-pixel-field=x]');
 await position.fill('9999');await position.press('Tab');
 assert.equal(Number(await position.inputValue()),movedHole.x);
 assert.match(await pixelPalette.locator('[data-pixel-status]').innerText(),/material|solid/);
 await pixelPalette.locator('[data-fit-kind]').selectOption('single');
 await pixelPalette.locator('[data-fit-format]').selectOption('3mf');
 const download=page.waitForEvent('download');
 await pixelPalette.locator('[data-fit-print]').click();
 assert.match((await download).suggestedFilename(),/single\.3mf$/);
 await shot('wt006-pixel-fit');
 const calibrated=pixelPalette.locator('[data-fit-calibration]');
 await pixelPalette.getByText('Record measured fit',{exact:true}).click();
 await calibrated.locator('[name=bodyDiameter]').fill('5');
 await calibrated.locator('[name=printedBoreDiameter]').fill('5.3');
 await calibrated.locator('[name=profileName]').fill('Measured test seed');
 await calibrated.getByRole('button',{name:'Save measured fit'}).click();
 assert.match((await getHoles())[0].profileId,/^custom-/);
 const sameId=(await getHoles())[0].id;
 assert.equal(sameId,initialHole.id);
 await pixelPalette.getByRole('button',{name:'Remove P1'}).click();
 assert.equal((await getHoles()).length,0);
 await page.locator('[data-view=top]').click();
 await page.waitForTimeout(380);
 const surface=await page.locator('canvas').first().boundingBox();
 await page.mouse.dblclick(surface.x+surface.width/2,surface.y+surface.height/2);
 const fittingActions=page.getByRole('dialog',{name:'Hardware at this point'});
 await fittingActions.waitFor();
 assert.match(await fittingActions.innerText(),/bore opens on both faces/);
 await shot('wt018-tile-hardware-context');
 await page.keyboard.press('Escape');
 await fittingActions.waitFor({state:'hidden'});
 assert.equal((await getHoles()).length,0);
 await page.mouse.dblclick(surface.x+surface.width/2,surface.y+surface.height/2);
 await fittingActions.getByRole('button',{name:'Add pixel',exact:true}).click();
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles.length===1);
 const [placed]=await getHoles();
 assert.notEqual(placed.id,sameId);
 assert.equal(placed.checked,true);
 await shot('wt006-pixel-placement');
 await pixelPalette.getByRole('button',{name:'Place LED fitting in 3D'}).click();
 const nativeCanvas=viewer.locator('canvas');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor();
 const y=surface.y+surface.height/2;
 for(const fraction of [.58,.42,.64,.36,.70,.30]){
  const x=surface.x+surface.width*fraction;
  await page.mouse.move(x,y);
  if(await nativeCanvas.getAttribute('data-native-placement')==='valid'){
   await page.mouse.click(x,y);
   break;
  }
 }
 assert.equal((await getHoles()).length,2,'Manual placement adds another fitting and remains active.');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor();
 await shot('wt019-native-placement');
 await page.keyboard.press('Escape');
 await pixelPalette.getByRole('button',{name:'Done placing pixels'}).waitFor({state:'hidden'});
 assert.equal((await getHoles()).length,2,'Exiting placement keeps accepted fittings.');
 const nameProject=async name=>{
  await page.locator('#smsProjectTitle').fill(name);
  await page.locator('#smsProjectTitle').press('Tab');
 };
 const snapshot=()=>page.evaluate(()=>window.__sensoryStudio.project.models.map(({id,parameters,materials,build,link})=>({id,parameters,materials,build,link})));
 await nameProject('River workshop');
 await page.locator('#smsLibrary').click();
 const savedModels=await snapshot();
 assert(savedModels.length>=2);
 const thumbnail=await page.evaluate(()=>window.__sensoryStudio.project.models.find(model=>model.thumbnail?.startsWith('data:image/'))?.thumbnail);
 assert(thumbnail);
 await page.locator('#smsSaveProject').click();
 const projects=page.locator('#smsSavedProjects');
 const river=projects.locator('article').filter({has:page.getByRole('heading',{name:'River workshop',exact:true})});
 assert.match(await river.innerText(),new RegExp(savedModels.length+' models'));
 assert.equal(await river.locator('img').getAttribute('src'),thumbnail);
 await nameProject('No preview workshop');
 await page.evaluate(()=>window.__sensoryStudio.project.models.forEach(model=>{model.thumbnail=null;}));
 await page.locator('#smsSaveProject').click();
 assert.match(await projects.locator('article').filter({hasText:'No preview workshop'}).innerText(),/Preview unavailable/);
 await nameProject('Current unsaved title');
 const currentModels=await snapshot();
 const savedCount=await projects.locator('article').count();
 const search=page.locator('#smsSearch');
 await search.fill('rIvEr WoRk');
 assert.equal(await projects.locator('article').count(),1);
 await page.locator('#smsFilter').selectOption('crystals');
 assert.equal(await projects.locator('article').count(),await page.evaluate(()=>window.__sensoryStudio.project.models.some(model=>model.generator.typeId==='crystals'))?1:0,'Saved project filtering considers its model families.');
 await page.locator('#smsFilter').selectOption('all');
 await search.fill('');
 assert.equal(await projects.locator('article').count(),savedCount);
 await projects.scrollIntoViewIfNeeded();
 await shot('wt007-project-gallery-desktop');
 page.once('dialog',dialog=>dialog.accept('Thawmor'));
 await page.locator('#smsCollectionNew').press('Enter');
 await page.locator('#smsLibraryAll').press('Enter');
 await river.getByText('Collections',{exact:true}).press('Enter');
 await river.getByRole('checkbox',{name:'Thawmor'}).check();
 await river.getByRole('button',{name:'☆ Favourite'}).click();
 await page.locator('#smsFavourites').press('Enter');
 assert.equal(await projects.locator('article').count(),1);
 await shot('wt015-favourites');
 await page.locator('#smsCollections').selectOption({label:'Thawmor'});
 assert.equal(await river.count(),1);
 await shot('wt015-collection');
 page.once('dialog',dialog=>dialog.accept('River starter'));
 await river.getByRole('button',{name:'Save as reusable template'}).press('Enter');
 await page.locator('#smsTemplates').press('Enter');
 const starter=page.getByRole('button',{name:'Create project from template'});
 await starter.waitFor();
 page.once('dialog',dialog=>dialog.dismiss());
 await starter.press('Enter');
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 await shot('wt015-templates');
 await page.locator('#smsLibraryAll').press('Enter');
 await page.setViewportSize({width:740,height:880});
 assert(await river.getByRole('button',{name:'Open project River workshop'}).isVisible());
 await river.scrollIntoViewIfNeeded();
 await shot('wt007-project-gallery-mobile');
 await page.setViewportSize({width:1440,height:1000});
 const rename=river.getByRole('button',{name:'Rename saved project River workshop'});
 for(const input of [null,'   ','✨'.repeat(101),'River workshop']){
  const dialogResult=new Promise((resolve,reject)=>page.once('dialog',async dialog=>{
   try{
    const initial=dialog.defaultValue();
    if(input===null)await dialog.dismiss();else await dialog.accept(input);
    resolve(initial);
   }catch(error){reject(error);}
  }));
  await rename.press('Enter');
  assert.equal(await dialogResult,'River workshop');
  assert.equal(await river.count(),1);
  assert.equal(await projects.locator('article').count(),savedCount);
  assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
  if(input!==null&&input!=='River workshop')assert.match(await river.getByRole('status').innerText(),/1 to 100/);
 }
 assert.deepEqual(await snapshot(),currentModels);
 await search.fill('river workshop');
 const renamedTitle='Tide & <Light> 🌊';
 page.once('dialog',dialog=>dialog.accept('  '+renamedTitle+'  '));
 await rename.click();
 assert.equal(await projects.locator('article').count(),0);
 await search.fill('tIDE');
 const renamed=projects.locator('article').filter({has:page.getByRole('heading',{name:renamedTitle,exact:true})});
 assert.equal(await renamed.count(),1);
 assert.match(await renamed.innerText(),new RegExp(savedModels.length+' models'));
 assert.equal(await renamed.locator('img').getAttribute('src'),thumbnail);
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await page.locator('#smsLibrary').click();
 assert.equal(await projects.locator('article').count(),savedCount);
 assert.equal(await renamed.locator('img').getAttribute('src'),thumbnail);
 const open=renamed.getByRole('button',{name:'Open project '+renamedTitle});
 page.once('dialog',dialog=>dialog.dismiss());
 await open.click();
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),'Current unsaved title');
 assert.equal(await projects.locator('article').count(),savedCount);
 assert.deepEqual(await snapshot(),currentModels);
 page.once('dialog',dialog=>dialog.accept());
 await open.click();
 assert.equal(await page.locator('#smsProjectTitle').inputValue(),renamedTitle);
 assert.deepEqual(await snapshot(),savedModels);
 await page.locator('#smsLibrary').click();
 assert.equal(await projects.locator('article').count(),savedCount+1);
 assert(await projects.getByRole('button',{name:'Open project Current unsaved title'}).isVisible());
 const sourceCard=page.locator('#smsProjectModels article').first();
 const sourceName=await sourceCard.locator('h3').textContent();
 await sourceCard.getByRole('button',{name:'Save to library',exact:true}).click();
 const sourceSaved=page.locator('#smsSavedModels article').filter({has:page.getByRole('heading',{name:sourceName,exact:true})});
 await sourceSaved.getByRole('button',{name:'☆ Favourite'}).click();
 page.once('dialog',dialog=>dialog.accept('Pinned model starter'));
 await sourceSaved.getByRole('button',{name:'Save as reusable template'}).press('Enter');
 await page.locator('#smsTemplates').press('Enter');
 const pinned=page.locator('article').filter({has:page.getByRole('heading',{name:'Pinned model starter',exact:true})});
 await pinned.getByRole('button',{name:'Linked copy',exact:true}).click();
 const link=await page.evaluate(()=>window.__sensoryStudio.currentModel.link);
 assert.equal(link.revision,1);
 await page.locator('#smsLibrary').click();
 await pinned.getByRole('button',{name:'Independent copy',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.link),null);
 const previousProject=await page.evaluate(()=>window.__sensoryStudio.project.id);
 await page.locator('#smsLibrary').click();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Create project from template'}).press('Enter');
 assert.notEqual(await page.evaluate(()=>window.__sensoryStudio.project.id),previousProject);
 assert.deepEqual(await snapshot(),savedModels);
 await shot('wt015-restored-project');
 await page.locator('#smsLibrary').click();
 const backupWorkspace=await page.evaluate(()=>{
  const project=structuredClone(window.__sensoryStudio.project);
  project.id='remote-fixture';project.title='Recovered River fixture';
  return {schemaVersion:1,project,library:[],savedProjects:[]};
 });
 const localProjectId=await page.evaluate(()=>window.__sensoryStudio.project.id);
 const restoreFile=page.locator('#smsImport');
 const backupFile={name:'workspace.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backupWorkspace))};
 await restoreFile.setInputFiles(backupFile);
 const recovery=page.getByRole('dialog',{name:'Review backup'});
 await recovery.waitFor();
 assert.match(await recovery.innerText(),/Backup only \(1\).*Recovered River fixture/);
 await shot('wt016-preview');
 // Verify recovery remains fully usable on a narrow phone-sized viewport.
 await page.setViewportSize({width:390,height:844});
 await recovery.getByLabel('Recovery strategy').selectOption('copies');
 const narrowDialog=await recovery.boundingBox();
 assert(narrowDialog&&narrowDialog.x>=-1&&narrowDialog.x+narrowDialog.width<=391,
  'Recovery dialog must fit within a 390px viewport');
 assert(await recovery.getByRole('button',{name:'Cancel'}).isVisible());
 await shot('wt016-recovery-dialog-390px');
 await recovery.getByRole('button',{name:'Cancel'}).click();
 await page.setViewportSize({width:1440,height:1000});
 assert.equal(await page.getByRole('heading',{name:'Recovered River fixture',exact:true}).count(),0);
 await restoreFile.setInputFiles(backupFile);
 await recovery.getByLabel('Recovery strategy').selectOption('merge');
 page.once('dialog',dialog=>dialog.accept());
 await recovery.getByRole('button',{name:'Apply choice'}).click();
 await recovery.waitFor({state:'hidden'});
 await page.getByText('Recovery complete', {exact:false}).waitFor();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.id),localProjectId);
 await page.locator('#smsLibraryAll').press('Enter');
 assert.equal(await page.getByRole('heading',{name:'Recovered River fixture',exact:true}).count(),1);
 await shot('wt016-restored-copy');
 await restoreFile.setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{corrupt')});
 await page.getByText('Could not read backup', {exact:false}).waitFor();
 await page.locator('#model-tab-'+id).click();
 await page.locator('#themeBtn').click();await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert(await page.locator('body.theme-dark').count());
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.id),id);
 await page.setViewportSize({width:740,height:880});
 assert(await page.locator('#smsHomeNew').isVisible());
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true);
 await page.setViewportSize({width:1440,height:1000});
 const queueTileName='Café / Weather: '+ 'Printer '.repeat(12).trim();
 const fixture=await page.evaluate(tileName=>{
  const studio=window.__sensoryStudio;
  const crystal=studio.project.models.find(model=>model.generator.typeId==='crystals');
  const tile=studio.addModel('tactile-tiles',{width:70,dualMaterial:false},tileName);
  studio.switchModel(crystal.id);
  return {crystal:{id:crystal.id,name:crystal.name},tile:tile.id};
 },queueTileName);
 const openPrint=()=>page.locator('.sms-workspace-nav [data-tab=print]').click();
 const jobs=page.locator('#smsJobs article');
 const queue=()=>page.evaluate(()=>window.__sensoryStudio.project.printJobs);
 await openPrint();
 assert((await page.locator('#smsPrintCurrent').innerText()).includes(fixture.crystal.name));
 assert(await page.locator('#smsPrintCurrent img').isVisible());
 await page.locator('#smsExpandPrint').press('Enter');
 const addCrystal=page.locator('#smsPrintModels').getByRole('button',{name:'Add '+fixture.crystal.name,exact:true});
 await addCrystal.evaluate(button=>{button.click();button.click();});
 await page.locator('#smsPrintModels').getByRole('button',{name:'Add '+queueTileName,exact:true}).click();
 const [crystalJob,tileJob]=await queue();
 assert.equal((await queue()).length,2);
 assert.equal(crystalJob.modelId,fixture.crystal.id);
 assert.equal(tileJob.modelId,fixture.tile);
 const card=job=>jobs.filter({has:page.getByRole('heading',{name:job===tileJob?queueTileName:fixture.crystal.name,exact:true})});
 const tile=card(tileJob),crystal=card(crystalJob);
 assert.equal(await crystal.locator('img,.sms-picture-empty').count(),1);
 assert.match(await tile.innerText(),/source revision/);
 assert(await crystal.locator('[data-job-up]').isDisabled());
 assert(await tile.locator('[data-job-down]').isDisabled());
 const tabOrder=await page.evaluate(()=>window.__sensoryStudio.project.tabs);
 await tile.locator('[data-job-up]').click();
 assert.deepEqual(await jobs.evaluateAll(items=>items.map(item=>item.dataset.printJob)),[tileJob.id,crystalJob.id]);
 await tile.locator('[data-job-down]').click();
 await tile.locator('[data-job-up]').click();
 const setting=key=>tile.locator('[data-job-setting="'+key+'"]');
 await setting('printer').selectOption('Ultimaker 2+');
 await setting('curaNozzle').selectOption('0.8');
 await setting('curaMaterial').selectOption('PETG');
 await setting('curaQuality').fill('35');await setting('curaQuality').press('Tab');
 assert.equal(await crystal.locator('[data-job-setting=curaMaterial]').inputValue(),'PLA');
 await page.getByText('Saved locally',{exact:true}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await openPrint();await page.locator('#smsExpandPrint').click();
 assert.deepEqual((await queue()).map(job=>job.id),[tileJob.id,crystalJob.id]);
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.project.tabs),tabOrder);
 assert.equal(await setting('curaQuality').inputValue(),'35');
 assert.equal(await setting('printer').inputValue(),'Ultimaker 2+');
 assert.equal(await setting('curaNozzle').inputValue(),'0.8');
 assert.equal(await setting('curaMaterial').inputValue(),'PETG');
 assert.equal(await page.locator('#smsMaterial').inputValue(),'PLA');
 assert(await tile.locator('[data-job-3mf]').isDisabled());
 await page.locator('#smsPrepareAll').click();
 const pending=(await queue()).find(job=>job.id===crystalJob.id);
 assert(pending.requestId);
 assert(await crystal.locator('[data-job-prepare]').isDisabled());
 await crystal.locator('[data-job-cancel]').click();
 assert.equal((await queue()).find(job=>job.id===crystalJob.id).status,'cancelled');
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',tileJob.id,{timeout:120000});
 assert.equal((await queue()).find(job=>job.id===crystalJob.id).status,'cancelled');
 await crystal.getByRole('button',{name:'Retry',exact:true}).click();
 assert.notEqual((await queue()).find(job=>job.id===crystalJob.id).requestId,pending.requestId);
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',crystalJob.id,{timeout:120000});
 async function useDownload(button){
  try{
   const [download]=await Promise.all([page.waitForEvent('download'),button.click()]);
   return {name:download.suggestedFilename(),bytes:await fs.readFile(await download.path())};
  }catch(error){
   // A click may return successfully when exportJob catches a failure.
   // Keep the exact Print Centre report and state as regression evidence.
   const card=await button.evaluate(node=>({
    disabled:node.disabled,jobText:node.closest('[data-print-job]')?.innerText?.slice(0,1000)
   })).catch(()=>({jobText:'Job card no longer available'}));
   const status=await page.locator('#smsPrintStatus').textContent().catch(()=>null);
   throw new Error('Print Centre download did not produce a file: '+error.message+
    '\\nJob: '+JSON.stringify(card)+'\\nStatus: '+status);
  }
 }
 function zipEntries(bytes){
  const entries=new Map();
  for(let offset=0;offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
   const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28);
   const start=offset+30+nameSize+extra;
   entries.set(bytes.toString('utf8',offset+30,offset+30+nameSize),bytes.subarray(start,start+size));offset=start+size;
  }
  return entries;
 }
 function read3MFGeometry(xml){
  assert.match(xml,/<model unit="millimeter"/);
  const vertices=[...xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"\/>/g)].flatMap(match=>match.slice(1).map(Number));
  const indices=[...xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].flatMap(match=>match.slice(1).map(Number));
  assert(vertices.length>0&&indices.length>0);
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);
  return geometry;
 }
 async function finishNativeJourney(name){
  const {parameters,build}=await page.evaluate(()=>window.__sensoryStudio.currentModel);
  const title='WT-021 '+name+' manufacturing journey';
  await page.locator('#smsProjectTitle').fill(title);
  await page.locator('#smsProjectTitle').press('Tab');
  await page.locator('#smsLibrary').click();
  await page.locator('#smsSaveProject').click();
  await page.locator('#smsSavedProjects').getByRole('heading',{name:title,exact:true}).waitFor();
  const backup=JSON.parse((await useDownload(page.locator('#smsBackup'))).bytes.toString());
  assert.deepEqual(backup.project.models.find(model=>model.name===name).build,build);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(name=>window.__sensoryStudio?.currentModel?.name===name,name);
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build),build);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.getByRole('button',{name:'Render actual model',exact:true}).click();
  const inspection=page.locator('#smsLightInspector');
  await inspection.getByText(/Prepared (?:manufacturing mesh|Light Pod)/).waitFor({timeout:120000});
  await inspection.getByLabel('Cut section').check();
  await inspection.getByRole('button',{name:'Close inspection'}).click();
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  const job=page.locator('#smsJobs article').filter({hasText:name});
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const production=zipEntries((await useDownload(job.locator('[data-job-export]'))).bytes);
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const cura=await useDownload(job.locator('[data-job-cura]'));
  assert(stl.name.endsWith('.stl'));
  assert(cura.name.endsWith('.curaprofile'));
  assert.deepEqual(stl.bytes,[...production.entries()].find(([name])=>name.endsWith('.stl'))[1]);
  assert.deepEqual(cura.bytes,[...production.entries()].find(([name])=>name.endsWith('.curaprofile'))[1]);
  const threeMF=zipEntries((await useDownload(job.locator('[data-job-3mf]'))).bytes);
  const manifest=JSON.parse(production.get('print-job-manifest.json'));
  assert.equal(manifest.routing.channels.length,3);
  assert.equal(manifest.coordinateFrame,'Z-up');
  assert.equal(manifest.units,'mm');
  const xml=threeMF.get('3D/3dmodel.model').toString();
  assert.match(xml,/<item objectid="[0-9]+" transform="1 0 0 0 1 0 0 0 1 0 0 0"/);
  const stlGeometry=new STLLoader().parse(Uint8Array.from(stl.bytes).buffer);
  const mfGeometry=read3MFGeometry(xml);
  stlGeometry.computeBoundingBox();mfGeometry.computeBoundingBox();
  for(const key of ['min','max'])
   assert(stlGeometry.boundingBox[key].distanceTo(mfGeometry.boundingBox[key])<.001,name+' matching print-space '+key);
  const measured=stlGeometry.boundingBox.getSize(new THREE.Vector3()).toArray();
  assert.equal(manifest.dimensionsMm.length,3);
  assert(measured.every((size,axis)=>Math.abs(size-manifest.dimensionsMm[axis])<.001),name+' production dimensions match the downloaded mesh');
  return {parameters,build,geometries:[
   ['STL',stlGeometry],['3MF',mfGeometry]
  ]};
 }
 const modelFile=await useDownload(tile.locator('[data-job-3mf]'));
 const printPack=await useDownload(tile.locator('[data-job-export]'));
 const threeMF=zipEntries(modelFile.bytes),pack=zipEntries(printPack.bytes);
 assert(threeMF.has('3D/3dmodel.model'));
 const directSTL=await useDownload(tile.locator('[data-job-stl]'));
 assert.match(directSTL.name,/\.stl$/);
 const packedSTL=[...pack.keys()].find(name=>name.endsWith('.stl'));
 assert.deepEqual(directSTL.bytes,pack.get(packedSTL));
 const directCura=await useDownload(tile.locator('[data-job-cura]'));
 const packedCura=[...pack.keys()].find(name=>name.endsWith('.curaprofile'));
 assert.match(directCura.name,/\.curaprofile$/);
 assert.deepEqual(directCura.bytes,pack.get(packedCura));
 const manifest=JSON.parse(pack.get('print-job-manifest.json'));
 const preparedTile=(await queue()).find(job=>job.id===tileJob.id);
 const meshXML=threeMF.get('3D/3dmodel.model').toString();
 assert.match(meshXML,/<model unit="millimeter"/);
 const vertices=[...meshXML.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(vertex=>vertex.slice(1).map(Number));
 assert(vertices.length>0);
 for(let axis=0;axis<3;axis++){
  const values=vertices.map(vertex=>vertex[axis]);
  const exportedSize=values.reduce((a,b)=>Math.max(a,b),-Infinity)-values.reduce((a,b)=>Math.min(a,b),Infinity);
  assert(Math.abs(manifest.dimensionsMm[axis]-exportedSize)<.001,'Manifest dimensions must match the actual Z-up export');
 }
 await shot('production-print-handoff');
 assert.deepEqual(manifest,{
  schemaVersion:1,modelId:fixture.tile,modelName:queueTileName,generatorType:'tactile-tiles',
  modelRevision:preparedTile.revision,jobId:tileJob.id,preparedRevision:preparedTile.preparedRevision,
  printer:'Ultimaker 2+',nozzleMm:.8,material:'PETG',quality:35,units:'mm',coordinateFrame:'Z-up',
  dimensionsMm:manifest.dimensionsMm,curaProfile:'included',files:[...pack.keys()]
 });
 assert.match(printPack.name,/^cafe-weather-[a-z0-9-]+-rev[0-9]+-[0-9a-f]{16}\.zip$/);
 assert(printPack.name.length<85);
 assert(printPack.name.includes('-rev'+manifest.modelRevision+'-'));
 assert.equal(modelFile.name,printPack.name.replace(/\.zip$/,'.3mf'));
 const crystalFile=await useDownload(crystal.locator('[data-job-3mf]'));
 assert.notEqual(crystalFile.name.match(/[0-9a-f]{16}(?=\.3mf$)/)?.[0],modelFile.name.match(/[0-9a-f]{16}(?=\.3mf$)/)?.[0]);
 assert(zipEntries(crystalFile.bytes).has('3D/3dmodel.model'));
 const crystalPack=zipEntries((await useDownload(crystal.locator('[data-job-export]'))).bytes);
 const opticalReport=JSON.parse(crystalPack.get('03_Reports/light-passage-inspection.json'));
 assert.equal(opticalReport.softwareSamplingOnly,true);
 assert.equal(opticalReport.physicalOpticalVerification,false);
 assert.equal(opticalReport.modelRevision,JSON.parse(crystalPack.get('print-job-manifest.json')).modelRevision);
 assert(crystalPack.has('03_Reports/light-passage-inspection.txt'));
 for(const name of ['editable-model.json','material-roles.json','print-report.json','cura-manual-settings.txt'])assert(pack.has(name),name);
 assert([...pack.keys()].some(name=>name.endsWith('.stl')));
 const inner3MF=[...pack.keys()].find(name=>name.endsWith('.3mf'));
 assert.deepEqual(pack.get(inner3MF),modelFile.bytes);
 const profile=[...pack.keys()].find(name=>name.endsWith('.curaprofile'));
 assert.match(profile,/UM2-Plus_0p8mm_PETG_Q35/);
 const readme=pack.get('READ-ME.txt').toString();
 for(const line of ['Model: '+queueTileName,'Revision: '+manifest.modelRevision,'Job ID: '+tileJob.id,
  'Printer: Ultimaker 2+','Nozzle: 0.8 mm','Material: PETG','Quality: 35 / 100','The STL files share one origin.','installed Cura'])
  assert(readme.includes(line),line);
 assert(zipEntries((await useDownload(page.locator('#smsCura'))).bytes).size>0);
 await shot('wt008-print-queue');
 await page.setViewportSize({width:740,height:880});
 await tile.scrollIntoViewIfNeeded();
 assert(await tile.locator('[data-job-export]').isVisible());
 await shot('wt008-print-queue-narrow');
 await page.setViewportSize({width:1440,height:1000});
 await setting('curaNozzle').selectOption('0.6');
 assert(await tile.locator('[data-job-3mf]').isDisabled());
 assert(await tile.locator('[data-job-export]').isDisabled());
 assert(await crystal.locator('[data-job-3mf]').isEnabled());
 await setting('printer').selectOption('Custom / other');
 await tile.locator('[data-job-prepare]').click();
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.id===id)?.status==='prepared',tileJob.id,{timeout:120000});
 const manualPack=zipEntries((await useDownload(tile.locator('[data-job-export]'))).bytes);
 const manual=JSON.parse(manualPack.get('print-job-manifest.json'));
 assert.equal(manual.curaProfile,'manual-review');
 assert.equal(manual.printer,'Custom / other');
 assert.equal(manual.nozzleMm,.6);
 assert.equal(manual.material,'PETG');
 assert.equal(manual.quality,35);
 assert.deepEqual(manual.files,[...manualPack.keys()]);
 assert(manualPack.has('cura-manual-review.txt'));
 assert(![...manualPack.keys()].some(name=>name.endsWith('.curaprofile')));
 await tile.locator('[data-job-reset]').click();
 assert.deepEqual((await queue()).find(job=>job.id===tileJob.id).overrides,{});
 assert.equal(await setting('curaNozzle').inputValue(),'0.4');
 await tile.locator('[data-job-remove]').click();
 assert.equal(await tile.count(),0);
 assert(await page.evaluate(id=>window.__sensoryStudio.project.models.some(model=>model.id===id),fixture.tile));
 await page.getByText('Saved locally',{exact:true}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 await openPrint();await page.locator('#smsExpandPrint').click();
 assert(await crystal.locator('[data-job-3mf]').isDisabled());
 const dualId=await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{dualMaterial:true},'Dual material queue test').id);
 await openPrint();await page.locator('#smsExpandPrint').click();
 await page.locator('#smsPrintModels').getByRole('button',{name:'Add Dual material queue test',exact:true}).click();
 const dual=jobs.filter({has:page.getByRole('heading',{name:'Dual material queue test',exact:true})});
 await dual.locator('[data-job-setting=printer]').selectOption('Ultimaker 2+');
 await dual.locator('[data-job-prepare]').click();
 await page.waitForFunction(id=>window.__sensoryStudio.project.printJobs.find(job=>job.modelId===id)?.status==='prepared',dualId,{timeout:120000});
 assert(await dual.locator('[data-job-3mf]').isDisabled());
 assert(await dual.locator('[data-job-export]').isDisabled());
 assert.match(await dual.innerText(),/Choose Ultimaker 3 Extended for two materials/);
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
 await openPrint();
 assert.match(await dual.innerText(),/Stale/);
 assert(await dual.locator('[data-job-export]').isDisabled());
 {
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Tactile Texture Tiles starting points/}).click();
  const preset=page.locator('#smsPicker [data-preset=terraces]');
  const quilt=page.locator('#smsPicker [data-preset=quilt]');
  assert.notEqual(await preset.locator('img').getAttribute('src'),await quilt.locator('img').getAttribute('src'));
  await preset.click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const palette=page.locator('.sms-palette');
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  const position=palette.locator('[data-pixel-field=x]');
  await position.fill('-15');await position.press('Tab');
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('15');await position.press('Tab');
  await serial.locator('[data-native-route]').click();
  assert(await serial.locator('[data-native-route]').isChecked());
  assert.match(await serial.innerText(),/Channels ready/);
  assert.match(await serial.innerText(),/P1 → P2/);
  await serial.locator('[data-native-pitch]').selectOption('25');
  assert.match(await serial.innerText(),/Cable budget exceeded/);
  await serial.locator('[data-native-pitch]').selectOption('custom');
  const custom=serial.locator('[data-native-custom]');
  await custom.fill('40');await custom.press('Tab');
  await serial.locator('[data-native-preview]').uncheck();
  await serial.locator('[data-native-preview]').check();
  await serial.locator('[data-native-in-tail]').fill('120');await serial.locator('[data-native-in-tail]').press('Tab');
  await serial.locator('[data-native-out-tail]').fill('110');await serial.locator('[data-native-out-tail]').press('Tab');
  await serial.locator('[data-native-pin=in]').click();
  assert.notEqual(await serial.locator('[data-native-edge=in]').inputValue(),'');
  await serial.locator('[data-native-pin=out]').click();
  assert.notEqual(await serial.locator('[data-native-edge=out]').inputValue(),'');
  assert.match(await serial.innerText(),/Channels ready/);
  await serial.scrollIntoViewIfNeeded();
  await shot('wt012-tile-routing');
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  const routedJob=page.locator('#smsJobs article');
  await routedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const archive=zipEntries((await useDownload(routedJob.locator('[data-job-export]'))).bytes);
  assert.equal(JSON.parse(archive.get('print-job-manifest.json')).routing.channels.length,3);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  assert.equal(await serial.locator('[data-native-custom]').inputValue(),'40');
  assert.equal(await serial.locator('[data-native-out-tail]').inputValue(),'110');
  assert.notEqual(await serial.locator('[data-native-edge=in]').inputValue(),'');
  assert.notEqual(await serial.locator('[data-native-edge=out]').inputValue(),'');
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Cogs & Gears starting points/}).click();
  const fork=page.locator('#smsPicker [data-preset=forked-sun]');
  const rotor=page.locator('#smsPicker [data-preset=forked-rotor]');
  assert.notEqual(await fork.locator('img').getAttribute('src'),await rotor.locator('img').getAttribute('src'));
  await fork.click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  assert(await serial.locator('[data-native-route]').isDisabled());
  assert.match(await serial.innerText(),/solid decorative gear/);
  const automatic=palette.getByRole('button',{name:'Add pixel automatically',exact:true});
  for(let count=1;count<=4;count++){
   await automatic.click();
   assert.equal((await getHoles()).length,count,'Openwork Gear accepts fitting P'+count);
  }
  const openworkFittings=await getHoles();
  assert(await serial.locator('[data-native-preview]').isDisabled());
  assert.match(await serial.locator('[data-native-guide-blocked]').innerText(),/openwork/);
  assert(await serial.locator('[data-native-route]').isDisabled());
  await shot('wt020-openwork-gear-four-pixels');
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  assert.deepEqual(await getHoles(),openworkFittings);
  assert.match(await serial.locator('[data-native-guide-blocked]').innerText(),/openwork/);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  await routedJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const openworkPack=zipEntries((await useDownload(routedJob.locator('[data-job-export]'))).bytes);
  assert([...openworkPack.keys()].some(name=>name.endsWith('.stl')));
  assert(zipEntries((await useDownload(routedJob.locator('[data-job-3mf]'))).bytes).has('3D/3dmodel.model'));
  assert.equal(JSON.parse(openworkPack.get('print-job-manifest.json')).routing?.channels?.length??0,0);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  for(let count=4;count>=1;count--){
   await palette.getByRole('button',{name:'P'+count,exact:true}).click();
   await palette.getByRole('button',{name:'Remove P'+count,exact:true}).click();
  }
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await palette.getByRole('button',{name:'Solid',exact:true}).click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('-15');await position.press('Tab');
  await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  await position.fill('15');await position.press('Tab');
  assert(await serial.locator('[data-native-preview]').isChecked(),'Gear route guide defaults on when a path exists');
  assert(!(await serial.locator('[data-native-route]').isChecked()),'Viewing Gear wiring does not enable machining');
  await page.locator('[data-view=bottom]').click();
  await page.waitForTimeout(500);
  const second=(await getHoles())[1];
  assert.equal(second.x,15,'Gear P2 accepts its exact X coordinate before placement');
  await palette.getByRole('button',{name:'Remove P2',exact:true}).click();
  const underside=await page.evaluate(({x,z})=>window.__sensoryStudio.fittingPointScreen(x,z,'underside'),second);
  assert(underside,'Gear P2 has a solid underside at the intended position');
  await page.mouse.dblclick(underside.x,underside.y);
  await fittingActions.getByRole('button',{name:'Add pixel',exact:true}).click();
  const replaced=(await getHoles())[1];
  assert.equal(replaced.entryFace,'underside');
  assert(Math.hypot(replaced.x-second.x,replaced.z-second.z)<1,
   'Gear placement preserves the clicked underside location: '+JSON.stringify({second,replaced}));
  await shot('wt019-gear-underside');
  await serial.locator('[data-native-route]').click();
  assert(await serial.locator('[data-native-route]').isChecked());
  assert.match(await serial.innerText(),/Channels ready/);
  await shot('wt012-gear-routing');
  await palette.locator('[data-pixel-previous]').click();
  assert.match(await serial.innerText(),/No safe tangent-compatible path/);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  await routedJob.getByText('Stale',{exact:true}).waitFor();
  assert(await routedJob.locator('[data-job-export]').isDisabled());
  await routedJob.locator('[data-job-prepare]').click();
  await routedJob.getByText('Failed',{exact:true}).waitFor({timeout:120000});
  assert(await routedJob.locator('[data-job-export]').isDisabled());
  assert(await routedJob.locator('[data-job-3mf]').isDisabled());
  await page.locator('#smsNew').click();
  await page.getByRole('button',{name:/Browse Glowing Pebbles & Light Pods starting points/}).click();
  const tall=page.locator('#smsPicker [data-preset=beacon-tall]');
  const low=page.locator('#smsPicker [data-preset=beacon-low]');
  assert.notEqual(await tall.locator('img').getAttribute('src'),await low.locator('img').getAttribute('src'));
  await tall.click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  assert(await serial.locator('[data-native-route]').isDisabled());
 }

 // WT-019: use actual model-camera input at a known solid location on
 // each native fixture. Restore the auto seed on an unsupported face.
 const checkNativeDoubleClick=async (type,palette,hole)=>{
  for(const [view,direction] of [['iso',[1,.75,1]],['front',[0,.12,1]],['back',[0,.12,-1]],['bottom',[0,-1,.0001]],['top',[0,1,.0001]]]){
   await page.locator('[data-view='+view+']').click();
   await page.waitForFunction(direction=>{
    const {settled,modelSize,center,target,camera,screen}=window.__crystalForgeViewMetrics();
    const offset=camera.map((value,i)=>value-target[i]);
    const dot=offset.reduce((sum,value,i)=>sum+value*direction[i],0);
    const aligned=dot/(Math.hypot(...offset)*Math.hypot(...direction))>.999;
    return settled&&aligned&&modelSize.every(size=>size>0)&&Math.abs(screen[0])<.02&&Math.abs(screen[1])<.02&&
     Math.hypot(...center.map((value,i)=>value-target[i]))<.1;
   },direction);
  }
  await palette.getByRole('button',{name:'Remove P1',exact:true}).click();
  const screen=await page.evaluate(({x,z})=>window.__sensoryStudio.fittingPointScreen(x,z,'top'),hole);
  assert(screen,type+' projects the solid face at the fitted point');
  await page.mouse.dblclick(screen.x,screen.y);
  await fittingActions.waitFor();
  const add=fittingActions.getByRole('button',{name:'Add pixel',exact:true});
  if(await add.isDisabled()){
   assert.match(await fittingActions.innerText(),/vertical through-bore/,type+' explains unsupported surface');
   await page.keyboard.press('Escape');
   assert.equal((await getHoles()).length,0);
   await palette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  }else{
   await add.click();
   const [placed]=await getHoles();
   assert.equal(placed.entryFace,'top',type+' retains the clicked face');
   assert.equal(placed.diameter,hole.diameter,type+' retains the chosen profile');
   assert(Math.hypot(placed.x-hole.x,placed.z-hole.z)<1,type+' follows the raycast point');
  }
  await shot('wt019-native-'+type);
 };
 // WT-017: measured profiles are available before placement and reused on
 // multiple families. The existing A-G dimensional editor remains canonical.
 await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{flowStyle:'Parallel',dualMaterial:false},'Pixel profile source'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const wavePalette=page.locator('.sms-palette');
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 assert(await page.locator('#pixelProfileOverlay').isVisible());
 await page.locator('#pixelName').fill('Reusable 4.5 mm seed');
 await page.locator('#pixelBodyDiameter').fill('4.5');
 await page.locator('#pixelBodyHeight').fill('9');
 await page.locator('#pixelFlangeDiameter').fill('5');
 await page.locator('#pixelFlangeHeight').fill('0.8');
 await page.locator('#pixelCapHeight').fill('1.5');
 await page.locator('#pixelWireWidth').fill('1.4');
 await page.locator('#pixelWireDepth').fill('1.2');
 const replica=await useDownload(page.locator('#pixelReplicaSTL'));
 assert.match(replica.name,/^pixel-replica-.*-1to1\.stl$/);
 const count=replica.bytes.readUInt32LE(80),bounds=[[Infinity,-Infinity],[Infinity,-Infinity],[Infinity,-Infinity]];
 for(let triangle=0;triangle<count;triangle++)for(let vertex=0;vertex<3;vertex++)for(let axis=0;axis<3;axis++){
  const value=replica.bytes.readFloatLE(96+triangle*50+vertex*12+axis*4);
  bounds[axis][0]=Math.min(bounds[axis][0],value);bounds[axis][1]=Math.max(bounds[axis][1],value);
 }
 assert.equal(replica.bytes.length,84+count*50);
 assert(Math.abs(bounds[2][1]-bounds[2][0]-9)<.01,'B is total length including the curved cap');
 const replica3mf=zipEntries((await useDownload(page.locator('#pixelReplica3MF'))).bytes);
 assert(replica3mf.has('3D/3dmodel.model'));
 await page.locator('#pixelSocketClearance').fill('0.25');
 const socket=await useDownload(page.locator('#pixelSocketSTL'));
 assert.equal(socket.name,'pixel-test-socket.stl');
 const socketCount=socket.bytes.readUInt32LE(80);
 assert.equal(socket.bytes.length,84+socketCount*50);
 let signedVolume=0;
 for(let i=0;i<socketCount;i++){
  const coordinates=Array.from({length:9},(_,axis)=>socket.bytes.readFloatLE(96+i*50+axis*4));
  const [ax,ay,az,bx,by,bz,cx,cy,cz]=coordinates;
  signedVolume+=(ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx))/6;
 }
 assert(Math.abs(signedVolume)>1000&&Math.abs(signedVolume)<32*32*15,'The exported block retains stock and loses cavity volume');
 assert(zipEntries((await useDownload(page.locator('#pixelSocket3MF'))).bytes).has('3D/3dmodel.model'));
 const routedSpecimen=await useDownload(page.locator('#routeSpecimenSTL'));
 assert.equal(routedSpecimen.name,'two-pixel-route-test.stl');
 assert.equal(routedSpecimen.bytes.length,84+50*routedSpecimen.bytes.readUInt32LE(80));
 assert(zipEntries((await useDownload(page.locator('#routeSpecimen3MF'))).bytes).has('3D/3dmodel.model'));
 await page.locator('#applyPixelSocketFit').click();
 await wavePalette.getByRole('button',{name:/Reusable 4.5 mm seed/}).waitFor();
 await wavePalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].diameter),4.5);
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.25);
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 assert.equal(Number(await page.locator('#pixelSocketClearance').inputValue()),.25);
 await page.locator('#pixelSocketClearance').fill('0.35');
 const recalibratedReplica=await useDownload(page.locator('#pixelReplicaSTL'));
 assert.deepEqual(recalibratedReplica.bytes,replica.bytes,'Profile clearance never changes the positive replica');
 await page.locator('#applyPixelSocketFit').click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.35);
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 await page.locator('#resetPixelSocketClearance').click();
 assert.equal(Number(await page.locator('#pixelSocketClearance').inputValue()),.15);
 await page.keyboard.press('Escape');
 const libraryFile=await useDownload(wavePalette.getByRole('button',{name:'Export pixel profiles'}));
 const library=JSON.parse(libraryFile.bytes.toString('utf8'));
 const exportedProfile=library.pixelProfiles.find(profile=>profile.name==='Reusable 4.5 mm seed');
 assert(exportedProfile,'The transferred library includes the current measured profile');
 const libraryInput=wavePalette.getByLabel('Import pixel profiles');
 const existingId=(await getHoles())[0].profileId;
 await libraryInput.setInputFiles({name:'pixel-profile-library.json',mimeType:'application/json',buffer:libraryFile.bytes});
 await page.getByRole('option',{name:'Reusable 4.5 mm seed',exact:true}).first().waitFor({state:'attached'});
 const collision={...library,pixelProfiles:[{...exportedProfile,wireWidth:exportedProfile.wireWidth+.2}]};
 await libraryInput.setInputFiles({name:'pixel-profile-library.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(collision))});
 const selector=wavePalette.locator('[data-active-pixel-profile]');
 const importedProfileOption=selector.locator('option').filter({hasText:'(imported copy)'});
 await importedProfileOption.waitFor({state:'attached'});
 const importedId=await importedProfileOption.getAttribute('value');
 assert.notEqual(importedId,existingId,'A conflicting profile is imported with an independent ID');
 assert.equal((await getHoles())[0].profileId,existingId,'Import leaves the installed fitting linked to its original profile');
 assert.equal((await getHoles())[0].clearance,.35);
 await shot('wt017-pixel-profile-build');
 // CAL-02: independently measure linked and locally captured fits before and after a library edit.
 const linkedModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{flowStyle:'Parallel',dualMaterial:false},'Local clearance witness'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await selector.selectOption({label:'Reusable 4.5 mm seed'});
 await wavePalette.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
 await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
 await wavePalette.getByText('Record measured fit',{exact:true}).click();
 const localFit=wavePalette.locator('[data-fit-calibration]');
 await localFit.locator('[name=printedBoreDiameter]').fill('4.85');
 await localFit.getByRole('button',{name:'Save measured fit'}).click();
 const localModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(localModel.build.pixelHoles[0].followProfileClearance,false);
 const switchFitModel=async id=>{
  await page.locator('[id="model-tab-'+id+'"]').click();
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
 };
 const checkFitDownloads=async(model,diameter)=>{
  await switchFitModel(model.id);
  await page.locator('.sms-workspace-nav [data-tab=print]').click();
  const job=page.locator('#smsJobs article').filter({hasText:model.name});
  if(!await job.count())await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  else if(await job.getByText('Stale',{exact:true}).count())await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const stl=await useDownload(job.locator('[data-job-stl]'));
  const mf=await useDownload(job.locator('[data-job-3mf]'));
  const {x,z}=model.build.pixelHoles[0];
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
   read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const width=[-1,1].reduce((sum,sign)=>sum+new THREE.Raycaster(
    new THREE.Vector3(x,-z,1),new THREE.Vector3(sign,0,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width-diameter)<.02,model.name+' exported '+width+' mm');
   geometry.dispose();
  }
  material.dispose();
 };
 await checkFitDownloads(linkedModel,4.85);
 await checkFitDownloads(localModel,4.85);
 await switchFitModel(linkedModel.id);
 await selector.selectOption({label:'Reusable 4.5 mm seed'});
 await wavePalette.getByRole('button',{name:'Create / edit pixel profile'}).click();
 await page.locator('#pixelSocketClearance').fill('.6');
 await page.locator('#applyPixelSocketFit').click();
 const savedFitModels=()=>page.evaluate(()=>window.__sensoryStudio.project.models);
 const fits=await savedFitModels();
 assert.equal(fits.find(model=>model.id===linkedModel.id).build.pixelHoles[0].clearance,.6);
 assert.deepEqual(fits.find(model=>model.id===localModel.id).build,localModel.build);
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const staleFitJob=page.locator('#smsJobs article').filter({hasText:linkedModel.name});
 await staleFitJob.getByText('Stale',{exact:true}).waitFor();
 assert(await staleFitJob.locator('[data-job-stl]').isDisabled());
 assert(await staleFitJob.locator('[data-job-3mf]').isDisabled());
 await checkFitDownloads(linkedModel,5.1);
 await checkFitDownloads(localModel,4.85);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();
 await page.waitForFunction(()=>window.__sensoryStudio);
 const reloadedFits=await savedFitModels();
 assert.equal(reloadedFits.find(model=>model.id===linkedModel.id).build.pixelHoles[0].clearance,.6);
 assert.deepEqual(reloadedFits.find(model=>model.id===localModel.id).build,localModel.build);
 await switchFitModel(linkedModel.id);
 await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
 await checkNativeDoubleClick('waves',wavePalette,(await getHoles())[0]);
 const nativeFamilies=[
  ['tactile-tiles',{dualMaterial:false},false],
  ['gears',{mode:'Decorative',wheelStyle:'Rounded lobes',webStyle:'Solid',bore:0,spokes:0,dualMaterial:false},false],
  ['control-caps',{shaft:0,controlStyle:'Pushbutton',dualMaterial:false},false],
  ['characters',{character:'Cloud',construction:'Classic',dualMaterial:false},false],
  ['light-pods',{illuminated:false,dualMaterial:false},true]
 ];
 for(const [type,parameters,backing] of nativeFamilies){
  await page.evaluate(({type,parameters})=>window.__sensoryStudio.addModel(type,parameters,'WT017 '+type),{type,parameters});
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const pal=page.locator('.sms-palette');
  assert(await pal.getByRole('button',{name:'Add pixel automatically',exact:true}).isVisible(),type+' has Add pixel');
  assert(await pal.getByRole('button',{name:'Create / edit pixel profile'}).isVisible());
  const activeProfile=pal.getByLabel('Active Pixel Profile');
  await activeProfile.selectOption({label:'Reusable 4.5 mm seed'});
  const activeProfileId=await activeProfile.inputValue();
  if(type==='tactile-tiles'){
   await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
   await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   assert.equal(await activeProfile.inputValue(),activeProfileId);
  }
  if(backing)await pal.locator('[data-pixel-backing]').check();
  await pal.getByRole('button',{name:'Add pixel automatically',exact:true}).click();
  const saved=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  assert.equal(saved.length,1,type+' accepted a measured fitting');
  assert.equal(saved[0].diameter,4.5,type+' reused named profile');
  assert(await pal.locator('[data-native-route]').count(),type+' shows routing availability');
  await checkNativeDoubleClick(type,pal,saved[0]);
 }
 // WT-020: true double-click mount placement, edit and persisted source.
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{pattern:'grass',dualMaterial:false},'WT020 native mounting'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 const mountPalette=page.locator('.sms-palette');
 assert(await mountPalette.getByRole('button',{name:'Place mounting hole in 3D'}).isVisible());
 await page.locator('[data-view=top]').click();await page.waitForTimeout(400);
 const mountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(10,8,'top'));
 assert(mountPoint,'Tile should provide a visible mountable solid surface');
 await page.mouse.dblclick(mountPoint.x,mountPoint.y);
 const addMount=fittingActions.getByRole('button',{name:'Add mounting feature',exact:true});
 await addMount.waitFor();
 assert(!(await addMount.isDisabled()),'Selected tile solid surface must support mounting');
 await addMount.click();
 const mounted=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles);
 assert.equal(mounted.length,1,'Context click commits exactly one M1');
 assert.equal(mounted[0].diameter,3.4);
 assert.equal(mounted[0].entryFace,'top');
 const mountX=mountPalette.locator('[data-mount-field=x]');
 assert(await mountPalette.getByRole('button',{name:'M1',exact:true}).isVisible());
 await mountX.fill(String(mounted[0].x+1));await mountX.press('Tab');
 const changed=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles);
 assert.equal(changed[0].x,mounted[0].x+1,'M1 supports precise position editing');
 const dragPoints=await page.evaluate(({x,z})=>{
  const studio=window.__sensoryStudio;
  return [studio.fittingPointScreen(x,z,'top'),studio.fittingPointScreen(x+4,z,'top')];
 },changed[0]);
 assert(dragPoints.every(Boolean),'Both drag positions lie on the Tile’s top surface');
 await page.mouse.move(dragPoints[0].x,dragPoints[0].y);
 await page.mouse.down();
 await page.waitForTimeout(225);
 await page.mouse.move(dragPoints[1].x,dragPoints[1].y,{steps:6});
 await page.mouse.up();
 const dragged=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0]);
 assert(dragged.x>changed[0].x+2,'Hold drag moves M1 along the solid face');
 assert.equal(dragged.entryFace,'top');
 await mountPalette.locator('[data-pixel-backing]').check();
 const backingThickness=mountPalette.getByLabel('Fitting backing thickness (mm)');
 assert.equal(await backingThickness.inputValue(),'4');
 await backingThickness.fill('11');await backingThickness.press('Tab');
 assert.equal(await backingThickness.inputValue(),'4','Rejects backing beyond the printable setting range');
 await backingThickness.fill('8');await backingThickness.press('Tab');
 assert.equal(await backingThickness.inputValue(),'8');
 await mountPalette.getByRole('button',{name:'Reset backing thickness'}).click();
 assert.equal(await backingThickness.inputValue(),'4');
 await backingThickness.fill('8');await backingThickness.press('Tab');
 const addTab=mountPalette.getByRole('button',{name:'Add external tab',exact:true});
 await addTab.click();await addTab.click();
 const tabPosition=mountPalette.locator('[data-backing-tab="0"]');
 await tabPosition.fill('13');await tabPosition.press('Tab');
 const savedTabs=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs);
 assert.equal(savedTabs.length,2);
 assert.equal(savedTabs[0].u,.13);
 await shot('wt021-native-backing-tabs');
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal((await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles))[0].x,dragged.x,
  'Native mounting state must survive workspace reload');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'M1',exact:true}).isVisible());
 assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),savedTabs);
 assert.equal(await backingThickness.inputValue(),'8','Fitting backing thickness survives save and reload');
 const dimensions=page.locator('#smsModelDimensions');
 await dimensions.filter({hasText:'Design preview'}).waitFor();
 await page.getByRole('button',{name:'Render actual model',exact:true}).click();
 const tabInspection=page.locator('#smsLightInspector');
 await tabInspection.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
 assert.equal(await tabInspection.getByLabel('Cut section').isChecked(),false);
 await dimensions.filter({hasText:'Prepared'}).waitFor();
 const displayedDimensions=(await dimensions.textContent()).match(/\d+\.\d+/g).map(Number);
 assert.equal(displayedDimensions.length,3);
 await tabInspection.getByRole('button',{name:'Close inspection'}).click();
 await page.locator('.sms-workspace-nav [data-tab=print]').click();
 const tabJob=page.locator('#smsJobs article');
 await tabJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
 const tabSTL=await useDownload(tabJob.locator('[data-job-stl]'));
 assert.match(tabSTL.name,/\.stl$/);
 const facetCount=tabSTL.bytes.readUInt32LE(80);
 assert(facetCount>0);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let facet=0;facet<facetCount;facet++)for(let vertex=0;vertex<3;vertex++)for(let axis=0;axis<3;axis++){
  const value=tabSTL.bytes.readFloatLE(84+facet*50+12+vertex*12+axis*4);
  min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
 }
 assert.deepEqual(displayedDimensions,max.map((value,i)=>Number((value-min[i]).toFixed(1))));
 const tileHalfWidth=await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width/2);
 const backingTop=(x,z)=>Math.abs(x)>tileHalfWidth+5&&Math.abs(z-8)<.001;
 let stlBackingTop=false;
 for(let facet=0;facet<facetCount;facet++)for(let vertex=0;vertex<3;vertex++){
  const offset=96+facet*50+vertex*12;
  if(backingTop(tabSTL.bytes.readFloatLE(offset),tabSTL.bytes.readFloatLE(offset+8)))stlBackingTop=true;
 }
 assert(stlBackingTop,'STL contains the edited 8 mm backing top outside the Tile footprint');
 const modelXml=zipEntries((await useDownload(tabJob.locator('[data-job-3mf]'))).bytes).get('3D/3dmodel.model');
 assert(modelXml);
 assert([...modelXml.toString().matchAll(/<vertex x="([^"]+)" y="[^"]+" z="([^"]+)"\/>/g)]
  .some(([,x,z])=>backingTop(Number(x),Number(z))),
  '3MF contains the same edited 8 mm backing top outside the Tile footprint');


 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal((await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles))[0].x,dragged.x,
  'Native mounting state must survive workspace reload');
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'M1',exact:true}).isVisible());

 await page.evaluate(()=>window.__sensoryStudio.addModel('crystals',null,'WT017 Crystals'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 assert(await page.locator('.sms-palette').getByRole('button',{name:'Add pixel',exact:true}).isVisible());
 assert(await page.locator('.sms-palette').getByRole('button',{name:'Create / edit pixel profile'}).isVisible());
 const crystalPitch=page.locator('.sms-palette [data-build-wire-pitch]');
 assert(await crystalPitch.isVisible(),'Crystal cable pitch is directly accessible beside pixel placement');
 await crystalPitch.selectOption('25');
 assert.equal(await page.locator('[data-state="pixelStringSpacing"]').inputValue(),'25');
 await page.locator('.sms-palette').getByRole('button',{name:'Add pixel',exact:true}).click();
 assert.equal(await page.locator('#viewport canvas').getAttribute('data-hardware-placement'),'pixel');
 await page.keyboard.press('Escape');
 await shot('wt017-seven-families-build');
 await page.setViewportSize({width:390,height:844});
 await page.locator('.sms-workspace-nav [data-tab=design]').click();
 assert(await page.locator('#smsModelRail #smsNew').isVisible());
 assert(await page.locator('#smsTools header button').isVisible());
 assert(await page.locator('#smsPrecision header button').isVisible());
 const bottomTabs=page.locator('#smsModelRail #smsTabs');
 assert(await bottomTabs.evaluate(node=>node.scrollWidth>node.clientWidth));
 const last=bottomTabs.getByRole('tab').last(),lastId=await last.getAttribute('id');
 await last.press('Alt+ArrowLeft');
 assert.equal(await bottomTabs.getByRole('tab').nth(-2).getAttribute('id'),lastId);
 await bottomTabs.locator('#'+lastId).press('Alt+ArrowRight');
 await bottomTabs.evaluate(node=>{node.scrollLeft=node.scrollWidth;});
 assert(await bottomTabs.evaluate(node=>node.scrollLeft>0));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1));
 await shot('wt014-narrow');
 for(const width of [1440,1280,768,390]){
  await page.setViewportSize({width,height:900});
  for(const capture of ['current','alternate']){
   if(capture==='alternate')await page.locator('#themeBtn').click();
   for(const [name,selector] of [
    ['design','.sms-workspace-nav [data-tab=design]'],
    ['build','.sms-workspace-nav [data-tab=build]'],
    ['library','#smsLibrary'],
    ['print','.sms-workspace-nav [data-tab=print]']
   ]){
    await page.locator(selector).click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' at '+width+' must not overflow');
    assert(await page.locator('#themeBtn').isVisible(),name+' keeps global actions visible');
    if(capture==='alternate'&&(width===390||width===1440))await shot('rc-'+name+'-'+width);
   }
   if(capture==='alternate')await page.locator('#themeBtn').click();
  }
 }
 const otherTab=await page.evaluate(key=>{
  const before=localStorage.getItem(key),saved=JSON.parse(before);
  saved.project.title='Newer saved workspace from another tab';
  const newer=JSON.stringify(saved);localStorage.setItem(key,newer);
  return {before,newer};
 },WORKSPACE_KEY);
 await nameProject('Unsaved edits in this tab');
 await page.locator('#smsSaveState').filter({hasText:'Save failed'}).waitFor();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),WORKSPACE_KEY),otherTab.newer);
 await page.evaluate(({key,before})=>localStorage.setItem(key,before),{key:WORKSPACE_KEY,before:otherTab.before});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import SVG',exact:true}).click();
 const importer=page.getByRole('dialog',{name:'Import SVG artwork'});
 const beforeImport=await page.evaluate(()=>window.__sensoryStudio.project.models.length);
 await importer.locator('input[type=file]').setInputFiles({
  name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg><path')
 });
 await importer.getByRole('status').filter({hasNotText:'Reading local artwork'}).waitFor();
 assert(await importer.getByRole('button',{name:'Create artwork model'}).isDisabled());
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.models.length),beforeImport);
 await importer.locator('input[type=file]').setInputFiles('tests/fixtures/svg-import/clockwork.svg');
 await importer.getByRole('img',{name:'Filled artwork preview'}).waitFor();
 await importer.getByLabel('Width (mm)').fill('72');
 await importer.getByLabel('Extrusion depth (mm)').fill('6');
 await shot('studio-svg-import');
 await importer.getByRole('button',{name:'Create artwork model'}).click();
 await importer.waitFor({state:'hidden'});
 const svgModel=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(svgModel.generator.typeId,'svg-artwork');
 assert.equal(svgModel.parameters.artwork.dimensions.widthMm,72);
 assert.equal(svgModel.parameters.artwork.loops.filter(loop=>loop.kind==='hole').length,5);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(model=>model.id===id)?.parameters.artwork.dimensions.depthMm,svgModel.id),6);
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import 3D model',exact:true}).click();
 const meshDialog=page.getByRole('dialog',{name:'Import 3D model'});
 const meshInput=meshDialog.locator('input[type=file]');
 const rawMesh="v 0 0 0\nv 40 0 0\nv 0 40 0\nv 0 0 24\nf 1 3 2\nf 1 2 4\nf 2 3 4\nf 3 1 4\n";
 const meshFile={name:'tetrahedron.obj',mimeType:'text/plain',buffer:Buffer.from(rawMesh)};
 await meshInput.setInputFiles(meshFile);
 await meshDialog.getByText('Confirm the units used by this mesh.').waitFor();
 await meshDialog.getByLabel('Source units').selectOption('mm');
 await meshDialog.getByRole('img',{name:'Top view of mesh on the print bed'}).waitFor();
 await meshDialog.getByLabel('Scale',{exact:true}).fill('1.2');
 await meshDialog.getByLabel('Bed X (mm)').fill('4');
 await shot('studio-mesh-import');
 const beforeMesh=await page.evaluate(()=>window.__sensoryStudio.project.models.length);
 await meshDialog.getByRole('button',{name:'Cancel',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.__sensoryStudio.project.models.length),beforeMesh);
 await page.locator('#smsNew').click();
 await page.getByRole('button',{name:'Import 3D model',exact:true}).click();
 await meshInput.setInputFiles(meshFile);
 await meshDialog.getByText('Confirm the units used by this mesh.').waitFor();
 await meshDialog.getByLabel('Source units').selectOption('mm');
 await meshDialog.getByLabel('Scale',{exact:true}).fill('1.2');
 await meshDialog.getByLabel('Bed X (mm)').fill('4');
 await meshDialog.getByRole('button',{name:'Add model',exact:true}).click();
 const imported=await page.evaluate(()=>window.__sensoryStudio.currentModel);
 assert.equal(imported.generator.typeId,'imported-mesh');
 assert.equal(imported.parameters.scale,1.2);
 assert.equal(imported.parameters.x,4);
 await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
 await page.reload();await page.waitForFunction(()=>window.__sensoryStudio);
 assert.equal(await page.evaluate(id=>window.__sensoryStudio.project.models.find(model=>model.id===id)?.parameters.x,imported.id),4);
 // Direct placement validates with the same worker as Print Centre before saving.
 for(const thickness of [25,3]){
  await page.evaluate(thickness=>window.__sensoryStudio.addModel('gears',{
   diameter:120,bore:0,thickness,wheelStyle:'Cam',webStyle:'Solid',dualMaterial:false
  },'Direct socket '+thickness),thickness);
  if(thickness===25){
   await page.locator('.sms-workspace-nav [data-tab=design]').click();
   await page.locator('.sms-palette [data-palette-key=diameter]').press('ArrowLeft');
   assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.diameter)<120);
  }
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile="gumdrop"]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const target=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'top'));
  assert(target);
  await page.mouse.click(target.x,target.y);
  if(thickness===25){
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
   const [socket]=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
   assert(socket.socketProfile.bodyHeight>0);
   assert(socket.surface.normal[1]>.999);
   assert.equal(socket.entryFace,'top');
   // FIT-02: enabling a diagnostic overlay must never change saved model data.
   const gearStateBefore=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   const nativeToggle=page.getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
   await nativeToggle.check();
   const nativePreview=page.locator('[data-native-fit-preview-status]');
   await page.waitForFunction(()=>/insertion|unavailable/.test(
    document.querySelector('[data-native-fit-preview-status]')?.textContent||''),null,{timeout:60000});
   assert.match(await nativePreview.innerText(),/insertion 22\.00 mm/,
    'Gear preview: '+await nativePreview.innerText());
   assert.match(await nativePreview.innerText(),/nominal cutter roof allowance .*mm/);
   assert.match(await nativePreview.innerText(),/stock interference; 0\.00 mm³ overlap with wire cuts/);
   await nativeToggle.uncheck();
   assert.equal(await nativePreview.innerText(),'');
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),gearStateBefore,
    'Toggling Gear physical overlays must not mutate fittings, dimensions or saved model revision');
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
   const conflict=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(4,0,'top'));
   assert(conflict);
   await page.mouse.click(conflict.x,conflict.y);
   await page.locator('[data-pixel-status]').filter({hasText:/lacks clearance from another cut/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),gearStateBefore,
    'Rejected adjacent shaped socket must preserve the original fitting and model revision');
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===1);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),[socket],
    'The original fitting and installation normal must survive reload after a rejected placement');
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await page.locator('[data-view=top]').click();
   await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
   await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
   const safePoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(33,0,'top'));
   assert(safePoint);
   await page.mouse.click(safePoint.x,safePoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===2);
   await page.keyboard.press('Escape');
   const originalSecond=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[1]);
   const acceptedDrag=await page.evaluate(id=>[
    window.__sensoryStudio.pixelMarkerScreen(id),window.__sensoryStudio.fittingPointScreen(37,0,'top')
   ],originalSecond.id);
   assert(acceptedDrag.every(Boolean));
   await page.mouse.move(acceptedDrag[0].x,acceptedDrag[0].y);
   await page.mouse.down();
   await page.waitForTimeout(225);
   await page.mouse.move(acceptedDrag[1].x,acceptedDrag[1].y,{steps:6});
   await page.mouse.up();
   await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[1].x>x+2,originalSecond.x);
   const prior=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
   const second=prior[1];
   const [start,end]=await page.evaluate(id=>[
    window.__sensoryStudio.pixelMarkerScreen(id),
    window.__sensoryStudio.fittingPointScreen(5,0,'top')
   ],second.id);
   assert(start&&end);
   await page.mouse.click(start.x,start.y);
   await page.mouse.move(start.x,start.y);
   await page.mouse.down();
   await page.waitForTimeout(225);
   await page.mouse.move(end.x,end.y,{steps:6});
   await page.mouse.up();
   await page.locator('[data-pixel-status]').filter({hasText:/lacks clearance from another cut/}).waitFor();
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),prior);
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===2);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles),prior,
    'Rejected drag preserves both fitted poses, orientations and installation normals after reload');
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   const gearPalette=page.locator('.sms-palette');
   for(const number of [1,2]){
    await gearPalette.getByRole('button',{name:'P'+number,exact:true}).click();
    const angle=gearPalette.locator('[data-pixel-field=rotation]');
    await angle.fill('180');
    await angle.press('Tab');
   }
   const gearSerial=gearPalette.getByRole('group',{name:'Serial LED string'});
   const cutSerial=gearSerial.locator('[data-native-route]');
   assert(!(await cutSerial.isDisabled()),await gearSerial.innerText());
   await cutSerial.check();
   await gearSerial.getByText('Channels ready for preparation.').waitFor();
   await page.locator('[data-view=top]').click();
   await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
   await gearPalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
   const mountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(16,15,'top'));
   assert(mountPoint);
   await page.mouse.click(mountPoint.x,mountPoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
   await page.keyboard.press('Escape');
   const beforeConflict=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   await gearPalette.getByRole('button',{name:'M1',exact:true}).click();
   const mountZ=gearPalette.locator('[data-mount-field=z]');
   await mountZ.fill('0');
   await mountZ.press('Tab');
   await gearPalette.locator('[data-pixel-status]').filter({hasText:/too close to Mount hole 1/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeConflict,
    'Rejecting a mount that meets the channel preserves the route, mount and revision');
   await gearPalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
   const otherMountPoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(16,-15,'top'));
   assert(otherMountPoint);
   await page.mouse.click(otherMountPoint.x,otherMountPoint.y);
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===2);
   await page.keyboard.press('Escape');
   await gearPalette.getByRole('button',{name:'M2',exact:true}).click();
   const secondMountZ=gearPalette.locator('[data-mount-field=z]');
   await secondMountZ.fill('-16');
   await secondMountZ.press('Tab');
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-16);
   await gearPalette.locator('[data-pixel-backing]').check();
   const addExternalTab=gearPalette.getByRole('button',{name:'Add external tab',exact:true});
   await addExternalTab.click();
   await addExternalTab.click();
   for(const [index,position] of [13,63].entries()){
    const perimeter=gearPalette.locator('[data-backing-tab="'+index+'"]');
    await perimeter.fill(String(position));
    await perimeter.press('Tab');
   }
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
   await gearSerial.getByText('Channels ready for preparation.').waitFor();
   await gearPalette.getByRole('button',{name:'P1',exact:true}).click();
   await gearPalette.getByText('Record measured fit',{exact:true}).click();
   const calibration=gearPalette.locator('[data-fit-calibration]');
   await calibration.locator('[name=printedBoreDiameter]').fill('12.5');
   await calibration.getByRole('button',{name:'Save measured fit'}).click();
   const retention=gearPalette.getByLabel('Retention lip (mm)');
   await retention.fill('.2');await retention.press('Tab');
   await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].socketProfile.retentionLip===.2);
   const bendRadius=gearPalette.getByLabel('Minimum bend radius (mm)');
   await bendRadius.fill('5.5');await bendRadius.press('Tab');
   const wireWidth=gearPalette.getByLabel('Requested wire-track width (mm)');
   await wireWidth.fill('6');await wireWidth.press('Tab');
   const calibratedBuild=await page.evaluate(()=>window.__sensoryStudio.currentModel.build);
   assert.equal(calibratedBuild.serialRouting.channelWidthMm,6);
   assert.equal(calibratedBuild.serialRouting.minBendRadius,5.5);
   assert.equal(calibratedBuild.pixelHoles[0].clearance,.5);
   await page.locator('#smsProjectTitle').fill('WT-021 Gear manufacturing journey');
   await page.locator('#smsProjectTitle').press('Tab');
   await page.locator('#smsLibrary').click();
   await page.locator('#smsSaveProject').click();
   await page.locator('#smsSavedProjects').getByRole('heading',{name:'WT-021 Gear manufacturing journey',exact:true}).waitFor();
   const gearBackup=JSON.parse((await useDownload(page.locator('#smsBackup'))).bytes.toString());
   assert.deepEqual(gearBackup.project.models.find(model=>model.name==='Direct socket 25').build,calibratedBuild);
   await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
   await page.reload();
   await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.serialRouting?.enabled);
   assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build),calibratedBuild);
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
   await page.getByRole('button',{name:'Render actual model',exact:true}).click();
   const gearInspection=page.locator('#smsLightInspector');
   await gearInspection.getByText('Prepared manufacturing mesh').waitFor({timeout:120000});
   await gearInspection.getByLabel('Cut section').check();
   await gearInspection.getByRole('button',{name:'Close inspection'}).click();
   await page.locator('.sms-workspace-nav [data-tab=print]').click();
   const gearJob=page.locator('#smsJobs article').filter({hasText:'Direct socket 25'});
   await gearJob.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   const gearPack=zipEntries((await useDownload(gearJob.locator('[data-job-export]'))).bytes);
   assert([...gearPack.keys()].some(name=>name.endsWith('.stl')));
   assert.equal(JSON.parse(gearPack.get('print-job-manifest.json')).routing.channels.length,3);
   const gear3mf=zipEntries((await useDownload(gearJob.locator('[data-job-3mf]'))).bytes);
   assert(gear3mf.has('3D/3dmodel.model'));
   const gearSTL=[...gearPack.entries()].find(([name])=>name.endsWith('.stl'))[1];
   const standaloneSTL=await useDownload(gearJob.locator('[data-job-stl]'));
   assert.deepEqual(standaloneSTL.bytes,gearSTL);
   const standaloneCura=await useDownload(gearJob.locator('[data-job-cura]'));
   assert(standaloneCura.name.endsWith('.curaprofile'));
   assert.deepEqual(standaloneCura.bytes,[...gearPack.entries()].find(([name])=>name.endsWith('.curaprofile'))[1]);
   const [fitting]=calibratedBuild.pixelHoles;
   const mounts=calibratedBuild.manualMountHoles;
   const gearDiameter=gearBackup.project.models.find(model=>model.name==='Direct socket 25').parameters.diameter;
   const halfBacking=(gearDiameter+24)/2;
   const stlGeometry=new STLLoader().parse(Uint8Array.from(gearSTL).buffer);
   const threeMFGeometry=read3MFGeometry(gear3mf.get('3D/3dmodel.model').toString());
   for(const [format,geometry] of [['STL',stlGeometry],['3MF',threeMFGeometry]]){
    const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geometry,material);
    const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
    const centre=[fitting.x,-fitting.z,fitting.surface.y-5];
    const left=hit(centre,[-1,0,0]),right=hit(centre,[1,0,0]);
    assert(left&&right&&Math.abs(left.distanceTo(right)-12.5)<.02,format+' calibrated bore exported from Print Centre');
    const other=calibratedBuild.pixelHoles[1];
    const groove=[(fitting.x+other.x)/2,-(fitting.z+other.z)/2,fitting.surface.y-1];
    const grooveA=hit(groove,[0,-1,0]),grooveB=hit(groove,[0,1,0]);
    assert(grooveA&&grooveB&&Math.abs(grooveA.distanceTo(grooveB)-6)<.04,format+' actual routed wire width is independent of fit calibration');
    for(const mount of mounts){
     assert.equal(hit([mount.x,-mount.z,-1],[0,0,1]),undefined,format+' routed project retains the mounting through-hole');
    }
    for(const sign of [-1,1]){
     const tabHoleX=sign*.04*halfBacking,tabHoleY=sign*(halfBacking+5.05);
     assert.equal(hit([tabHoleX,tabHoleY,-1],[0,0,1]),undefined,format+' external tab has a through-hole');
     const tabTop=hit([tabHoleX+2.5,tabHoleY,10],[0,0,-1]);
     assert(tabTop&&Math.abs(tabTop.z-4)<.01,format+' fixing walls are joined to the printed backing at 4 mm thickness');
    }
    material.dispose();geometry.dispose();
   }
  }else{
   await page.locator('[data-pixel-status]').filter({hasText:/continuous stock/}).waitFor();
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length??0),0);
  }
  await page.keyboard.press('Escape');
 }
 // FIT-01: place and drag a shaped fitting on a real vertical Tile face.
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{
   width:100,depth:80,thickness:20,outline:'square',relief:2,pattern:'terraces',dualMaterial:false
  },'FIT-01 Tile side'));
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
  assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width)>100);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.locator('[data-view=front]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile=seed]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const canvas=await page.locator('#viewport canvas').boundingBox();
  await page.mouse.click(canvas.x+canvas.width/2,canvas.y+canvas.height/2+28);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1);
  await page.keyboard.press('Escape');
  const getSeat=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0]);
  const seat=await getSeat();
  assert.deepEqual(seat.surface.normal,[0,0,1]);
  const marker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),seat.id);
  assert(marker);
  await page.mouse.move(marker.x,marker.y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(marker.x+25,marker.y,{steps:6});
  assert.deepEqual(await getSeat(),seat,'A side drag previews without changing the saved seat');
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x>x+1,seat.x);
  const moved=await getSeat();
  assert.equal(moved.id,seat.id);
  assert(Math.abs(moved.z-seat.z)<1e-6);
  assert.deepEqual(moved.surface.normal,seat.surface.normal);
  await page.locator('#smsSaveState').filter({hasText:'Saved locally'}).waitFor();
  await page.reload();
  await page.waitForFunction(()=>window.__sensoryStudio?.currentModel?.build.pixelHoles?.length===1);
  assert.deepEqual(await getSeat(),moved);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.locator('[data-view=front]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const sideMarker=await page.evaluate(id=>window.__sensoryStudio.pixelMarkerScreen(id),moved.id);
  await page.mouse.click(sideMarker.x+125,sideMarker.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===2);
  await page.keyboard.press('Escape');
  const sideSerial=page.locator('.sms-palette').getByRole('group',{name:'Serial LED string'});
  const enable=sideSerial.locator('[data-native-route]');
  assert(!(await enable.isDisabled()),await sideSerial.innerText());
  await enable.check();
  await sideSerial.getByText('Channels ready for preparation.').waitFor();
  const sidePalette=page.locator('.sms-palette');
  await sidePalette.locator('[data-pixel-backing]').check();
  const addTab=sidePalette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [12,75].entries()){
   const perimeter=sidePalette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.12},{u:.75}]);
  const beforeBacking=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  const thickness=sidePalette.getByLabel('Fitting backing thickness (mm)');
  await thickness.fill('10');
  await thickness.press('Tab');
  await sidePalette.locator('[data-pixel-status]').filter({hasText:/above the fitting backing/}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeBacking);
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await sidePalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-20,20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-10,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const mountZ=sidePalette.locator('[data-mount-field=z]');
  await mountZ.fill('-12');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-12);
  await sidePalette.getByRole('button',{name:'P1',exact:true}).click();
  await sidePalette.getByText('Record measured fit',{exact:true}).click();
  const calibration=sidePalette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.5');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.5);
  const {parameters,build,geometries}=await finishNativeJourney('FIT-01 Tile side');
  const [a,b]=build.pixelHoles;
  const width=parameters.width+24,depth=parameters.depth+24;
  const tabHoles=[[-width/2+.12*2*(width+depth),depth/2+5.05],[-depth/2,-depth/2-5.05]];
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const bore=[a.x,-a.z+4,a.surface.y];
   const left=hit(bore,[-1,0,0]),right=hit(bore,[1,0,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.5)<.02,format+' calibrated seed socket in the vertical wall');
   const route=[(a.x+b.x)/2,-a.z+.8,(a.surface.y+b.surface.y)/2];
   const lower=hit(route,[0,0,-1]),upper=hit(route,[0,0,1]);
   assert(lower&&upper&&Math.abs(lower.distanceTo(upper)-3.2)<.03,format+' routing survives calibrated fit and backing edits');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined);
   for(const [x,y] of tabHoles){
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,format+' external tab fixing hole cuts through');
    assert(Math.abs((hit([x+2.5,y,10],[0,0,-1])?.z??0)-4)<.01,format+' external backing tab is 4 mm thick');
   }
   material.dispose();geometry.dispose();
  }
 }
 // FIT-01/FIT-03: confirmed curved Wave seats and a surface-following wired export.
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{
   width:160,depth:100,thickness:15,amplitude:1,frequency:.5,variation:0,direction:0,dualMaterial:false
  },'FIT-03 gentle Wave'));
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key=width]').press('ArrowRight');
  assert(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.width)>160);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await page.locator('[data-fit-profile=seed]').click();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const getSeats=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  for(const [index,x] of [-40,-20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(count=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===count,index+1);
  }
  await page.keyboard.press('Escape');
  const seats=await getSeats();
  await page.locator('.sms-palette').getByRole('button',{name:'P1',exact:true}).click();
  const dragPoints=await page.evaluate(id=>[
   window.__sensoryStudio.pixelMarkerScreen(id),window.__sensoryStudio.fittingPointScreen(-44,0,'top')
  ],seats[0].id);
  assert(dragPoints.every(Boolean));
  await page.mouse.move(dragPoints[0].x,dragPoints[0].y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(dragPoints[1].x,dragPoints[1].y,{steps:6});
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[0].x<x-2,seats[0].x);
  const beforeConvexFit=await getSeats();
  await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
  const curvedFailure=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(40,0,'top'));
  assert(curvedFailure);
  await page.mouse.click(curvedFailure.x,curvedFailure.y);
  await page.locator('.sms-palette [data-pixel-status]').filter({hasText:/continuous stock/}).waitFor();
  await page.keyboard.press('Escape');
  assert.deepEqual(await getSeats(),beforeConvexFit);
  assert(seats.every(hole=>Math.abs(hole.surface.normal[0])>.005));
  assert.notDeepEqual(seats[0].surface.normal,seats[1].surface.normal);
  const wavePalette=page.locator('.sms-palette');
  for(const number of [1,2]){
   await wavePalette.getByRole('button',{name:'P'+number,exact:true}).click();
   const angle=wavePalette.locator('[data-pixel-field=rotation]');
   await angle.fill('180');
   await angle.press('Tab');
  }
  const waveSerial=wavePalette.getByRole('group',{name:'Serial LED string'});
  const machine=waveSerial.locator('[data-native-route]');
  assert(!(await machine.isDisabled()),await waveSerial.innerText());
  await machine.check();
  await waveSerial.getByText('Channels ready for preparation.').waitFor();
  await wavePalette.locator('[data-pixel-backing]').check();
  const addTab=wavePalette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [13,63].entries()){
   const perimeter=wavePalette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
  await wavePalette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-20,20].entries()){
   const target=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-20,'top'),x);
   assert(target);
   await page.mouse.click(target.x,target.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const mountZ=wavePalette.locator('[data-mount-field=z]');
  await mountZ.fill('-22');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-22);
  await wavePalette.getByRole('button',{name:'P1',exact:true}).click();
  await wavePalette.getByText('Record measured fit',{exact:true}).click();
  const calibration=wavePalette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.4');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles[0].clearance),.4);
  const {parameters,build,geometries}=await finishNativeJourney('FIT-03 gentle Wave');
  const [a,b]=build.pixelHoles;
  const width=parameters.width+24,depth=parameters.depth+24;
  const tabX=-width/2+.13*2*(width+depth);
  const tabY=depth/2+5.05;
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const [nx,ny,nz]=a.surface.normal;
   const bore=[a.x-4*nx,-a.z+4*nz,a.surface.y-4*ny];
   const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.4)<.02,format+' calibrated seat follows the curved face normal');
   const route=[(a.x+b.x)/2,-(a.z+b.z)/2,(a.surface.y+b.surface.y)/2-1];
   const first=hit(route,[0,-1,0]),last=hit(route,[0,1,0]);
   assert(first&&last&&Math.abs(first.distanceTo(last)-3.2)<.03,format+' Wave routing retains its width');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined);
   for(const sign of [-1,1]){
    const x=sign*tabX,y=sign*tabY;
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,format+' Wave tab fixing hole cuts through');
    assert(Math.abs((hit([x+2.5,y,10],[0,0,-1])?.z??0)-4)<.01,format+' Wave backing tab retains 4 mm of stock');
   }
   material.dispose();geometry.dispose();
  }
 }
 // Independent stationary backed journeys. Each uses its own model, placement, calibration and actual files.
 const backedFamilies=[
  {type:'characters',name:'Layered Character',key:'width',source:{character:'Cloud',construction:'Layered',width:90,depth:8,dualMaterial:false}},
  {type:'light-pods',name:'Solid Beacon Pod',key:'width',source:{shellForm:'Beacon',illuminated:false,width:80,depth:68,height:32,dualMaterial:false}},
  {type:'control-caps',name:'Stationary Rotary Cap',key:'diameter',source:{controlStyle:'Rotary knob',shaft:0,diameter:70,height:19,dualMaterial:false}}
 ];
 const compactProfile='Measured compact backing pixel';
 for(const {type,name,key,source} of backedFamilies){
  await page.evaluate(({type,source,name})=>window.__sensoryStudio.addModel(type,source,name),{type,source,name});
  await page.locator('.sms-workspace-nav [data-tab=design]').click();
  await page.locator('.sms-palette [data-palette-key="'+key+'"]').press('ArrowRight');
  const shape=await page.evaluate(key=>window.__sensoryStudio.currentModel.parameters[key],key);
  assert(shape>source[key],name+' accepts a Design size edit');
  const {width:designX,depth:designY}=await page.evaluate(type=>{
   const {registry,currentModel}=window.__sensoryStudio;
   return registry.get(type).recipe(currentModel.parameters).bounds;
  },type);
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const palette=page.locator('.sms-palette');
  await palette.locator('[data-pixel-backing]').check();
  const thickness=palette.getByLabel('Fitting backing thickness (mm)');
  await thickness.fill('10');
  await thickness.press('Tab');
  assert.equal(await thickness.inputValue(),'10');
  if(type==='control-caps'){
   const moving=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
   await palette.getByRole('button',{name:'Add external tab',exact:true}).click();
   await palette.locator('[data-pixel-status]').filter({hasText:/Stationary display/}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),moving);
   await page.locator('.sms-workspace-nav [data-tab=design]').click();
   await palette.getByRole('button',{name:'Stationary display',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.parameters.knobInstallation),'Stationary display');
   await page.locator('.sms-workspace-nav [data-tab=build]').click();
  }
  if(type==='characters'){
   await palette.locator('[data-fit-profile=seed]').click();
   await palette.getByRole('button',{name:'Create / edit pixel profile'}).click();
   for(const [id,value] of Object.entries({pixelName:compactProfile,pixelBodyDiameter:'5',pixelBodyHeight:'6',
    pixelFlangeDiameter:'6',pixelFlangeHeight:'.5',pixelCapHeight:'1.2',pixelWireWidth:'2',pixelWireDepth:'1.5',pixelSocketClearance:'.25'}))
    await page.locator('#'+id).fill(value);
   await page.locator('#applyPixelSocketFit').click();
  }
  await palette.getByRole('button',{name:/Measured compact backing pixel/}).click();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const fitting=palette.getByRole('button',{name:'Place shaped socket in 3D'});
  await fitting.click();
  for(const [index,x] of [-15,15].entries()){
   const screen=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,0,'underside'),x);
   assert(screen);
   await page.mouse.click(screen.x,screen.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const seats=()=>page.evaluate(()=>window.__sensoryStudio.currentModel.build.pixelHoles);
  const [,second]=await seats();
  assert.equal(second.entryFace,'underside');
  assert.equal(second.socketProfile.bodyHeight,6);
  const beforeRetention=await seats();
  const retention=palette.getByLabel('Retention lip (mm)');
  await retention.fill('.4');await retention.press('Tab');
  await palette.locator('[data-pixel-status]').filter({hasText:/Cannot cut the selected retention lip/}).waitFor();
  assert.deepEqual(await seats(),beforeRetention);
  const drag=await page.evaluate(id=>[window.__sensoryStudio.pixelMarkerScreen(id),
   window.__sensoryStudio.fittingPointScreen(20,0,'underside')],second.id);
  assert(drag.every(Boolean));
  await page.mouse.move(drag[0].x,drag[0].y);
  await page.mouse.down();
  await page.waitForTimeout(225);
  await page.mouse.move(drag[1].x,drag[1].y,{steps:6});
  await page.mouse.up();
  await page.waitForFunction(x=>window.__sensoryStudio.currentModel.build.pixelHoles[1].x>x+2,second.x);
  const serial=palette.getByRole('group',{name:'Serial LED string'});
  const route=serial.locator('[data-native-route]');
  assert(!(await route.isDisabled()),await serial.innerText());
  await route.check();
  await serial.getByText('Channels ready for preparation.').waitFor();
  const addTab=palette.getByRole('button',{name:'Add external tab',exact:true});
  await addTab.click();
  await addTab.click();
  for(const [index,position] of [13,63].entries()){
   const perimeter=palette.locator('[data-backing-tab="'+index+'"]');
   await perimeter.fill(String(position));
   await perimeter.press('Tab');
  }
  assert.deepEqual(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.backingTabs),[{u:.13},{u:.63}]);
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  for(const [index,x] of [-8,8].entries()){
   const point=await page.evaluate(x=>window.__sensoryStudio.fittingPointScreen(x,-14,'underside'),x);
   assert(point);
   await page.mouse.click(point.x,point.y);
   await page.waitForFunction(n=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===n,index+1);
  }
  await page.keyboard.press('Escape');
  const mountZ=palette.locator('[data-mount-field=z]');
  const mounted=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await mountZ.fill('0');
  await mountZ.press('Tab');
  await palette.locator('[data-pixel-status]').filter({hasText:/too close to Mount hole/}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),mounted);
  await mountZ.fill('-16');
  await mountZ.press('Tab');
  assert.equal(await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].z),-16);
  await palette.getByRole('button',{name:'P1',exact:true}).click();
  await palette.getByText('Record measured fit',{exact:true}).click();
  const calibration=palette.locator('[data-fit-calibration]');
  await calibration.locator('[name=printedBoreDiameter]').fill('5.45');
  await calibration.getByRole('button',{name:'Save measured fit'}).click();
  assert.equal((await seats())[0].clearance,.45);
  const {build,geometries}=await finishNativeJourney(name);
  const [a,b]=build.pixelHoles;
  const width=designX+24,depth=designY+24;
  const tabX=-width/2+.13*2*(width+depth),tabY=depth/2+5.05;
  for(const [format,geometry] of geometries){
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(origin,direction)=>new THREE.Raycaster(new THREE.Vector3(...origin),new THREE.Vector3(...direction)).intersectObject(mesh)[0]?.point;
   const bore=[a.x,-a.z,3];
   const left=hit(bore,[0,-1,0]),right=hit(bore,[0,1,0]);
   assert(left&&right&&Math.abs(left.distanceTo(right)-5.45)<.02,name+' '+format+' calibrated 5.45 mm bore');
   const wiring=[(a.x+b.x)/2,-(a.z+b.z)/2,.8];
   const first=hit(wiring,[0,-1,0]),last=hit(wiring,[0,1,0]);
   assert(first&&last&&Math.abs(first.distanceTo(last)-3.2)<.03,name+' '+format+' independently retains 3.2 mm wire width');
   for(const hole of build.manualMountHoles)assert.equal(hit([hole.x,-hole.z,-1],[0,0,1]),undefined,name+' '+format+' manual through-hole');
   for(const sign of [-1,1]){
    const x=sign*tabX,y=sign*tabY;
    assert.equal(hit([x,y,-1],[0,0,1]),undefined,name+' '+format+' external tab through-hole');
    assert(Math.abs((hit([x+2.5,y,15],[0,0,-1])?.z??0)-10)<.01,name+' '+format+' connected outward tab is 10 mm thick');
   }
   material.dispose();geometry.dispose();
  }
  console.log(name+' manufacturing journey verified');
 }
 // FIT-02: actual Gear and Tile profile/cutter overlay UI parity.
 await page.evaluate(()=>window.__sensoryStudio.addModel('tactile-tiles',{
  pattern:'terraces',width:90,depth:90,thickness:20,relief:2,dualMaterial:false
 },'FIT-02 Tile underside'));
 await page.locator('.sms-workspace-nav [data-tab=build]').click();
 await page.locator('[data-view=bottom]').click();
 await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
 await page.getByRole('button',{name:'Place shaped socket in 3D'}).click();
 const tilePoint=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(0,0,'underside'));
 assert(tilePoint,'Tile fitting needs a physical underside');
 await page.mouse.click(tilePoint.x,tilePoint.y);
 await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.pixelHoles?.length===1,{timeout:120000});
 const tileStateBefore=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
 const tileToggle=page.getByRole('checkbox',{name:'Show physical pixels and socket cutters'});
 await tileToggle.check();
 const tilePreview=page.locator('[data-native-fit-preview-status]');
 await page.waitForFunction(()=>/insertion|unavailable/.test(
  document.querySelector('[data-native-fit-preview-status]')?.textContent||''),null,{timeout:60000});
 assert.match(await tilePreview.innerText(),/insertion 9\.00 mm/,
  'Tile preview: '+await tilePreview.innerText());
 assert.match(await tilePreview.innerText(),/stock interference; 0\.00 mm³ overlap with wire cuts/);
 await tileToggle.uncheck();
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),tileStateBefore,
  'Toggling Tile physical overlays must not mutate fittings, dimensions or saved model revision');
 await page.keyboard.press('Escape');
 // Edit a real recessed fixing, download both revisions and check that stale exports are blocked.
 {
  const witness='Recessed fixing witness';
  await page.evaluate(name=>window.__sensoryStudio.addModel('gears',{mode:'Decorative',wheelStyle:'Rounded lobes',
   webStyle:'Solid',diameter:100,thickness:10,bore:0,reliefStyle:'None',dualMaterial:false},name),witness);
  const buildTab=page.locator('.sms-workspace-nav [data-tab=build]');
  const printTab=page.locator('.sms-workspace-nav [data-tab=print]');
  await buildTab.click();
  const enabled=page.locator('[data-build=mounting]');
  await enabled.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await enabled.check();
  await page.locator('[data-build=mountStyle]').selectOption('Underside counterbores');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.mountStyle==='Underside counterbores');
  const diameter=page.locator('[data-build=holeDiameter]');
  await diameter.fill('4');await diameter.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.holeDiameter===4);
  const job=page.locator('#smsJobs article').filter({hasText:witness});
  const measureFixing=async expected=>{
   await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
   const stl=await useDownload(job.locator('[data-job-stl]'));
   const mf=await useDownload(job.locator('[data-job-3mf]'));
   const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
   for(const geometry of [new STLLoader().parse(Uint8Array.from(stl.bytes).buffer),
    read3MFGeometry(zipEntries(mf.bytes).get('3D/3dmodel.model').toString())]){
    const mesh=new THREE.Mesh(geometry,material);
    const hit=(x,y,z,dx,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(x,y,z),new THREE.Vector3(dx,dy,dz)).intersectObject(mesh)[0];
    for(const x of [-27.5,27.5]){
     const span=z=>[-1,1].reduce((sum,sign)=>sum+hit(x,0,z,0,sign,0).distance,0);
     assert(Math.abs(span(2)-expected)<.005);
     assert(Math.abs(span(.4)-expected*1.5)<.005);
     const shoulder=hit(x,expected*.625,-1,0,0,1).point.z;
     const top=hit(x,expected*.625,11,0,0,-1).point.z;
     assert(Math.abs(shoulder-1.4)<.005&&Math.abs(top-shoulder-8.6)<.005);
    }
    geometry.dispose();
   }
   material.dispose();
  };
  await printTab.click();
  await page.getByRole('button',{name:'Prepare current model',exact:true}).click();
  await measureFixing(4);
  await buildTab.click();
  await diameter.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  const prior=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await diameter.fill('9');await diameter.press('Tab');
  assert.equal(Number(await diameter.inputValue()),4);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),prior);
  await diameter.fill('5.05');await diameter.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.holeDiameter===5.05);
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  assert(await job.locator('[data-job-stl]').isDisabled());
  assert(await job.locator('[data-job-3mf]').isDisabled());
  await job.locator('[data-job-prepare]').click();
  await measureFixing(5.05);
  await buildTab.click();
  await enabled.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await enabled.uncheck();
  await page.locator('[data-view=bottom]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  const palette=page.locator('.sms-palette');
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  const point=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(-20,0,'underside'));
  assert(point);await page.mouse.click(point.x,point.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===1);
  await page.keyboard.press('Escape');
  await palette.locator('[data-mount-profile]').selectOption('Counterbore');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0].profile==='Counterbore');
  const depth=palette.locator('[data-mount-recess=recessDepth]');
  await depth.fill('3');await depth.press('Tab');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[0].recessDepth===3);
  const manualAccepted=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  await depth.fill('8.5');await depth.press('Tab');
  assert.equal(Number(await depth.inputValue()),3);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),manualAccepted);
  const {x,z}=JSON.parse(manualAccepted).build.manualMountHoles[0];
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const manualSTL=await useDownload(job.locator('[data-job-stl]'));
  const manualMF=await useDownload(job.locator('[data-job-3mf]'));
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
  for(const geometry of [new STLLoader().parse(Uint8Array.from(manualSTL.bytes).buffer),
   read3MFGeometry(zipEntries(manualMF.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const hit=(y,height,dy,dz)=>new THREE.Raycaster(new THREE.Vector3(x,y,height),new THREE.Vector3(0,dy,dz)).intersectObject(mesh)[0];
   assert(Math.abs(hit(-z,1,1,0).distance+hit(-z,1,-1,0).distance-5.1)<.01);
   assert(Math.abs(hit(-z,4,1,0).distance+hit(-z,4,-1,0).distance-3.4)<.01);
   assert(Math.abs(hit(-z+2,-1,0,1).point.z-3)<.01);
   geometry.dispose();
  }
  await buildTab.click();
  await page.locator('[data-view=top]').click();
  await page.waitForFunction(()=>window.__crystalForgeViewMetrics().settled);
  await palette.getByRole('button',{name:'Place mounting hole in 3D'}).click();
  const upper=await page.evaluate(()=>window.__sensoryStudio.fittingPointScreen(20,0,'top'));
  assert(upper);await page.mouse.click(upper.x,upper.y);
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles?.length===2);
  await page.keyboard.press('Escape');
  await palette.locator('[data-mount-profile]').selectOption('Countersink');
  await page.waitForFunction(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1].profile==='Countersink');
  const topMount=await page.evaluate(()=>window.__sensoryStudio.currentModel.build.manualMountHoles[1]);
  assert.equal(topMount.entryFace,'top');
  await printTab.click();
  await job.getByText('Stale',{exact:true}).waitFor();
  await job.locator('[data-job-prepare]').click();
  await job.getByText('Prepared',{exact:true}).waitFor({timeout:120000});
  const topSTL=await useDownload(job.locator('[data-job-stl]'));
  const topMF=await useDownload(job.locator('[data-job-3mf]'));
  for(const geometry of [new STLLoader().parse(Uint8Array.from(topSTL.bytes).buffer),
   read3MFGeometry(zipEntries(topMF.bytes).get('3D/3dmodel.model').toString())]){
   const mesh=new THREE.Mesh(geometry,material);
   const width=height=>[-1,1].reduce((sum,side)=>sum+new THREE.Raycaster(
    new THREE.Vector3(topMount.x,-topMount.z,height),new THREE.Vector3(0,side,0)).intersectObject(mesh)[0].distance,0);
   assert(Math.abs(width(9.3)-4.25)<.01);
   assert(Math.abs(width(8)-3.4)<.01);
   geometry.dispose();
  }
  material.dispose();
 }
 {
  await page.evaluate(()=>window.__sensoryStudio.addModel('waves',{width:100,depth:70,thickness:2,amplitude:1,variation:0},'Thin fixing witness'));
  await page.locator('.sms-workspace-nav [data-tab=build]').click();
  const mounting=page.locator('[data-build=mounting]');
  await mounting.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await mounting.check();
  const beforeFixing=await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel));
  const profile=page.locator('[data-build=mountStyle]');
  await profile.selectOption('Underside countersinks');
  await page.locator('#smsModelError').getByText(/needs continuous underside stock/).waitFor();
  assert.equal(await profile.inputValue(),'Through holes');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__sensoryStudio.currentModel)),beforeFixing);
 }
 assert.deepEqual(errors,[]);
 console.log('Unified Home, Design, Build, Library and Quick Print screenshots captured.');
}catch(error){
 console.error('Unified browser page errors:',errors);
 await fs.mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/unified-wt006-failure.png'});
 throw error;
}finally{await browser.close();}
