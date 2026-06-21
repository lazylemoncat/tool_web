"""Calendar API contract tests."""


def _create_ledger(client, headers, name="Calendar Ledger"):
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


def _create_category(client, headers, ledger_id, name="Salary"):
    resp = client.post(
        "/api/v1/finance/categories",
        json={"ledger_id": ledger_id, "name": name},
        headers=headers,
    )
    assert resp.status_code == 201
    return resp.json()


def test_calendar_manual_event_crud_persists(client, auth_headers):
    created = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "Project Review",
            "start_at": "2026-06-17T09:30:00",
            "all_day": False,
            "source_id": "src-manual",
            "repeat_rule": "none",
            "reminder": "15m",
            "description": "Review persisted calendar event",
            "location": "Meeting room",
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    event = created.json()
    assert event["id"].startswith("cal-")
    assert event["readonly"] is False

    listed = client.get(
        "/api/v1/calendar/events?start=2026-06-01&end=2026-06-30",
        headers=auth_headers,
    )
    assert listed.status_code == 200
    events_by_id = {item["id"]: item for item in listed.json()}
    assert events_by_id[event["id"]]["title"] == "Project Review"

    updated = client.put(
        f"/api/v1/calendar/events/{event['id']}",
        json={"title": "Updated Review", "location": "Online"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Updated Review"
    assert updated.json()["location"] == "Online"

    deleted = client.delete(
        f"/api/v1/calendar/events/{event['id']}",
        headers=auth_headers,
    )
    assert deleted.status_code == 204

    listed_after_delete = client.get(
        "/api/v1/calendar/events?start=2026-06-01&end=2026-06-30",
        headers=auth_headers,
    )
    assert listed_after_delete.status_code == 200
    assert event["id"] not in {
        item["id"] for item in listed_after_delete.json()
    }


def test_calendar_events_aggregate_real_todo_and_finance_data(
    client, auth_headers
):
    todo_resp = client.post(
        "/api/v1/todos",
        json={
            "title": "Ship calendar API",
            "due_date": "2026-06-18",
            "due_time": "14:30",
        },
        headers=auth_headers,
    )
    assert todo_resp.status_code == 201
    todo = todo_resp.json()

    ledger = _create_ledger(client, auth_headers)
    account = _create_account(client, auth_headers, ledger["id"])
    category = _create_category(client, auth_headers, ledger["id"])

    tx_resp = client.post(
        "/api/v1/finance/transactions",
        json={
            "ledger_id": ledger["id"],
            "account_id": account["id"],
            "category_id": category["id"],
            "type": "income",
            "amount": "880.00",
            "occurred_at": "2026-06-19T10:00:00",
            "note": "Client payment",
        },
        headers=auth_headers,
    )
    assert tx_resp.status_code == 201
    transaction = tx_resp.json()

    finance_event_resp = client.post(
        "/api/v1/finance/events",
        json={
            "ledger_id": ledger["id"],
            "name": "Invoice Cycle",
            "start_at": "2026-06-20T14:00:00",
            "color": "#F59E0B",
        },
        headers=auth_headers,
    )
    assert finance_event_resp.status_code == 201
    finance_event = finance_event_resp.json()

    calendar_resp = client.get(
        "/api/v1/calendar/events?start=2026-06-01&end=2026-06-30",
        headers=auth_headers,
    )
    assert calendar_resp.status_code == 200
    events_by_id = {item["id"]: item for item in calendar_resp.json()}

    todo_event = events_by_id[f"todo-{todo['id']}"]
    assert todo_event["title"] == "Ship calendar API"
    assert todo_event["source_type"] == "todo"
    assert todo_event["readonly"] is True
    assert todo_event["all_day"] is False
    assert todo_event["start_at"] == "2026-06-18T14:30:00"

    transaction_event = events_by_id[f"finance-tx-{transaction['id']}"]
    assert transaction_event["title"] == "Salary"
    assert transaction_event["source_type"] == "finance_income"
    assert transaction_event["amount"] == "880.00"

    finance_calendar_event = events_by_id[
        f"finance-event-{finance_event['id']}"
    ]
    assert finance_calendar_event["title"] == "Invoice Cycle"
    assert finance_calendar_event["source_type"] == "finance_event"
    assert finance_calendar_event["readonly"] is True


def test_calendar_rejects_mutating_readonly_sources(client, auth_headers):
    resp = client.post(
        "/api/v1/calendar/events",
        json={
            "title": "Readonly source event",
            "start_at": "2026-06-17",
            "source_id": "src-todo",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert resp.json()["message"] == "calendar source is readonly"
