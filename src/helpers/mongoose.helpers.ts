/**
 * Helper for removing _id from the document.
 * @param doc The mongoose document which is being converted.
 * @param ret The plain object representation which has been converted.
 * @param options The options in use (either schema options or the options passed inline).
 */
export function removeDefaultId(_doc: any, ret: any, _options: any) {
  delete ret._id;
  return ret;
}

/**
 * Helper for deleting fields inside the document object.
 * @param fields Fields to delete in the document.
 */
export function removeDocumentFields(fields: string[] | string) {
  return (_doc: any, ret: any, _options: any) => {
    let fieldList = [''];

    typeof fields === 'string' ? (fieldList = fields.split(' ')) : (fieldList = fields);

    fieldList.forEach((field) => {
      delete ret[field];
    });
    return ret;
  };
}

/**
 * Helper to normalize from _id to id.
 * @param ret The plain object representation which has been converted.
 */
export function normalizeId(ret: any) {
  if (ret._id && typeof ret._id === 'object' && ret._id.toString) {
    if (typeof ret.id === 'undefined') {
      ret.id = ret._id.toString();
    }
  }
  if (typeof ret._id !== 'undefined') {
    delete ret._id;
  }
}

/**
 * Helper to remove private paths.
 * @param ret The plain object representation which has been converted.
 * @param schema Schema object
 */
export function removePrivatePaths(ret: any, schema: any) {
  for (const path in schema.paths) {
    if (schema.paths[path].options && schema.paths[path].options.private) {
      if (typeof ret[path] !== 'undefined') {
        delete ret[path];
      }
    }
  }
}

/**
 * Helper to remove version from the document.
 * @param ret The plain object representation which has been converted.
 */
export function removeVersion(ret: any) {
  if (typeof ret.__v !== 'undefined') {
    delete ret.__v;
  }
}
