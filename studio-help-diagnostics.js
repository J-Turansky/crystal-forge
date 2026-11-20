function storageReadable(){
 try{return Number.isInteger(window.localStorage.length);}
 catch(error){
  if(error.name==='SecurityError')return false;
  throw error;
 }
}

const panel=document.getElementById('studioDiagnostics');
if(panel){
 const results=panel.querySelector('ul'),status=panel.querySelector('[role=status]'),download=panel.querySelector('a');
 let reportUrl;
 panel.querySelector('button').addEventListener('click',()=>{
  if(reportUrl)URL.revokeObjectURL(reportUrl);
  const checks={
   studioInitialized:!!window.__sensoryStudio,
   previewCanvasPresent:!!document.querySelector('#viewport canvas'),
   browserReportsOnline:navigator.onLine,
   webAssemblyExposed:typeof WebAssembly==='object',
   workerApiExposed:typeof Worker==='function',
   localStorageReadable:storageReadable()
  };
  const lines=[
   checks.studioInitialized?'Studio initialized.':'Studio has not initialized. Check your connection and reopen the Studio URL.',
   checks.previewCanvasPresent?'Preview canvas found.':'No preview canvas found. Reopen Studio if you expected a preview.',
   checks.browserReportsOnline?'Browser reports an online connection. Studio asset availability was not checked.':'Browser reports it is offline. Reconnect before retrying network operations.',
   checks.webAssemblyExposed?'WebAssembly API is available.':'WebAssembly API unavailable. Try a current browser with WebAssembly enabled.',
   checks.workerApiExposed?'Worker API is available.':'Worker API unavailable. Try a current browser that supports background workers.',
   checks.localStorageReadable?'Local browser storage can be read. Saving and backup integrity were not tested.':'Local browser storage is blocked. Check this site’s storage permissions before relying on autosave.'
  ];
  results.replaceChildren(...lines.map(line=>{
   const item=document.createElement('li');
   item.textContent=line;
   return item;
  }));
  results.hidden=false;
  const version=document.querySelector('.version')?.textContent.trim();
  reportUrl=URL.createObjectURL(new Blob([JSON.stringify({version,checks},null,2)],{type:'application/json'}));
  download.href=reportUrl;
  download.hidden=false;
  status.textContent='Browser checks complete. You can review or download the report.';
 });
 panel.hidden=false;
}
