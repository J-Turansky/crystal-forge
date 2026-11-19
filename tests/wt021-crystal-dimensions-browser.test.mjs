import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

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
}finally{await browser.close();}
