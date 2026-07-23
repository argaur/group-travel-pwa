"""Debt settlement algorithm — pure, dependency-free, unit-tested.

Given each member's *net* balance (paid minus owed, in paise), produce the
minimal-ish set of transfers that settles the group using a greedy
creditor/debtor match. This is deterministic math: no I/O, no DB, no names —
the router layer decorates the result with user identities afterwards.
"""
from __future__ import annotations


def compute_settlements(balances: dict[str, int]) -> list[dict]:
    """Greedy min-cash-flow settlement.

    Args:
        balances: user_id -> net balance in paise. Positive = is owed money
            (creditor); negative = owes money (debtor). Should sum to ~0.

    Returns:
        List of ``{"from": debtor_id, "to": creditor_id, "amount": paise}``.
        Amounts are always positive. Ordering is deterministic (creditors and
        debtors are processed in ascending user_id order) so the output is
        stable and testable regardless of dict insertion order.
    """
    if not balances:
        return []

    creditors = sorted(
        ((uid, amt) for uid, amt in balances.items() if amt > 0),
        key=lambda t: t[0],
    )
    debtors = sorted(
        ((uid, -amt) for uid, amt in balances.items() if amt < 0),
        key=lambda t: t[0],
    )

    settlements: list[dict] = []
    ci = 0
    di = 0
    while ci < len(creditors) and di < len(debtors):
        c_uid, c_amt = creditors[ci]
        d_uid, d_amt = debtors[di]
        pay = min(c_amt, d_amt)
        if pay > 0:
            settlements.append({"from": d_uid, "to": c_uid, "amount": pay})
        c_amt -= pay
        d_amt -= pay
        creditors[ci] = (c_uid, c_amt)
        debtors[di] = (d_uid, d_amt)
        if c_amt == 0:
            ci += 1
        if d_amt == 0:
            di += 1

    return settlements
