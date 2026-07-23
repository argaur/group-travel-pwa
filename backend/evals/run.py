"""One-command eval runner for the Silent Conflict Surfacer.

    python -m evals.run            # deterministic stub model (CI-safe, no key)
    RUN_LIVE_EVALS=1 python -m evals.run --live   # against the real model

Exits non-zero if any scenario fails, so it doubles as a CI gate.
"""
from __future__ import annotations

import argparse
import sys

from evals.harness import run_scenario
from evals.scenarios import SCENARIOS


def main() -> int:
    parser = argparse.ArgumentParser(description="Silent Conflict Surfacer evals")
    parser.add_argument(
        "--live",
        action="store_true",
        help="Run against the real Anthropic model (requires ANTHROPIC_API_KEY).",
    )
    args = parser.parse_args()

    mode = "LIVE (real model)" if args.live else "STUB (deterministic)"
    print(f"\nSilent Conflict Surfacer — eval suite [{mode}]")
    print("=" * 68)

    results = []
    for scenario in SCENARIOS:
        result = run_scenario(scenario, live=args.live)
        results.append(result)
        status = "PASS" if result.passed else "FAIL"
        print(f"  [{status}] {scenario.name:<32} ({scenario.category})")
        for failure in result.failures:
            print(f"          - {failure}")

    passed = sum(1 for r in results if r.passed)
    total = len(results)
    print("=" * 68)
    print(f"  {passed}/{total} scenarios passed\n")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
