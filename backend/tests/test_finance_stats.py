"""
Finance stats API contract tests.
Validates the chart data shape consumed by the Next.js finance dashboard.
"""
from datetime import datetime
from decimal import Decimal


def _create_ledger_account_category(client, auth_headers):
    ledger_resp = client.post("/api/v1/finance/ledgers", json={"name": "Stats Ledger"}, headers=auth_headers)
    assert ledger_resp.status_code == 201
    ledger_id = ledger_resp.json()["id"]

    account_resp = client.post("/api/v1/finance/accounts", json={
        "ledger_id": ledger_id,
        "name": "Stats Account",
        "type": "cash",
    }, headers=auth_headers)
    assert account_resp.status_code == 201
    account_id = account_resp.json()["id"]

    category_resp = client.post("/api/v1/finance/categories", json={
        "ledger_id": ledger_id,
        "name": "餐饮",
        "icon": "🍜",
    }, headers=auth_headers)
    assert category_resp.status_code == 201
    category_id = category_resp.json()["id"]

    return ledger_id, account_id, category_id


def _create_transaction(client, auth_headers, ledger_id, account_id, tx_type, amount, category_id=None):
    payload = {
        "ledger_id": ledger_id,
        "account_id": account_id,
        "type": tx_type,
        "amount": amount,
    }
    if category_id is not None:
        payload["category_id"] = category_id
    resp = client.post("/api/v1/finance/transactions", json=payload, headers=auth_headers)
    assert resp.status_code == 201


def test_stats_response_matches_frontend_chart_contract(client, auth_headers):
    ledger_id, account_id, category_id = _create_ledger_account_category(client, auth_headers)
    _create_transaction(client, auth_headers, ledger_id, account_id, "expense", "100.00", category_id)
    _create_transaction(client, auth_headers, ledger_id, account_id, "income", "500.00")

    resp = client.get(f"/api/v1/finance/stats?ledger_id={ledger_id}&period=month", headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["category_data"] == [
        {
            "category_name": "餐饮",
            "category_icon": "🍜",
            "total": "100.00",
            "color": "#EF4444",
        }
    ]
    assert len(data["trend_data"]) == 6

    current_month = datetime.utcnow().strftime("%Y-%m")
    current = data["trend_data"][-1]
    assert current["month"] == current_month
    assert Decimal(current["income"]) == Decimal("500.00")
    assert Decimal(current["expense"]) == Decimal("100.00")
