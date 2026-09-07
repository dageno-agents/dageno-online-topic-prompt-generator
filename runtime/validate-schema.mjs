import { schemas } from "./schemas.mjs";
import * as validators from "./validators.generated.mjs";
export function validateSchema(schema, data, stage = "data") {
  const key = Object.keys(schemas).find(k => schemas[k] === schema);
  const validate = validators[key];
  if (!validate) throw new Error(`Unknown schema for ${stage}`);
  if (!validate(data)) throw new Error(`${stage}: ${validate.errors.map(e => `${e.instancePath}: ${e.message}`).join("; ")}`);
  return data;
}
