"""Unit tests for the debt settlement algorithm (services.settlement)."""
from collections import defaultdict

from services.settlement import compute_settlements


def _net_from_settlements(settlements: list[dict]) -> dict[str, int]:
    """Reconstruct each user's net from the produced transfers."""
    net: dict[str, int] = defaultdict(int)
    for s in settlements:
        net[s["from"]] -= s["amount"]
        net[s["to"]] += s["amount"]
    return dict(net)


def test_empty_balances_returns_empty():
    assert compute_settlements({}) == []


def test_all_zero_balances_returns_empty():
    assert compute_settlements({"a": 0, "b": 0}) == []


def test_simple_two_person_transfer():
    result = compute_settlements({"alice": 1000, "bob": -1000})
    assert result == [{"from": "bob", "to": "alice", "amount": 1000}]


def test_amounts_are_always_positive():
    balances = {"a": 5000, "b": -2000, "c": -3000}
    for s in compute_settlements(balances):
        assert s["amount"] > 0


def test_conservation_one_creditor_two_debtors():
    balances = {"a": 5000, "b": -2000, "c": -3000}
    settlements = compute_settlements(balances)
    # Every debtor pays and the creditor is made whole.
    assert _net_from_settlements(settlements) == {"a": 5000, "b": -2000, "c": -3000}


def test_conservation_two_creditors_one_debtor():
    balances = {"a": 3000, "b": 2000, "c": -5000}
    settlements = compute_settlements(balances)
    assert _net_from_settlements(settlements) == {"a": 3000, "b": 2000, "c": -5000}


def test_zero_balance_user_is_ignored():
    balances = {"a": 1000, "b": -1000, "c": 0}
    settlements = compute_settlements(balances)
    assert "c" not in _net_from_settlements(settlements)
    assert _net_from_settlements(settlements) == {"a": 1000, "b": -1000}


def test_total_transferred_equals_total_credit():
    balances = {"a": 4000, "b": 1000, "c": -2500, "d": -2500}
    settlements = compute_settlements(balances)
    total = sum(s["amount"] for s in settlements)
    assert total == 5000  # sum of positive balances


def test_output_is_deterministic_regardless_of_insertion_order():
    b1 = {"c": -3000, "a": 5000, "b": -2000}
    b2 = {"a": 5000, "b": -2000, "c": -3000}
    assert compute_settlements(b1) == compute_settlements(b2)


def test_partial_settlement_advances_both_pointers_correctly():
    # d owes 5000 split across two creditors owed 3000 and 2000.
    balances = {"a": 3000, "b": 2000, "c": -5000}
    settlements = compute_settlements(balances)
    # Debtor 'c' should have two transfers (one to each creditor).
    from_c = [s for s in settlements if s["from"] == "c"]
    assert len(from_c) == 2
    assert sum(s["amount"] for s in from_c) == 5000
