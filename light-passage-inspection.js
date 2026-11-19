export const manualLightChecks = 'Verify openings and remaining walls in Cura layer view. Test-print and check LED fit, light transmission and strength physically.';

export function auditLightPassages({solid, crystals, mode, paths, skipped, probe, required, crystalPositions=new Map()}) {
 const counts = {clear:0, blocked:0, skipped:0, unknown:0, 'not requested':0};
 const outsideY = solid.boundingBox().min[1] - 1;
 let budget = 160;
 const rows = crystals.filter(crystal=>!crystal.hidden).map(crystal=>{
  const path = paths.get(crystal.id);
  let status = 'not requested', reason = 'Enable a light-passage mode to request an inspection.';
  if(mode==='hollow'){
   status = 'unknown'; reason = 'Shared hollowing does not define a verified source-to-spike route.';
  }else if(mode!=='none'){
   status = 'skipped'; reason = skipped.get(crystal.id)||'No eligible passage was cut for this crystal.';
   if(path){
    const [x,,z] = path.points[0];
    const points = [[x,outsideY,z], ...path.points];
    status = 'clear'; reason = 'No obstruction detected along the sampled route from the underside.';
    if(!path.access){status='blocked';reason='The intended source opening was not manufactured.';}
    else for(let index=1;index<points.length;index++){
     const from=points[index-1],to=points[index];
     const length=Math.hypot(...to.map((value,axis)=>value-from[axis]));
     if(length<.0001)continue;
     if(!Number.isFinite(length)||length>300||budget<=0){
      status='unknown';reason='The route exceeds the inspection limits.';break;
     }
     budget--;
     const volume=probe(from,to);
     if(!Number.isFinite(volume)){
      status='unknown';reason='One segment could not be sampled reliably.';break;
     }
     if(volume>.001){
      status='blocked';reason=index===1?'Material blocks access from the underside.':'Material crosses the intended passage.';break;
     }
    }
   }
  }
  counts[status]++;
  return {id:crystal.id,name:crystal.name||'Crystal '+crystal.id,status,reason,manufactured:!!path,source:path?.source||(mode==='hollow'?'Shared cavity':null),points:path?.points||null,crystalPosition:crystalPositions.get(crystal.id)||null};
 });
 return {schemaVersion:1,softwareSamplingOnly:true,physicalOpticalVerification:false,mode,counts,rows,
  settings:{requireAccessiblePassages:required===true},probe:{radiusMm:.2,maxSegments:160,maxSegmentMm:300,solidToleranceMm3:.001},
  limitations:'Only the intended centreline and underside entry are sampled. Other viable routes and remaining wall thickness are outside this check.',
  manualChecks:manualLightChecks};
}

export function lightPassageExportBlock(required,audit){
 if(required!==true)return '';
 if(!audit||audit.mode==='none'||!audit.rows.length)return 'Enable a light-passage mode with an accessible source, then prepare the current model.';
 const failed=audit.rows.filter(row=>row.status!=='clear');
 return failed.length?'Export blocked: '+failed.length+' crystal passage(s) need attention. Open Light Path Inspection for details.':'';
}

export function lightPassageReportEntries(audit){
 if(!audit)return [];
 return [
  ['03_Reports/light-passage-inspection.json',JSON.stringify(audit,null,2)],
  ['03_Reports/light-passage-inspection.txt',[
   'Light passage inspection (schema '+audit.schemaVersion+')','Software sampling only. Physical optical verification: no.',
   'Mode: '+audit.mode,'Prepared revision: '+(audit.modelRevision??audit.preparedFingerprint??'Unavailable'),
   ...audit.rows.map(row=>row.name+' ['+row.id+'] — '+row.status+' — '+(row.source||'Source unavailable')+' — '+row.reason),
   audit.limitations,audit.manualChecks
  ].join('\n')]
 ];
}
