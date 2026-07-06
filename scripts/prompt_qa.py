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
VALID_FUNNEL = {"TOFU", "MOFU", "BOFU"}
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
    topic_count = 0
    prompt_count = 0

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

        intent_types: set[str] = set()
        education_count = 0
        for pi, prompt in enumerate(prompts, start=1):
            prompt_count += 1
            prefix = f"topic {ti} prompt {pi}"
            if not isinstance(prompt, dict):
                errors.append(f"{prefix} must be an object")
                continue

            text = str(prompt.get("p", "")).strip()
            pt = prompt.get("pt")
            it = prompt.get("it")
            funnel = prompt.get("f")
            kw = prompt.get("kw")
            score = prompt.get("is")

            if not text:
                errors.append(f"{prefix} missing p")
                continue
            normalized = re.sub(r"\s+", " ", text.lower())
            if normalized in seen_prompts:
                errors.append(f"{prefix} duplicate prompt: {text}")
            seen_prompts.add(normalized)

            if pt not in VALID_PT:
                errors.append(f"{prefix} invalid pt: {pt}")
            if it not in VALID_IT:
                errors.append(f"{prefix} invalid it: {it}")
            else:
                intent_types.add(it)
                if it == "education_content":
                    education_count += 1
            if funnel not in VALID_FUNNEL:
                errors.append(f"{prefix} invalid funnel: {funnel}")
            if not isinstance(kw, list) or len(kw) != 2 or not all(isinstance(item, str) and item.strip() for item in kw):
                errors.append(f"{prefix} must have exactly two non-empty kw strings")
            if not isinstance(score, list) or not score:
                errors.append(f"{prefix} missing is score array")

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
                if term in lower:
                    warnings.append(f"{prefix} may rely on ambiguous context: {term}")
                    break

            if args.context_term and not contains_any(combined, args.context_term):
                errors.append(f"{prefix} missing required business-context anchor")

            token_set = words(text)
            if token_set & CROSS_INDUSTRY and len(token_set) < 5:
                warnings.append(f"{prefix} may lack category/use-case anchor for cross-industry term")

        if len(prompts) >= 10 and len(intent_types) < 5:
            warnings.append(f"topic {ti} has fewer than five intent types")
        if education_count > 1:
            warnings.append(f"topic {ti} has more than one education_content prompt")

    report = {
        "passed": not errors,
        "summary": {"topics": topic_count, "prompts": prompt_count},
        "errors": errors,
        "warnings": warnings,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
