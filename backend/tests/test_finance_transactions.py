"""
Finance transaction depth guard tests.
Validates max 1-level parent-child nesting for transactions.
"""
import pytest


def _create_ledger_and_account(client, auth_headers):
    """Create a ledger and account, return (ledger_id, account_id)."""
    ledger_resp = client.post("/api/v1/finance/ledgers", json={"name": "Test Ledger"}, headers=auth_headers)
    assert ledger_resp.status_code == 201
    ledger_id = ledger_resp.json()["id"]

    account_resp = client.post("/api/v1/finance/accounts", json={
        "ledger_id": ledger_id,
        "name": "Test Account",
        "type": "cash",
    }, headers=auth_headers)
    assert account_resp.status_code == 201
    account_id = account_resp.json()["id"]

    return ledger_id, account_id


def _create_tx(client, auth_headers, ledger_id, account_id, parent_id=None):
    """Create a transaction, return response JSON."""
    payload = {
        "ledger_id": ledger_id,
        "account_id": account_id,
        "type": "expense",
        "amount": "100.00",
    }
    if parent_id is not None:
        payload["parent_transaction_id"] = parent_id
    resp = client.post("/api/v1/finance/transactions", json=payload, headers=auth_headers)
    return resp


class TestTransactionDepthGuard:
    """Depth=1 nesting validation."""

    def test_create_standalone_tx(self, client, auth_headers):
        """Standalone transaction without parent should succeed."""
        lid, aid = _create_ledger_and_account(client, auth_headers)
        resp = _create_tx(client, auth_headers, lid, aid)
        assert resp.status_code == 201
        data = resp.json()
        assert data["parent_transaction_id"] is None

    def test_legal_parent_child(self, client, auth_headers):
        """Parent→child (1 level) should succeed."""
        lid, aid = _create_ledger_and_account(client, auth_headers)
        parent = _create_tx(client, auth_headers, lid, aid)
        assert parent.status_code == 201
        parent_id = parent.json()["id"]

        child = _create_tx(client, auth_headers, lid, aid, parent_id=parent_id)
        assert child.status_code == 201
        data = child.json()
        assert data["parent_transaction_id"] == parent_id

        # Verify child appears in parent's children
        parent_data = client.get(f"/api/v1/finance/transactions/{parent_id}", headers=auth_headers).json()
        assert len(parent_data["children"]) == 1
        assert parent_data["children"][0]["id"] == data["id"]

    def test_grandchild_rejected_on_create(self, client, auth_headers):
        """Creating a child under an already-child transaction must return 400."""
        lid, aid = _create_ledger_and_account(client, auth_headers)
        parent = _create_tx(client, auth_headers, lid, aid)
        parent_id = parent.json()["id"]
        child = _create_tx(client, auth_headers, lid, aid, parent_id=parent_id)
        child_id = child.json()["id"]

        # Attempt to nest under child → should fail
        resp = _create_tx(client, auth_headers, lid, aid, parent_id=child_id)
        assert resp.status_code == 400
        msg = resp.json()["message"].lower()
        assert "grandchild" in msg or "child" in msg

    def test_grandchild_rejected_on_update(self, client, auth_headers):
        """Setting parent_transaction_id on a tx that already has children must return 400."""
        lid, aid = _create_ledger_and_account(client, auth_headers)
        parent = _create_tx(client, auth_headers, lid, aid)
        parent_id = parent.json()["id"]

        # Create another tx and give it a child
        tx = _create_tx(client, auth_headers, lid, aid)
        tx_id = tx.json()["id"]
        _create_tx(client, auth_headers, lid, aid, parent_id=tx_id)

        # Try to make tx (which has children) a child of parent → should fail
        resp = client.put(f"/api/v1/finance/transactions/{tx_id}", json={
            "parent_transaction_id": parent_id,
        }, headers=auth_headers)
        assert resp.status_code == 400

    def test_self_parent_rejected(self, client, auth_headers):
        """Transaction cannot be its own parent."""
        lid, aid = _create_ledger_and_account(client, auth_headers)
        tx = _create_tx(client, auth_headers, lid, aid)
        tx_id = tx.json()["id"]

        resp = client.put(f"/api/v1/finance/transactions/{tx_id}", json={
            "parent_transaction_id": tx_id,
        }, headers=auth_headers)
        assert resp.status_code == 400
