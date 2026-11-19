import {readOrganisation,ensureSnapshotIds,templateProject,mergeOrganisation} from '../studio-organisation.js';
import assert from 'node:assert/strict';
import {createProject,createModel,addModel} from '../studio-documents.js';
import {packStudioVault,unpackStudioVault,StudioVault,STUDIO_MANIFEST} from '../studio-vault.js';
const project=createProject({id:'test'});addModel(project,createModel({id:'model',name:'Tile',typeId:'tactile-tiles',thumbnail:'data:image/png;base64,abc'}));
const state={schemaVersion:1,project,library:[],savedProjects:[],legacyTemplates:[]};
const packed=await packStudioVault(state);assert(packed.assets.size>=3);
assert.deepEqual(await unpackStudioVault(packed.manifest,hash=>packed.assets.get(hash)),{...state,organisation:readOrganisation()});
await assert.rejects(()=>unpackStudioVault(packed.manifest,()=>({corrupt:true})),/integrity/);
const snapshot=ensureSnapshotIds([structuredClone(project)])[0];
state.savedProjects.push(snapshot);
state.organisation={
 version:1,collections:[{id:'farm',name:'Farm'}],
 items:{['project:'+snapshot.snapshotId]:{favorite:true,collectionIds:['farm']}},
 templates:[{id:'starter',name:'Starter',kind:'project',sourceId:snapshot.snapshotId}]
};
assert.deepEqual(mergeOrganisation(state.organisation,state.organisation),state.organisation);
assert.throws(()=>readOrganisation({...state.organisation,collections:[...state.organisation.collections,{id:'duplicate',name:'FARM'}]}),/Duplicate/);
const starter=templateProject(snapshot);
assert.notEqual(starter.id,snapshot.id);
assert.equal(starter.activeTab,snapshot.activeTab);
assert.deepEqual(starter.models,snapshot.models);
const files=new Map();let serial=0,failAssets=false;
const client={async request(path,options={}){path=path.replace('/contents/','');if(!options.method)return files.get(path)||null;
 const payload=JSON.parse(options.body);if(failAssets&&path!==STUDIO_MANIFEST)throw Error('offline');
 const old=files.get(path);if((old?.sha??null)!==(payload.sha??null))throw Error('SHA conflict');
 const file={sha:'sha-'+(++serial),content:payload.content};files.set(path,file);return {content:{sha:file.sha}};
}};
const vault=new StudioVault(client);await vault.push(state);assert.deepEqual(await vault.pull(),state);
const originalManifest=files.get(STUDIO_MANIFEST).content;const other=new StudioVault(client);
await assert.rejects(()=>other.push(state),/changed/);
const updated=structuredClone(state);updated.project.title='Another project';failAssets=true;
await assert.rejects(()=>vault.push(updated),/offline/);assert.equal(files.get(STUDIO_MANIFEST).content,originalManifest);
failAssets=false;await vault.push(updated);assert.deepEqual(await vault.pull(),updated);
console.log('Studio vault: separate hashed assets, complete round-trip, conflict refusal and interrupted-write recovery passed.');
