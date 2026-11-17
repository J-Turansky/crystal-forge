/* Sensory Model Studio document core. Pure ESM; no renderer or browser globals.
 * These records are authoritative editable source, never prepared mesh caches.
 */
export const SCHEMA_VERSION = 1;
export const WORKSPACE_KEY = 'sensory-model-studio-workspace-v1';
export const BACKUP_KEY = 'sensory-model-studio-pre-migration-v1';
export const LEGACY_KEYS = [
 'crystal-forge-v3', 'crystal-forge-project-library-v1',
 'crystal-forge-pixel-library', 'crystal-forge-project-templates-v1'
];
const copy = value => JSON.parse(JSON.stringify(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const requireValue = (test, message) => { if (!test) throw Error(message); };
const integer = n => Number.isSafeInteger(n) && n > 0;
const text = value => typeof value === 'string' && value.trim().length > 0;
export const newId = () => {
 if (!globalThis.crypto?.randomUUID) throw Error('Secure UUID support is required.');
 return globalThis.crypto.randomUUID();
};
// Stable sorting also makes the fingerprint insensitive to property insertion order.
export function canonical(value) {
 if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
 if (typeof value === 'number') {
  requireValue(Number.isFinite(value), 'Documents cannot contain non-finite numbers.');
  return JSON.stringify(value);
 }
 if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
 requireValue(object(value), 'Documents must contain JSON data only.');
 return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
}
export function validateModel(model) {
 requireValue(object(model) && model.schemaVersion === SCHEMA_VERSION, 'Unsupported model schema.');
 requireValue(text(model.id) && text(model.name), 'Model identity and name are required.');
 requireValue(object(model.generator) && text(model.generator.typeId) && integer(model.generator.typeVersion), 'Invalid generator identity.');
 requireValue(integer(model.revision), 'Invalid model revision.');
 for (const key of ['parameters', 'build', 'editableState', 'materials', 'overrides'])
  requireValue(object(model[key]), 'Missing model record: ' + key);
 if (model.link !== null) {
  requireValue(object(model.link) && text(model.link.sourceId) && integer(model.link.revision), 'Invalid linked revision.');
 }
 canonical(model);
 return model;
}
export function createModel({id = newId(), name, typeId, typeVersion = 1,
 parameters = {}, build = {}, editableState = {}, materials = {}, overrides = {},
 printerOverrides = null, source = null, thumbnail = null, now = new Date().toISOString()}) {
 return validateModel(copy({
  schemaVersion: SCHEMA_VERSION, id, name, generator: {typeId, typeVersion},
  revision: 1, createdAt: now, updatedAt: now, parameters, build, editableState,
  materials, overrides, printerOverrides, source, thumbnail, link: null
 }));
}
export function createProject({id = newId(), title = 'Untitled project', now = new Date().toISOString()} = {}) {
 return {schemaVersion: SCHEMA_VERSION, id, title, description: '', collections: [],
  models: [], tabs: [], activeTab: null, printer: {}, hardwareProfiles: [], materialProfiles: [],
  printJobs: [], migrationHistory: [], createdAt: now, updatedAt: now};
}
export function validateProject(project) {
 requireValue(object(project) && project.schemaVersion === SCHEMA_VERSION, 'Unsupported project schema.');
 requireValue(text(project.id) && text(project.title), 'Project identity and title are required.');
 for (const key of ['models', 'tabs', 'printJobs', 'migrationHistory'])
  requireValue(Array.isArray(project[key]), 'Invalid project list: ' + key);
 const ids = new Set();
 for (const model of project.models) {
  validateModel(model);
  requireValue(!ids.has(model.id), 'Duplicate model ID.');
  ids.add(model.id);
 }
 requireValue(new Set(project.tabs).size === project.tabs.length && project.tabs.every(id => ids.has(id)), 'Invalid tab identities.');
 requireValue(project.activeTab === null || project.tabs.includes(project.activeTab), 'Active tab is not open.');
 const jobs = new Set();
 for (const job of project.printJobs) {
  requireValue(text(job.id) && !jobs.has(job.id) && ids.has(job.modelId) && integer(job.revision), 'Invalid print-job identity.');
  jobs.add(job.id);
  requireValue(['queued', 'preparing', 'prepared', 'stale', 'failed', 'cancelled'].includes(job.status), 'Invalid print-job status.');
 }
 canonical(project);
 return project;
}
export function findModel(project, id) {
 const model = project.models.find(item => item.id === id);
 requireValue(model, 'Model not found: ' + id);
 return model;
}
export function addModel(project, model) {
 validateProject(project); validateModel(model);
 requireValue(!project.models.some(item => item.id === model.id), 'Model ID already exists.');
 project.models.push(copy(model)); openTab(project, model.id);
 return findModel(project, model.id);
}
export function openTab(project, id) {
 findModel(project, id);
 if (!project.tabs.includes(id)) project.tabs.push(id);
 project.activeTab = id;
}
export function closeTab(project, id) {
 const index = project.tabs.indexOf(id);
 if (index < 0) return;
 project.tabs.splice(index, 1);
 if (project.activeTab === id) project.activeTab = project.tabs[Math.min(index, project.tabs.length - 1)] ?? null;
}
export function reorderTabs(project, ids) {
 requireValue(ids.length === project.tabs.length && new Set(ids).size === ids.length &&
  ids.every(id => project.tabs.includes(id)), 'Reorder must contain exactly the open tabs.');
 project.tabs = [...ids];
}
export function duplicateModel(project, id, {newModelId = newId(), name, now = new Date().toISOString()} = {}) {
 const original = findModel(project, id);
 const duplicate = copy(original);
 Object.assign(duplicate, {id: newModelId, name: name ?? original.name + ' copy',
  revision: 1, link: null, createdAt: now, updatedAt: now});
 return addModel(project, duplicate);
}
export function modelFingerprint(model) {
 // Camera/selection/thumbnail and source revision metadata are deliberately excluded.
 return canonical({generator: model.generator, parameters: model.parameters, build: model.build,
  editableState: model.editableState, materials: model.materials, overrides: model.overrides,
  printerOverrides: model.printerOverrides});
}
export function editModel(project, id, changes, {now = new Date().toISOString()} = {}) {
 const model = findModel(project, id);
 requireValue(model.link === null, 'Create an independent variant or explicitly update the library source before editing a linked model.');
 const allowed = new Set(['name', 'parameters', 'build', 'editableState', 'materials', 'overrides', 'printerOverrides', 'thumbnail']);
 requireValue(object(changes) && Object.keys(changes).every(key => allowed.has(key)), 'Invalid model edit fields.');
 const next = validateModel({...copy(model), ...copy(changes)});
 if (canonical(next) === canonical(model)) return model;
 const fabricationChanged = modelFingerprint(next) !== modelFingerprint(model);
 next.revision = model.revision + 1; next.updatedAt = now;
 Object.assign(model, next); project.updatedAt = now;
 // Every job pins a source revision. Even a rename must not allow an old result
 // to attach to a new revision; a UI may explicitly requeue metadata-only edits.
 for (const job of project.printJobs.filter(job => job.modelId === id)) {
  job.status = 'stale'; job.requestId = null; job.preparedRevision = null;
 }
 if (fabricationChanged) model.thumbnail = null;
 return model;
}
export function queueModel(project, id, {jobId = newId(), overrides = {}} = {}) {
 const model = findModel(project, id);
 requireValue(!project.printJobs.some(job => job.id === jobId), 'Print-job ID already exists.');
 const job = {id: jobId, modelId: id, revision: model.revision, status: 'queued',
  overrides: copy(overrides), requestId: null, preparedRevision: null, error: null};
 project.printJobs.push(job);
 return job;
}
const findJob = (project, id) => {
 const job = project.printJobs.find(item => item.id === id);
 requireValue(job, 'Print job not found.');
 return job;
};
export function beginPreparation(project, jobId, requestId = newId()) {
 const job = findJob(project, jobId), model = findModel(project, job.modelId);
 requireValue(text(requestId), 'Preparation request ID required.');
 job.revision = model.revision; job.status = 'preparing'; job.requestId = requestId;
 job.preparedRevision = null; job.error = null;
 // Job overrides are snapshotted; changes to shared defaults never edit model geometry.
 return copy({jobId, modelId: model.id, revision: model.revision, requestId,
  model, printer: {...project.printer, ...model.printerOverrides, ...job.overrides}});
}
export function finishPreparation(project, ticket, {error = null} = {}) {
 const job = project.printJobs.find(item => item.id === ticket.jobId);
 const model = project.models.find(item => item.id === ticket.modelId);
 if (!job || !model || job.modelId !== ticket.modelId || job.status !== 'preparing' ||
  job.requestId !== ticket.requestId || job.revision !== ticket.revision || model.revision !== ticket.revision) return false;
 job.status = error ? 'failed' : 'prepared'; job.error = error ? String(error) : null;
 job.preparedRevision = error ? null : ticket.revision; job.requestId = null;
 return true;
}
export function cancelPreparation(project, jobId) {
 const job = findJob(project, jobId);
 job.status = 'cancelled'; job.requestId = null; job.preparedRevision = null;
}
export function canExport(project, jobId) {
 const job = findJob(project, jobId), model = findModel(project, job.modelId);
 return job.status === 'prepared' && job.preparedRevision === model.revision && job.revision === model.revision;
}
export function saveLibraryRevision(library, model, {expectedRevision = 0} = {}) {
 validateModel(model);
 requireValue(model.link === null, 'Save an independent variant, not an unresolved linked model.');
 const record = library.find(item => item.id === model.id);
 const latest = record?.versions.at(-1)?.revision ?? 0;
 requireValue(latest === expectedRevision, 'Library revision conflict; preserve both versions before retrying.');
 const saved = {revision: latest + 1, model: copy(model)};
 if (record) record.versions.push(saved);
 else library.push({id: model.id, versions: [saved]});
 return copy(saved);
}
export function insertLibraryModel(project, library, sourceId, {
 linked = false, revision = null, id = newId(), now = new Date().toISOString()
} = {}) {
 const source = library.find(item => item.id === sourceId);
 requireValue(source, 'Library source not found.');
 const version = revision === null ? source.versions.at(-1) : source.versions.find(v => v.revision === revision);
 requireValue(version, 'Library source revision not found.');
 const model = copy(version.model);
 Object.assign(model, {id, revision: 1, createdAt: now, updatedAt: now,
  link: linked ? {sourceId, revision: version.revision} : null});
 return addModel(project, model);
}
export function availableLinkedUpdate(model, library) {
 if (!model.link) return null;
 const latest = library.find(item => item.id === model.link.sourceId)?.versions.at(-1);
 return latest && latest.revision > model.link.revision ? copy(latest) : null;
}
export function breakLink(project, id) {
 findModel(project, id).link = null; // Geometry and the pinned contents do not change.
}
export function acceptLinkedUpdate(project, id, library, revision) {
 const model = findModel(project, id);
 requireValue(model.link, 'Model is not linked.');
 const source = library.find(item => item.id === model.link.sourceId);
 const version = source?.versions.find(item => item.revision === revision);
 requireValue(version, 'Requested source revision is unavailable.');
 requireValue(canonical(model.generator) === canonical(version.model.generator), 'Generator migration required before accepting this update.');
 const oldLink = copy(model.link);
 model.link = null;
 const next = version.model;
 try {
  editModel(project, id, {parameters: next.parameters, build: next.build, editableState: next.editableState,
   materials: next.materials, overrides: next.overrides, printerOverrides: next.printerOverrides});
  model.link = {sourceId: oldLink.sourceId, revision};
 } catch (error) {
  model.link = oldLink; throw error;
 }
}
export function exportProject(project) { return JSON.stringify(validateProject(project), null, 2); }
export function importProject(raw) { return validateProject(copy(typeof raw === 'string' ? JSON.parse(raw) : raw)); }
