"""AI eval harness for the Silent Conflict Surfacer.

See README in this package (docstrings) for how to run:

    # CI-safe: deterministic stub model, no API key needed
    python -m evals.run
    python -m pytest evals

    # Against the real model (costs tokens, non-deterministic)
    RUN_LIVE_EVALS=1 python -m evals.run --live
"""
