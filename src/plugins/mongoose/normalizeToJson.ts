import { normalizeId, removePrivatePaths, removeVersion } from '../../helpers/mongoose.helpers';

function normalizeToJson(schema: any) {
  //NOTE: this plugin is actually called *after* any schemas
  //custom toJSON has been defined, so we need to ensure not to
  //overwrite it. Hence, we remember it here and call it later

  let transform: any;

  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }

  //Extend toJSON options
  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(doc: any, ret: any, options: any) {
      //Remove private paths
      if (schema.options.removePrivatePaths !== false) {
        removePrivatePaths(ret, schema);
      }

      //Remove version
      if (schema.options.removeVersion !== false) {
        removeVersion(ret);
      }

      //Normalize ID
      if (schema.options.normalizeId !== false) {
        normalizeId(ret);
      }

      //Call custom transform if present
      if (transform) {
        return transform(doc, ret, options);
      }

      return ret;
    },
    virtuals: true,
  });
}

export default normalizeToJson;
