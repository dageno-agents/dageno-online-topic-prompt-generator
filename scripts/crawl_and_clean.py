#!/usr/bin/env python3
"""Portable website crawl and cleanup helper for the Dageno skill.

It first tries a configurable crawl endpoint, then falls back to direct HTML
fetching and lightweight standard-library cleanup.
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser


DEFAULT_ENDPOINT = "https://svc.dageno.ai/web-crawl/api/v1/crawl"
USER_AGENT = "DagenoSkillCrawler/1.0 (+https://github.com/dageno-agents)"


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"}:
            self._skip += 1
        if tag.lower() in {"h1", "h2", "h3", "p", "li", "title"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"} and self._skip:
            self._skip -= 1
        if tag.lower() in {"h1", "h2", "h3", "p", "li", "section", "article"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self._skip:
            text = data.strip()
            if text:
                self.parts.append(text)

    def text(self) -> str:
        return " ".join(self.parts)


def normalize_url(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("empty URL")
    if not re.match(r"^https?://", value, re.I):
        value = "https://" + value
    return value


def clean_text(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    lines = [line.strip(" -\t") for line in text.splitlines()]
    lines = [line for line in lines if line]
    return "\n".join(lines).strip()


def ssl_context(insecure: bool):
    if insecure:
        return ssl._create_unverified_context()
    return None


def post_crawl_endpoint(url: str, timeout: int, insecure: bool = False) -> str:
    endpoint = os.environ.get("DAGENO_CRAWL_ENDPOINT", DEFAULT_ENDPOINT)
    payload = json.dumps({"url": url}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": USER_AGENT},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout, context=ssl_context(insecure)) as resp:
        data = json.loads(resp.read().decode("utf-8", "replace"))
    markdown = data.get("data", {}).get("markdown") or data.get("markdown") or ""
    return clean_text(markdown)


def direct_fetch(url: str, timeout: int, insecure: bool = False) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout, context=ssl_context(insecure)) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
    markup = raw.decode(charset, "replace")
    parser = TextExtractor()
    parser.feed(markup)
    return clean_text(parser.text())


def main() -> int:
    parser = argparse.ArgumentParser(description="Crawl one URL and print cleaned page text.")
    parser.add_argument("url")
    parser.add_argument("--timeout", type=int, default=20)
    parser.add_argument("--direct-only", action="store_true", help="Skip DAGENO_CRAWL_ENDPOINT/default crawl endpoint.")
    parser.add_argument("--insecure", action="store_true", help="Disable TLS certificate verification. Prefer fixing CA config in production.")
    args = parser.parse_args()
    insecure = args.insecure or os.environ.get("DAGENO_CRAWL_INSECURE") == "1"

    try:
        url = normalize_url(args.url)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    errors: list[str] = []
    if not args.direct_only:
        try:
            text = post_crawl_endpoint(url, args.timeout, insecure=insecure)
            if text:
                print(text)
                return 0
            errors.append("crawl endpoint returned empty markdown")
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
            errors.append(f"crawl endpoint failed: {exc}")

    try:
        text = direct_fetch(url, args.timeout, insecure=insecure)
        if text:
            print(text)
            return 0
        errors.append("direct fetch returned empty text")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        errors.append(f"direct fetch failed: {exc}")

    print("; ".join(errors), file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
