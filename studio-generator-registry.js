/* Only executable generators may be registered. Future catalogue entries must
 * not appear as working model types before their contracts are implemented.
 */
export function createGeneratorRegistry() {
 const entries = new Map();
 return Object.freeze({
  register(generator) {
   for (const key of ['typeId','displayName','category'])
    if (typeof generator?.[key] !== 'string' || !generator[key]) throw Error('Invalid generator ' + key);
   if (!Number.isSafeInteger(generator.typeVersion) || generator.typeVersion < 1) throw Error('Invalid generator version.');
   for (const method of ['validateParameters','generatePreview','generateManufacturingGeometry','estimateBounds','migrateParameters'])
    if (typeof generator[method] !== 'function') throw Error('Generator must implement ' + method);
   if (!generator.capabilities || !generator.defaultParameters || !Array.isArray(generator.parameterSchema) || !Array.isArray(generator.presets))
    throw Error('Generator must declare controls, capabilities and presets.');
   if (entries.has(generator.typeId)) throw Error('Generator already registered: ' + generator.typeId);
   entries.set(generator.typeId, generator);
   return generator;
  },
  get(typeId) {
   const generator = entries.get(typeId);
   if (!generator) throw Error('Generator unavailable: ' + typeId + '. Preserve the model document for recovery.');
   return generator;
  },
  list: () => [...entries.values()]
 });
}
