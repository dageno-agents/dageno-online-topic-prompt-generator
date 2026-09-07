import Ajv from "ajv";
import standaloneCode from "ajv/dist/standalone/index.js";
import { writeFile } from "node:fs/promises";
import { schemas } from "../runtime/schemas.mjs";
const ajv = new Ajv({ allErrors: true, strict: true, code: { source: true, esm: true } });
for (const [key, schema] of Object.entries(schemas)) ajv.addSchema(schema, key);
const code = 'import ucs2length from "ajv/dist/runtime/ucs2length.js";\n' + standaloneCode(ajv, Object.fromEntries(Object.keys(schemas).map(k => [k, k]))).replaceAll('require("ajv/dist/runtime/ucs2length").default', 'ucs2length.default || ucs2length');
await writeFile(new URL("../runtime/validators.generated.mjs", import.meta.url), code);
