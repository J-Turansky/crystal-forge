/* Additive legacy import. Reads all original keys before writing anything.
 * Never deletes or rewrites Crystal Forge data; failures remain recoverable.
 */
import {createModel, createProject, addModel, validateProject, canonical,
 WORKSPACE_KEY, BACKUP_KEY, LEGACY_KEYS} from './studio-documents.js';
const EPOCH = '1970-01-01T00:00:00.000Z';
function uuidFrom(value) {
 // Deterministic migration identity, not a security hash.
 const input = canonical(value), words = [];
 for (let salt = 0; salt < 4; salt++) {
  let hash = (2166136261 ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619) >>> 0;
  words.push(hash.toString(16).padStart(8, '0'));
 }
 const h = words.join('');
 return h.slice(0,8) + '-' + h.slice(8,12) + '-5' + h.slice(13,16) +
  '-a' + h.slice(17,20) + '-' + h.slice(20);
}
function crystalDocument(input, identity, name) {
 if (!input || !input.settings || typeof input.settings !== 'object' ||
  Array.isArray(input.settings) || !Array.isArray(input.crystals) ||
  input.crystals.some(item => !item || typeof item.id !== 'string'))
  throw Error('Legacy Crystal document is malformed. Originals have not been changed.');
 return createModel({id: uuidFrom(['legacy-crystal', identity]), name,
  typeId: 'crystals', parameters: input.settings,
  editableState: {crystals: input.crystals, selectedId: input.selectedId ?? null},
  source: {format: 'crystal-forge-v3', legacyId: identity},
  now: input.updatedAt || EPOCH});
}
export function migrateLegacySnapshot(snapshot) {
 const parse = key => snapshot[key] == null ? null : JSON.parse(snapshot[key]);
 const active = parse(LEGACY_KEYS[0]);
 const projects = parse(LEGACY_KEYS[1]) ?? [];
 const profiles = parse(LEGACY_KEYS[2]) ?? [];
 const templates = parse(LEGACY_KEYS[3]) ?? [];
 if (!Array.isArray(projects) || !Array.isArray(profiles) || !Array.isArray(templates))
  throw Error('Malformed legacy library. Originals have not been changed.');
 const project = createProject({id: uuidFrom(['legacy-workspace', snapshot]),
  title: 'Recovered Crystal Forge workspace', now: EPOCH});
 const library = [];
 if (active) addModel(project, crystalDocument(active, 'active', active.settings?.title || 'Recovered cluster'));
 const identities = new Set();
 for (let index = 0; index < projects.length; index++) {
  const entry = projects[index];
  if (!entry || typeof entry.id !== 'string' || identities.has(entry.id))
   throw Error('Legacy saved project identity is missing or duplicated.');
  identities.add(entry.id);
  const model = crystalDocument(entry, entry.id, entry.name || 'Recovered cluster ' + (index + 1));
  library.push({id: model.id, versions: [{revision: 1, model}]});
 }
 project.hardwareProfiles = JSON.parse(JSON.stringify(profiles));
 project.migrationHistory.push({from: 'crystal-forge-v3', to: 1, at: EPOCH});
 return {schemaVersion: 1, project: validateProject(project), library,
  legacyTemplates: JSON.parse(JSON.stringify(templates))};
}
export function migrateLegacyStorage(storage) {
 const existing = storage.getItem(WORKSPACE_KEY);
 if (existing !== null) {
  const saved = JSON.parse(existing);
  if (saved.schemaVersion !== 1 || !Array.isArray(saved.library) || !Array.isArray(saved.legacyTemplates))
   throw Error('Unsupported saved workspace. No data changed.');
  validateProject(saved.project);
  return saved;
 }
 const snapshot = Object.fromEntries(LEGACY_KEYS.map(key => [key, storage.getItem(key)]));
 const migrated = migrateLegacySnapshot(snapshot);
 const backupText = JSON.stringify({schemaVersion: 1, originals: snapshot});
 const oldBackup = storage.getItem(BACKUP_KEY);
 // Preserve an earlier snapshot verbatim. A mismatch requires explicit recovery,
 // rather than replacing the only surviving copy of an older browser library.
 if (oldBackup !== null && oldBackup !== backupText)
  throw Error('A different pre-migration backup already exists. Export it before retrying.');
 if (oldBackup === null) storage.setItem(BACKUP_KEY, backupText);
 if (storage.getItem(BACKUP_KEY) !== backupText)
  throw Error('Backup verification failed. Migration has not been committed.');
 const output = JSON.stringify(migrated);
 try {
  storage.setItem(WORKSPACE_KEY, output);
  if (storage.getItem(WORKSPACE_KEY) !== output) throw Error('Workspace verification failed.');
 } catch (error) {
  // Only a newly created destination can be removed; all legacy keys and the
  // complete pre-migration snapshot remain intact.
  try { storage.removeItem(WORKSPACE_KEY); } catch { /* Original keys are untouched. */ }
  throw Error('Migration interrupted; original data and backup remain available. ' + error.message);
 }
 return migrated;
}
