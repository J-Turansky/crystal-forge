import assert from 'node:assert/strict';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const browser=await chromium.launch({executablePath:process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE||undefined});
const url=process.env.CRYSTAL_FORGE_URL||'http://127.0.0.1:4321';
try{
 const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.locator('#smsHomeNew').click();
 await page.locator('#smsPicker [data-generator="waves"]').click();
 const help=page.locator('#helpBtn');
 await help.press('Enter');
 const dialog=page.getByRole('dialog',{name:/Crystal Forge.*Help/});
 const run=dialog.getByRole('button',{name:'Run browser checks'});
 const report=dialog.getByRole('link',{name:/Download browser report/});
 await run.press('Enter');
 assert.match(await dialog.locator('#studioDiagnosticResults').innerText(),/Studio initialized/);
 await page.context().setOffline(true);
 await run.press('Space');
 const results=dialog.locator('#studioDiagnosticResults');
 assert.match(await results.innerText(),/Browser reports it is offline/);
 assert.match(await results.innerText(),/Saving and backup integrity were not tested/);
 await mkdir('qa',{recursive:true});
 await page.screenshot({path:'qa/ux02-help-diagnostics-390.png'});
 const [download]=await Promise.all([page.waitForEvent('download'),report.press('Enter')]);
 assert.equal(download.suggestedFilename(),'crystal-forge-diagnostics.json');
 const data=JSON.parse(await readFile(await download.path(),'utf8'));
 assert.deepEqual(Object.keys(data),['version','checks']);
 assert.match(data.version,/^v\d+\.\d+\.\d+/);
 assert.deepEqual(data.checks,{
  studioInitialized:true,previewCanvasPresent:true,browserReportsOnline:false,
  webAssemblyExposed:true,workerApiExposed:true,localStorageReadable:true
 });
 await page.keyboard.press('Escape');
 assert.equal(await dialog.isVisible(),false);
 assert(await help.evaluate(el=>el===document.activeElement));
 console.log('Help diagnostics reflects offline state, downloads only allowlisted checks and restores focus.');
}finally{
 await browser.close();
}
