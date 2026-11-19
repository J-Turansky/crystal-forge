import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
const url=root+(root.includes('?')?'&':'?')+'legacy=1';
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Ready'),null,{timeout:45000});
 // Set an actual saved project with four physical pixels and deliberately
 // impossible cable spacing. This is input setup, not mocking route repair.
 await page.evaluate(()=>{
  const key='crystal-forge-v3',project=JSON.parse(localStorage.getItem(key));
  const s=project.settings;
  Object.assign(s,{baseType:'integrated',baseVault:false,hollowCrystals:false,mount:'None',
   cutSockets:true,lightingMode:'multi',pixelPlacement:'manual',pixelCount:4,
   pixelStringSpacing:5,wireInputTailLength:5,wireOutputTailLength:5,
   wireChannels:true,wireMode:'string',wireMinBendRadius:5,
   manualPixelHoles:[
    {id:'slow-p1',x:-16,z:-16,wireAngle:0},{id:'slow-p2',x:16,z:-16,wireAngle:0},
    {id:'slow-p3',x:-16,z:16,wireAngle:0},{id:'slow-p4',x:16,z:16,wireAngle:0}
   ]});
  localStorage.setItem(key,JSON.stringify(project));
 });
 await page.reload();
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Ready'),null,{timeout:45000});
 await page.locator('[data-tab="build"]').click();
 const lighting=page.locator('summary').filter({hasText:'Pixel lighting plan'});
 await lighting.waitFor({state:'visible'});
 if(!(await lighting.evaluate(summary=>summary.parentElement.open)))await lighting.click();
 const repair=page.locator('#wireRouteStatus').getByRole('button',{name:'Try automatic routing',exact:true});
 await repair.waitFor({timeout:10000});
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualPixelHoles);
 await repair.click({timeout:5000});
 // The previous synchronous solver could freeze the whole browser here.
 // The Help overlay must remain responsive DURING an expensive search.
 await page.locator('#helpBtn').click({timeout:3000});
 assert(await page.locator('#infoOverlay:not([hidden])').isVisible(),
  'Editor UI remains responsive while automatic routing runs in its worker');
 await page.locator('#closeInfo').click();
 await page.waitForFunction(()=>{
  const text=document.querySelector('#status')?.textContent||'';
  return /Routing fixed|No automatic route fits|Automatic routing stopped safely|Model changed during automatic routing/.test(text);
 },null,{timeout:12500});
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('crystal-forge-v3')).settings.manualPixelHoles);
 assert.deepEqual(after.map(p=>[p.id,p.x,p.z]),before.map(p=>[p.id,p.x,p.z]),
  'Auto repair must not move or corrupt physical pixel positions when impossible');
 await page.locator('#themeBtn').click({timeout:3000});
 assert(await page.locator('body.theme-light').count(),
  'Editor remains interactive after routing completes or times out');
 console.log('P0 automatic routing browser regression: no freeze, four-pixel unrouteable fixture and preserved source passed.');
}finally{await browser.close();}
