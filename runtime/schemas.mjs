import { INTENTS, METRICS } from "./contract.mjs";

const string = { type: "string", minLength: 1 };
const strings = { type: "array", items: string };
const list = (items, minItems = 0) => ({ type: "array", items, minItems });
const enumeration = values => ({ type: "string", enum: values });
const object = (properties, required = Object.keys(properties)) => ({ type: "object", properties, required, additionalProperties: false });
const sources = { ...strings, minItems: 1, uniqueItems: true };
const priority = enumeration(["High", "Medium", "Low"]);

const market = object({
  key: string, businessLine: string, canonicalL3Id: { type: "string" }, name: string,
  objectType: enumeration(["product", "software", "provider_service", "organization_industry"]),
  definition: string, exclusions: strings, sourceIds: sources,
  relation: enumeration(["primary", "secondary", "adjacent"])
});
const capability = object({ key: string, offering: string, buyer: string, job: string, outcome: string, constraints: strings, marketKey: string, sourceIds: sources, status: enumeration(["confirmed", "inferred", "unknown", "roadmap"] ) });
const query = object({ query: string, purpose: string, marketKey: { type: "string" } });
export const businessSchema = object({
  brandName: string, aliases: strings, businessCategory: string, industryLabel: string,
  economicCenter: string, payingBuyer: string, businessModel: string,
  hypotheses: list(object({ interpretation: string, supportingSourceIds: sources, conflictingSourceIds: strings, unresolved: strings }), 1),
  markets: list(market, 1), capabilities: list(capability, 1),
  status: enumeration(["confirmed", "provisional", "needs_confirmation"]), missingContext: strings,
  researchQueries: list(query, 1), followupUrls: strings,
  monitoringCountries: list(object({ country: string, reason: string, sourceIds: sources }), 1)
});
export const competitorSchema = object({ competitors: list(object({ name: string, url: string, marketKey: string, relation: enumeration(["same_l3", "adjacent_l3", "substitute", "source_only", "unresolved"]), overlap: string, differences: string, sourceIds: sources })), gaps: strings });
export const surfaceSchema = object({ surfaces: list(object({ key: string, label: string, marketKey: string, buyer: string, job: string, decisionObject: string, criteria: strings, sourceIds: sources, priority }), 1), exclusions: list(object({ label: string, reason: string, sourceIds: strings })), unresolved: strings });
export const unitSchema = object({
  key: string, surfaceKey: string, marketKey: string, decisionObject: string, buyerContext: string,
  job: string, constraint: { type: "string" }, intent: enumeration(Object.keys(INTENTS)), subIntent: string,
  scope: enumeration(Object.keys(METRICS)), benchmarkMember: { type: "boolean" },
  pool: enumeration(["monitoring_core", "content_opportunity"]),
  expectedEntityType: enumeration(["brand_or_provider", "product_or_model", "source_or_authority", "method_or_concept"]),
  capabilityKeys: strings, sourceIds: sources, demandEvidence: enumeration(["observed_question", "multiple_sources", "plausible_inference"]),
  demandReason: string, priority, brandTermType: enumeration(["generic", "branded", "competitive"]),
  locationMode: enumeration(["ip_only", "explicit_local_constraint"])
});
export const unitsSchema = object({ units: list(unitSchema), exclusions: list(object({ subIntent: string, reason: string })), more: { type: "boolean" } });
unitSchema.properties.subIntentDefinition = { type: "string", minLength: 12 };
unitSchema.properties.journeyStage = enumeration(["discover", "evaluate", "select", "purchase", "adopt", "use", "renew", "switch"]);
unitSchema.required.push("journeyStage");
export const gapSchema = object({ missingSurfaces: surfaceSchema.properties.surfaces, missingUnits: list(unitSchema), duplicateUnits: list(object({ keepKey: string, removeKey: string, reason: string })), concerns: strings });
// A challenger may legitimately find no new surfaces.
gapSchema.properties.missingSurfaces = { ...gapSchema.properties.missingSurfaces, minItems: 0 };
export const clustersSchema = object({ topics: list(object({ key: string, name: string, marketKey: string, unitKeys: { ...strings, minItems: 1 }, decisionObject: string, job: string, rationale: string, priority, type: enumeration(["product_category", "use_case", "persona_need", "purchase_decision", "risk_validation", "competitive_alternative", "content_coverage"]) }), 1) });
export const promptsSchema = object({ prompts: list(object({ unitKey: string, text: string, language: string, funnel: enumeration(["TOFU", "MOFU", "BOFU"]), keywords: { type: "array", items: string, minItems: 2, maxItems: 2 }, contextAnchor: string }), 1) });
export const reviewSchema = object({ issues: list(object({ unitKey: string, kind: enumeration(["wrong_business", "unnatural", "compound_question", "missing_context", "wrong_intent", "brand_leakage", "wrong_language", "unsupported_constraint", "duplicate", "pool_mismatch"]), reason: string, duplicateOf: { type: "string" } })), checkedUnitKeys: strings });
export const probeSchema = object({ results: list(object({ unitKey: string, relevantEntities: strings, namesTarget: { type: "boolean" }, note: string })) });

export const schemas = { businessSchema, competitorSchema, surfaceSchema, unitsSchema, gapSchema, clustersSchema, promptsSchema, reviewSchema, probeSchema };
