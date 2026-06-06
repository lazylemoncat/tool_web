"""Additional finance API contract and isolation tests."""


def _create_ledger(client, headers, name="Finance Ledger"):
    resp = client.post(
        "/api/v1/finance/ledgers",
        json={"name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def _create_account(client, headers, ledger_id, name="Cash"):
    resp = client.post(
        "/api/v1/finance/accounts",
        json={"ledger_id": ledger_id, "name": name, "type": "cash"},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def _create_todo(client, headers, title="Linked Todo"):
    resp = client.post(
        "/api/v1/todos",
        json={"title": title},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def _create_transaction(client, headers, ledger_id, account_id, **overrides):
    payload = {
        "ledger_id": ledger_id,
        "account_id": account_id,
        "type": "expense",
        "amount": "12.50",
    }
    payload.update(overrides)
    resp = client.post(
        "/api/v1/finance/transactions",
        json=payload,
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def test_empty_dashboard_and_stats_match_frontend_contract(
    client, auth_headers
):
    ledger = _create_ledger(client, auth_headers, "Empty Ledger")

    dashboard = client.get(
        f"/api/v1/finance/dashboard?ledger_id={ledger['id']}",
        headers=auth_headers,
    )
    assert dashboard.status_code == 200
    dashboard_body = dashboard.json()
    assert dashboard_body["recent_transactions"] == []
    assert dashboard_body["budgets"] == []
    assert "total_assets" in dashboard_body
    assert "month_income" in dashboard_body
    assert "month_expense" in dashboard_body
    assert "budget_usage_pct" in dashboard_body

    stats = client.get(
        f"/api/v1/finance/stats?ledger_id={ledger['id']}&period=month",
        headers=auth_headers,
    )
    assert stats.status_code == 200
    stats_body = stats.json()
    assert stats_body["category_data"] == []
    assert len(stats_body["trend_data"]) == 6
    assert {"month", "income", "expense"} <= set(
        stats_body["trend_data"][0].keys()
    )


def test_finance_relations_validate_resource_ownership(
    client, auth_headers_for
):
    owner_headers = auth_headers_for("finance_owner")
    other_headers = auth_headers_for("finance_other")
    ledger = _create_ledger(client, owner_headers, "Owner Ledger")
    account = _create_account(client, owner_headers, ledger["id"])
    tx = _create_transaction(
        client, owner_headers, ledger["id"], account["id"]
    )
    todo = _create_todo(client, owner_headers, "Owner Todo")

    created = client.post(
        "/api/v1/finance/relations",
        json={
            "from_type": "transaction",
            "from_id": tx["id"],
            "relation_type": "related_to",
            "to_type": "todo",
            "to_id": todo["id"],
        },
        headers=owner_headers,
    )
    assert created.status_code == 201
    relation = created.json()

    owner_list = client.get(
        (
            "/api/v1/finance/relations"
            f"?from_type=transaction&from_id={tx['id']}"
        ),
        headers=owner_headers,
    )
    assert owner_list.status_code == 200
    assert [item["id"] for item in owner_list.json()] == [relation["id"]]

    other_list = client.get(
        (
            "/api/v1/finance/relations"
            f"?from_type=transaction&from_id={tx['id']}"
        ),
        headers=other_headers,
    )
    assert other_list.status_code == 200
    assert other_list.json() == []

    other_delete = client.delete(
        f"/api/v1/finance/relations/{relation['id']}",
        headers=other_headers,
    )
    assert other_delete.status_code == 404

    owner_delete = client.delete(
        f"/api/v1/finance/relations/{relation['id']}",
        headers=owner_headers,
    )
    assert owner_delete.status_code == 204


def test_transaction_linked_todos_reject_foreign_todo(
    client, auth_headers_for
):
    owner_headers = auth_headers_for("linked_owner")
    other_headers = auth_headers_for("linked_other")
    ledger = _create_ledger(client, owner_headers, "Linked Ledger")
    account = _create_account(client, owner_headers, ledger["id"])
    foreign_todo = _create_todo(client, other_headers, "Foreign Todo")

    resp = client.post(
        "/api/v1/finance/transactions",
        json={
            "ledger_id": ledger["id"],
            "account_id": account["id"],
            "type": "expense",
            "amount": "20.00",
            "linked_todo_ids": [foreign_todo["id"]],
        },
        headers=owner_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["message"] == "resource not found"


def test_finance_validation_error_shape(client, auth_headers):
    ledger = _create_ledger(client, auth_headers, "Validation Ledger")
    account = _create_account(client, auth_headers, ledger["id"])

    resp = client.post(
        "/api/v1/finance/transactions",
        json={
            "ledger_id": ledger["id"],
            "account_id": account["id"],
            "type": "expense",
            "amount": "0",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["code"] == 422
    assert "amount" in body["message"]
    assert body["data"] is None
