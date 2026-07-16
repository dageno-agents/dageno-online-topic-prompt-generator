#!/usr/bin/env python3
"""Deterministic QA for Dageno Topic/Prompt JSON output."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


VALID_PT = {"generic", "branded", "competitive"}
VALID_IT = {
    "problem_solution",
    "recommendation",
    "comparison",
    "pricing_value",
    "risk_validation",
    "implementation",
    "alternative",
    "local_availability",
    "education_content",
    "brand_validation",
}
VALID_SUBINTENTS = {
    "problem_solution": {"problem_diagnosis", "achieve_outcome", "replace_manual_process", "trigger_response"},
    "recommendation": {"best_overall", "scenario_fit", "budget_selection", "premium_selection", "provider_shortlist", "audience_fit"},
    "comparison": {"comparison_within", "vs_named", "concept_comparison", "criteria_comparison", "bundle_or_route_comparison"},
    "pricing_value": {"price", "fee_structure", "total_cost", "hidden_fees", "free_trial", "billing_model", "credit_usage_limits", "quote_request", "roi_value", "contract_warranty", "moq_payment_terms"},
    "risk_validation": {"reviews_reputation", "worth_it", "pros_cons", "pre_purchase_check", "requirement_fit", "personal_suitability", "compliance_audit", "data_security", "privacy_data_handling", "commercial_usage_rights", "output_quality", "reliability_support", "quality_verification", "supply_delivery_risk"},
    "implementation": {"how_it_works", "how_to_achieve", "onboarding_install", "integration_sso", "api_sdk", "migration_switching", "permissions_multi_account", "export_workflow", "operations_maintenance"},
    "alternative": {"category_alternative", "competitor_alternative", "substitute_method", "switch_provider"},
    "local_availability": {"local_provider", "where_to_buy", "inventory_availability", "delivery_coverage", "appointment_wait_time"},
    "education_content": {"definition", "types", "benefits", "principles_trends", "checklist_framework", "source_research"},
    "brand_validation": {"brand_fit", "brand_capability", "brand_pricing", "brand_reputation", "brand_trust", "brand_alternative"},
}
VALID_FUNNEL = {"TOFU", "MOFU", "BOFU"}
VALID_VARIANT_PURPOSE = {"canonical", "wording_robustness"}
VALID_EXPECTED_ENTITY = {"brand_or_provider", "product_or_model", "source_or_authority", "method_or_concept"}
VALID_POOL = {"monitoring_core", "content_opportunity"}
VALID_SCOPE = {"brand_core", "industry_benchmark", "competitive_whitespace", "out_of_scope_reference"}
VALID_METRIC_USE = {"core_kpi", "category_benchmark", "opportunity_analysis", "diagnostic_only"}
VALID_SERVICEABILITY = {"confirmed", "adjacent", "unsupported"}
AMBIGUOUS = {"this", "it", "this industry", "this category", "the tool", "the platform", "the service"}
CROSS_INDUSTRY = {
    "vendor",
    "supplier",
    "procurement",
    "platform",
    "software",
    "service",
    "agency",
    "manufacturer",
    "account",
    "course",
    "demo",
    "cost",
    "pricing",
}


def words(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9][a-z0-9-]*", text.lower()))


def contains_any(text: str, terms: list[str]) -> bool:
    lower = text.lower()
    return any(term and term.lower() in lower for term in terms)


def contains_ambiguous_term(text: str, term: str) -> bool:
    pattern = r"\b" + re.escape(term.lower()).replace(r"\ ", r"\s+") + r"\b"
    return re.search(pattern, text.lower()) is not None


def similarity(left: str, right: str) -> float:
    a = words(left)
    b = words(right)
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def load_json(path: Path) -> Any:
    if str(path) == "-":
        return json.load(sys.stdin)
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    parser = argparse.ArgumentParser(description="QA Dageno Topic/Prompt JSON.")
    parser.add_argument("json_path", type=Path)
    parser.add_argument("--brand", action="append", default=[])
    parser.add_argument("--alias", action="append", default=[])
    parser.add_argument("--competitor", action="append", default=[])
    parser.add_argument(
        "--context-term",
        action="append",
        default=[],
        help="Business/category anchors expected in each prompt, e.g. CFD, forex, broker, trading platform.",
    )
    parser.add_argument("--mode", choices=["exclude", "include", "mixed", "brand_only"], default="exclude")
    args = parser.parse_args()

    errors: list[str] = []
    warnings: list[str] = []
    seen_prompts: set[str] = set()
    seen_prompt_records: list[dict[str, str]] = []
    topic_count = 0
    prompt_count = 0
    monitoring_count = 0
    content_count = 0
    scope_counts = {scope: 0 for scope in VALID_SCOPE}
    coverage_by_topic: list[dict[str, Any]] = []
    intent_unit_prompts: dict[str, list[dict[str, Any]]] = {}

    try:
        data = load_json(args.json_path)
    except Exception as exc:  # CLI should report parse/load errors cleanly.
        report = {"passed": False, "errors": [f"invalid JSON: {exc}"], "warnings": []}
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1

    topics = data.get("ts") if isinstance(data, dict) else None
    if not isinstance(topics, list):
        errors.append("root must contain a ts array")
        topics = []

    brand_terms = args.brand + args.alias
    blocked_generic_terms = brand_terms + args.competitor

    for ti, topic in enumerate(topics, start=1):
        topic_count += 1
        prompts = topic.get("ps") if isinstance(topic, dict) else None
        if not isinstance(prompts, list):
            errors.append(f"topic {ti} missing ps array")
            continue

        cv = topic.get("cv") if isinstance(topic, dict) and isinstance(topic.get("cv"), dict) else {}
        cells = cv.get("cells") if isinstance(cv.get("cells"), list) else []
        valid_cell_ids = {str(cell.get("id")) for cell in cells if isinstance(cell, dict) and cell.get("id")}
        cell_by_id = {str(cell.get("id")): cell for cell in cells if isinstance(cell, dict) and cell.get("id")}
        high_cell_ids = {str(cell.get("id")) for cell in cells if isinstance(cell, dict) and cell.get("id") and str(cell.get("priority", "High")).lower() == "high"}
        covered_cell_ids: set[str] = set()
        intent_types: set[str] = set()
        for pi, prompt in enumerate(prompts, start=1):
            prompt_count += 1
            prefix = f"topic {ti} prompt {pi}"
            if not isinstance(prompt, dict):
                errors.append(f"{prefix} must be an object")
                continue

            text = str(prompt.get("p", "")).strip()
            pt = prompt.get("pt")
            it = prompt.get("it")
            sub_intent = prompt.get("subIntent")
            intent_unit_id = str(prompt.get("intentUnitId", "")).strip()
            variant_purpose = prompt.get("variantPurpose")
            variant_set_id = str(prompt.get("variantSetId", "")).strip()
            expected_entity_type = prompt.get("expectedEntityType")
            funnel = prompt.get("f")
            kw = prompt.get("kw")
            score = prompt.get("is")
            pool = prompt.get("pool")
            sv = prompt.get("sv")
            dp = prompt.get("dp")
            mp = prompt.get("mp")
            coverage_ids = prompt.get("cg")
            evidence = prompt.get("ev")
            scope = prompt.get("scope")
            metric_use = prompt.get("metricUse")
            serviceability_status = prompt.get("serviceabilityStatus")
            competitor_evidence_ids = prompt.get("competitorEvidenceIds")

            if not text:
                errors.append(f"{prefix} missing p")
                continue
            normalized = re.sub(r"\s+", " ", text.lower())
            if normalized in seen_prompts:
                errors.append(f"{prefix} duplicate prompt: {text}")
            similar_records = [
                previous
                for previous in seen_prompt_records
                if similarity(previous["text"], text) >= 0.82
            ]
            for previous in similar_records:
                allowed_variant_pair = (
                    intent_unit_id
                    and previous["intentUnitId"] == intent_unit_id
                    and variant_purpose == "wording_robustness"
                    and previous["variantSetId"] == variant_set_id
                )
                if allowed_variant_pair:
                    warnings.append(f"{prefix} is a wording variant of {previous['prefix']}; aggregate by intentUnitId")
                else:
                    errors.append(f"{prefix} semantic duplicate of {previous['prefix']}: {text}")
            seen_prompts.add(normalized)
            seen_prompt_records.append({
                "prefix": prefix,
                "text": text,
                "intentUnitId": intent_unit_id,
                "variantPurpose": str(variant_purpose or ""),
                "variantSetId": variant_set_id,
            })

            if pt not in VALID_PT:
                errors.append(f"{prefix} invalid pt: {pt}")
            if it not in VALID_IT:
                errors.append(f"{prefix} invalid it: {it}")
            else:
                intent_types.add(it)
                allowed_sub_intents = VALID_SUBINTENTS.get(it, set())
                if not isinstance(sub_intent, str) or not sub_intent.strip():
                    errors.append(f"{prefix} missing subIntent")
                elif sub_intent not in allowed_sub_intents and not sub_intent.startswith("custom_"):
                    errors.append(f"{prefix} invalid subIntent {sub_intent} for it={it}")
            if not intent_unit_id:
                errors.append(f"{prefix} missing intentUnitId")
            if variant_purpose not in VALID_VARIANT_PURPOSE:
                errors.append(f"{prefix} invalid variantPurpose: {variant_purpose}")
            if not variant_set_id:
                errors.append(f"{prefix} missing variantSetId")
            if expected_entity_type not in VALID_EXPECTED_ENTITY:
                errors.append(f"{prefix} invalid expectedEntityType: {expected_entity_type}")
            if intent_unit_id:
                intent_unit_prompts.setdefault(intent_unit_id, []).append({
                    "prefix": prefix,
                    "variantPurpose": variant_purpose,
                    "variantSetId": variant_set_id,
                    "text": text,
                })
            if funnel not in VALID_FUNNEL:
                errors.append(f"{prefix} invalid funnel: {funnel}")
            if not isinstance(kw, list) or len(kw) != 2 or not all(isinstance(item, str) and item.strip() for item in kw):
                errors.append(f"{prefix} must have exactly two non-empty kw strings")
            if not isinstance(score, list) or not score:
                errors.append(f"{prefix} missing is score array")
            if pool not in VALID_POOL:
                errors.append(f"{prefix} invalid pool: {pool}")
            if scope not in VALID_SCOPE:
                errors.append(f"{prefix} invalid scope: {scope}")
            else:
                scope_counts[scope] += 1
            if metric_use not in VALID_METRIC_USE:
                errors.append(f"{prefix} invalid metricUse: {metric_use}")
            if serviceability_status not in VALID_SERVICEABILITY:
                errors.append(f"{prefix} invalid serviceabilityStatus: {serviceability_status}")
            if not isinstance(competitor_evidence_ids, list):
                errors.append(f"{prefix} competitorEvidenceIds must be an array")
            if not all(isinstance(value, (int, float)) and 0 <= value <= 100 for value in (sv, dp, mp)):
                errors.append(f"{prefix} sv/dp/mp must be 0-100 numbers")
            elif pool == "monitoring_core":
                monitoring_count += 1
                if scope == "brand_core" and (sv < 70 or dp < 60 or mp < 55):
                    errors.append(f"{prefix} does not meet brand_core monitoring thresholds")
                elif scope in {"industry_benchmark", "competitive_whitespace"} and (dp < 60 or mp < 55):
                    errors.append(f"{prefix} does not meet category monitoring thresholds")
            elif pool == "content_opportunity":
                content_count += 1
                if scope == "brand_core" and (sv < 70 or dp < 50):
                    errors.append(f"{prefix} does not meet brand_core content thresholds")
                elif scope in {"industry_benchmark", "competitive_whitespace"} and dp < 50:
                    errors.append(f"{prefix} does not meet category content threshold")

            expected_metric = {
                "brand_core": "core_kpi",
                "industry_benchmark": "category_benchmark",
                "competitive_whitespace": "opportunity_analysis",
                "out_of_scope_reference": "diagnostic_only",
            }.get(scope)
            if expected_metric and metric_use != expected_metric:
                errors.append(f"{prefix} scope {scope} requires metricUse={expected_metric}")
            if scope == "brand_core" and serviceability_status != "confirmed":
                errors.append(f"{prefix} brand_core requires confirmed serviceability")
            if scope == "competitive_whitespace" and not competitor_evidence_ids:
                errors.append(f"{prefix} competitive_whitespace requires competitor evidence")
            if not isinstance(coverage_ids, list):
                errors.append(f"{prefix} missing cg coverage-cell array")
            else:
                for cell_id in map(str, coverage_ids):
                    if valid_cell_ids and cell_id not in valid_cell_ids:
                        errors.append(f"{prefix} references unknown coverage cell: {cell_id}")
                    else:
                        covered_cell_ids.add(cell_id)
                        cell = cell_by_id.get(cell_id, {})
                        cell_scope = cell.get("scope")
                        if cell_scope and scope and cell_scope != scope:
                            errors.append(f"{prefix} scope {scope} conflicts with coverage cell {cell_id} scope {cell_scope}")
                        cell_sub_intent = cell.get("subIntent")
                        if cell_sub_intent and sub_intent and cell_sub_intent != sub_intent:
                            errors.append(f"{prefix} subIntent {sub_intent} conflicts with coverage cell {cell_id} subIntent {cell_sub_intent}")
                        cell_intent_unit = cell.get("intentUnitId")
                        if cell_intent_unit and intent_unit_id and str(cell_intent_unit) != intent_unit_id:
                            errors.append(f"{prefix} intentUnitId {intent_unit_id} conflicts with coverage cell {cell_id} intentUnitId {cell_intent_unit}")
            if not isinstance(evidence, dict) or not evidence:
                warnings.append(f"{prefix} missing evidence metadata")
            if pool == "monitoring_core" and expected_entity_type == "method_or_concept" and isinstance(mp, (int, float)) and mp >= 55:
                warnings.append(f"{prefix} monitoring_core expects only methods/concepts; verify that entity mention likelihood is not overstated")
            if scope == "industry_benchmark":
                source_ids = evidence.get("sourceIds", []) if isinstance(evidence, dict) else []
                category_evidence = set(map(str, source_ids or [])) | set(map(str, competitor_evidence_ids or []))
                if len(category_evidence) < 2:
                    errors.append(f"{prefix} industry_benchmark requires at least two independent evidence IDs")

            combined = " ".join([text] + (kw if isinstance(kw, list) else []))
            if pt == "generic" and contains_any(combined, blocked_generic_terms):
                errors.append(f"{prefix} generic prompt/keywords include brand or competitor term")
            if pt == "branded" and brand_terms and not contains_any(combined, brand_terms):
                errors.append(f"{prefix} branded prompt does not include brand or alias")
            if pt == "competitive" and args.mode != "mixed":
                errors.append(f"{prefix} competitive prompt only allowed in mixed mode")
            if args.mode == "brand_only" and pt != "branded":
                errors.append(f"{prefix} brand_only mode requires branded prompts")

            lower = combined.lower()
            for term in AMBIGUOUS:
                if contains_ambiguous_term(lower, term):
                    warnings.append(f"{prefix} may rely on ambiguous context: {term}")
                    break

            if args.context_term and not contains_any(combined, args.context_term):
                errors.append(f"{prefix} missing required business-context anchor")

            token_set = words(text)
            if token_set & CROSS_INDUSTRY and len(token_set) < 5:
                warnings.append(f"{prefix} may lack category/use-case anchor for cross-industry term")

        missing_high = sorted(high_cell_ids - covered_cell_ids)
        if missing_high:
            errors.append(f"topic {ti} missing high-priority coverage cells: {', '.join(missing_high)}")
        applicable_intents = {str(value) for value in cv.get("applicableIntentTypes", [])} if isinstance(cv.get("applicableIntentTypes"), list) else set()
        missing_intents = sorted(applicable_intents - intent_types)
        if missing_intents:
            warnings.append(f"topic {ti} missing applicable intents: {', '.join(missing_intents)}")
        applicable_sub_intents = {str(value) for value in cv.get("applicableSubIntents", [])} if isinstance(cv.get("applicableSubIntents"), list) else set()
        covered_sub_intents = {
            str(prompt.get("subIntent"))
            for prompt in prompts
            if isinstance(prompt, dict) and prompt.get("subIntent")
        }
        missing_sub_intents = sorted(applicable_sub_intents - covered_sub_intents)
        if missing_sub_intents:
            errors.append(f"topic {ti} missing applicable sub-intents: {', '.join(missing_sub_intents)}")
        coverage_by_topic.append({
            "topic": topic.get("t") if isinstance(topic, dict) else f"Topic {ti}",
            "expectedCells": len(valid_cell_ids),
            "coveredCells": len(covered_cell_ids),
            "coverageRate": round(len(covered_cell_ids) / len(valid_cell_ids) * 100) if valid_cell_ids else None,
            "missingHighPriority": missing_high,
            "missingIntents": missing_intents,
            "missingSubIntents": missing_sub_intents,
        })

    for intent_unit_id, unit_prompts in intent_unit_prompts.items():
        canonical = [item for item in unit_prompts if item["variantPurpose"] == "canonical"]
        variants = [item for item in unit_prompts if item["variantPurpose"] == "wording_robustness"]
        if len(canonical) != 1:
            errors.append(f"intent unit {intent_unit_id} must have exactly one canonical prompt; found {len(canonical)}")
        variant_sets = {item["variantSetId"] for item in unit_prompts if item["variantSetId"]}
        if len(variant_sets) > 1:
            errors.append(f"intent unit {intent_unit_id} uses multiple variantSetId values")
        if len(variants) > 2:
            warnings.append(f"intent unit {intent_unit_id} has more than two wording variants; verify evidence and reporting weight")

    report = {
        "passed": not errors,
        "summary": {"topics": topic_count, "prompts": prompt_count, "intentUnits": len(intent_unit_prompts), "monitoringCore": monitoring_count, "contentOpportunity": content_count, "scopeCounts": scope_counts},
        "errors": errors,
        "warnings": warnings,
        "coverageByTopic": coverage_by_topic,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
