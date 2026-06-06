"""Finance API routes."""

import os
import uuid as uuid_lib
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..middleware.auth import get_current_user
from ..models.finance import (
    Account,
    Attachment,
    Budget,
    Event,
    FinanceCategory,
    FinanceTag,
    Ledger,
    ResourceRelation,
    SplitItem,
    Transaction,
    TransactionType,
)
from ..models.todo import Todo
from ..models.user import User
from ..schemas.finance import (
    AccountCreate,
    AccountOut,
    AccountUpdate,
    AttachmentOut,
    BudgetCreate,
    BudgetOut,
    BudgetUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryStatsItem,
    CategoryUpdate,
    DashboardSummary,
    EventCreate,
    EventOut,
    EventSummary,
    EventUpdate,
    FinanceTagCreate,
    FinanceTagOut,
    LedgerCreate,
    LedgerOut,
    LedgerUpdate,
    RelationCreate,
    RelationOut,
    ReorderBatch,
    SplitItemOut,
    StatsResponse,
    TransactionCreate,
    TransactionListResponse,
    TransactionOut,
    TransactionUpdate,
    TrendStatsItem,
)

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])

CATEGORY_STATS_COLORS = (
    "#EF4444",
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#6C5CE7",
    "#14B8A6",
    "#F97316",
)


# --- Helpers ---


def _calc_account_balance(account_id: int, db: Session) -> Decimal:
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        return Decimal("0")
    income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.account_id == account_id,
            Transaction.type == TransactionType.income,
            Transaction.parent_transaction_id.is_(None),
        )
        .scalar()
    )
    expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.account_id == account_id,
            Transaction.type == TransactionType.expense,
            Transaction.parent_transaction_id.is_(None),
        )
        .scalar()
    )
    return (
        (account.initial_balance or Decimal("0"))
        + Decimal(str(income))
        - Decimal(str(expense))
    )


def _build_category_tree(categories):
    roots = [c for c in categories if c.parent_id is None]

    def build(cat):
        children = [c for c in categories if c.parent_id == cat.id]
        d = CategoryOut.model_validate(cat)
        d.children = [build(child) for child in children]
        return d

    return [build(root) for root in roots]


def _build_transaction_out(tx, db=None):
    d = TransactionOut.model_validate(tx)
    if tx.account:
        d.account = AccountOut.model_validate(tx.account)
    if tx.category:
        d.category = CategoryOut.model_validate(tx.category)
    if tx.event:
        d.event = EventOut.model_validate(tx.event)
    d.tags = [FinanceTagOut.model_validate(t) for t in (tx.tags or [])]
    d.split_items = [
        SplitItemOut.model_validate(s) for s in (tx.split_items or [])
    ]
    if db:
        rels = (
            db.query(ResourceRelation)
            .filter(
                ResourceRelation.from_type == "transaction",
                ResourceRelation.from_id == tx.id,
                ResourceRelation.relation_type == "related_to",
                ResourceRelation.to_type == "todo",
            )
            .all()
        )
        todo_ids = [r.to_id for r in rels]
        if todo_ids:
            todos = db.query(Todo).filter(Todo.id.in_(todo_ids)).all()
            d.linked_todos = [
                {"id": t.id, "title": t.title, "is_completed": t.is_completed}
                for t in todos
            ]
    if tx.children:
        d.children = [_build_transaction_out(c, db) for c in tx.children]
    return d


# --- Ledger ---


@router.get("/ledgers", response_model=list[LedgerOut])
def list_ledgers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Ledger)
        .filter(Ledger.user_id == current_user.id)
        .order_by(Ledger.created_at)
        .all()
    )


@router.post("/ledgers", response_model=LedgerOut, status_code=201)
def create_ledger(
    body: LedgerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ledger = Ledger(**body.model_dump(), user_id=current_user.id)
    db.add(ledger)
    db.commit()
    db.refresh(ledger)
    return ledger


@router.put("/ledgers/{ledger_id}", response_model=LedgerOut)
def update_ledger(
    ledger_id: int,
    body: LedgerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ledger = (
        db.query(Ledger)
        .filter(Ledger.id == ledger_id, Ledger.user_id == current_user.id)
        .first()
    )
    if not ledger:
        raise HTTPException(404, "ledger not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(ledger, key, val)
    db.commit()
    db.refresh(ledger)
    return ledger


@router.delete("/ledgers/{ledger_id}", status_code=204)
def delete_ledger(
    ledger_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ledger = (
        db.query(Ledger)
        .filter(Ledger.id == ledger_id, Ledger.user_id == current_user.id)
        .first()
    )
    if not ledger:
        raise HTTPException(404, "ledger not found")
    db.delete(ledger)
    db.commit()


# --- Account ---


@router.get("/accounts", response_model=list[AccountOut])
def list_accounts(
    ledger_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = (
        db.query(Account)
        .filter(
            Account.user_id == current_user.id,
            Account.ledger_id == ledger_id,
        )
        .order_by(Account.created_at)
        .all()
    )
    result = []
    for a in accounts:
        d = AccountOut.model_validate(a)
        d.current_balance = _calc_account_balance(a.id, db)
        result.append(d)
    return result


@router.post("/accounts", response_model=AccountOut, status_code=201)
def create_account(
    body: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = Account(**body.model_dump(), user_id=current_user.id)
    db.add(account)
    db.commit()
    db.refresh(account)
    d = AccountOut.model_validate(account)
    d.current_balance = account.initial_balance or Decimal("0")
    return d


@router.put("/accounts/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    body: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(404, "account not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(account, key, val)
    db.commit()
    db.refresh(account)
    d = AccountOut.model_validate(account)
    d.current_balance = _calc_account_balance(account.id, db)
    return d


@router.delete("/accounts/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.user_id == current_user.id)
        .first()
    )
    if not account:
        raise HTTPException(404, "account not found")
    db.delete(account)
    db.commit()


# --- Category ---


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    ledger_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    categories = (
        db.query(FinanceCategory)
        .filter(
            FinanceCategory.user_id == current_user.id,
            FinanceCategory.ledger_id == ledger_id,
        )
        .order_by(FinanceCategory.name)
        .all()
    )
    return _build_category_tree(categories)


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.parent_id:
        parent = (
            db.query(FinanceCategory)
            .filter(
                FinanceCategory.id == body.parent_id,
                FinanceCategory.user_id == current_user.id,
            )
            .first()
        )
        if not parent:
            raise HTTPException(404, "parent category not found")
    cat = FinanceCategory(**body.model_dump(), user_id=current_user.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = (
        db.query(FinanceCategory)
        .filter(
            FinanceCategory.id == category_id,
            FinanceCategory.user_id == current_user.id,
        )
        .first()
    )
    if not cat:
        raise HTTPException(404, "category not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(cat, key, val)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cat = (
        db.query(FinanceCategory)
        .filter(
            FinanceCategory.id == category_id,
            FinanceCategory.user_id == current_user.id,
        )
        .first()
    )
    if not cat:
        raise HTTPException(404, "category not found")
    db.delete(cat)
    db.commit()


# --- Tag ---


@router.get("/tags", response_model=list[FinanceTagOut])
def list_tags(
    ledger_id: int = Query(...),
    search: str = Query("", max_length=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(FinanceTag).filter(
        FinanceTag.user_id == current_user.id,
        FinanceTag.ledger_id == ledger_id,
    )
    if search:
        q = q.filter(FinanceTag.name.ilike(f"%{search}%"))
    return q.order_by(FinanceTag.name).all()


@router.post("/tags", response_model=FinanceTagOut, status_code=201)
def create_tag(
    body: FinanceTagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(FinanceTag)
        .filter(
            FinanceTag.user_id == current_user.id,
            FinanceTag.ledger_id == body.ledger_id,
            FinanceTag.name == body.name,
        )
        .first()
    )
    if existing:
        return existing
    tag = FinanceTag(**body.model_dump(), user_id=current_user.id)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/tags/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tag = (
        db.query(FinanceTag)
        .filter(FinanceTag.id == tag_id, FinanceTag.user_id == current_user.id)
        .first()
    )
    if not tag:
        raise HTTPException(404, "tag not found")
    db.delete(tag)
    db.commit()


# --- Transaction ---


@router.get("/transactions", response_model=TransactionListResponse)
def list_transactions(
    ledger_id: int = Query(...),
    account_id: int | None = Query(None),
    category_id: int | None = Query(None),
    tag_id: int | None = Query(None),
    event_id: int | None = Query(None),
    type: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    search: str | None = Query(None, max_length=200),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.ledger_id == ledger_id,
        Transaction.parent_transaction_id.is_(None),
    )
    if account_id is not None:
        q = q.filter(Transaction.account_id == account_id)
    if category_id is not None:
        q = q.filter(Transaction.category_id == category_id)
    if event_id is not None:
        q = q.filter(Transaction.event_id == event_id)
    if type:
        q = q.filter(Transaction.type == type)
    if start_date:
        q = q.filter(
            Transaction.occurred_at >= datetime.fromisoformat(start_date)
        )
    if end_date:
        q = q.filter(
            Transaction.occurred_at
            <= datetime.fromisoformat(end_date + "T23:59:59")
        )
    if search:
        q = q.filter(Transaction.note.ilike(f"%{search}%"))
    if tag_id is not None:
        q = q.join(Transaction.tags).filter(FinanceTag.id == tag_id)

    total = q.count()
    txs = (
        q.options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.event),
            joinedload(Transaction.tags),
            joinedload(Transaction.children),
            joinedload(Transaction.split_items).joinedload(SplitItem.category),
        )
        .order_by(Transaction.sort_order, Transaction.occurred_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return TransactionListResponse(
        items=[_build_transaction_out(tx, db) for tx in txs],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("/transactions/reorder", status_code=204)
def reorder_transactions(
    body: ReorderBatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ids = [item.id for item in body.items]
    txs = (
        db.query(Transaction)
        .filter(
            Transaction.id.in_(ids),
            Transaction.user_id == current_user.id,
        )
        .all()
    )
    if len(txs) != len(ids):
        raise HTTPException(404, "transaction not found")

    ledger_ids = {tx.ledger_id for tx in txs}
    parent_ids = {tx.parent_transaction_id for tx in txs}
    if len(ledger_ids) > 1 or len(parent_ids) > 1:
        raise HTTPException(
            400, "transactions must share the same ledger and parent"
        )

    order_map = {item.id: item.sort_order for item in body.items}
    for tx in txs:
        tx.sort_order = order_map[tx.id]
    db.commit()


@router.get("/transactions/{tx_id}", response_model=TransactionOut)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.event),
            joinedload(Transaction.tags),
            joinedload(Transaction.split_items).joinedload(SplitItem.category),
        )
        .filter(
            Transaction.id == tx_id, Transaction.user_id == current_user.id
        )
        .first()
    )
    if not tx:
        raise HTTPException(404, "transaction not found")
    return _build_transaction_out(tx, db)


def _validate_parent_depth(parent_id: int, user_id: int, db: Session):
    """Ensure parent transaction is not itself a child."""
    parent = (
        db.query(Transaction)
        .filter(
            Transaction.id == parent_id,
            Transaction.user_id == user_id,
        )
        .first()
    )
    if not parent:
        raise HTTPException(404, "parent transaction not found")
    if parent.parent_transaction_id is not None:
        raise HTTPException(400, "child transaction cannot have grandchild")
    return parent


def _child_total(
    parent_id: int, db: Session, exclude_tx_id: int | None = None
) -> Decimal:
    q = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.parent_transaction_id == parent_id,
    )
    if exclude_tx_id is not None:
        q = q.filter(Transaction.id != exclude_tx_id)
    return Decimal(str(q.scalar() or 0))


def _validate_child_total(
    parent: Transaction,
    child_amount: Decimal,
    db: Session,
    exclude_tx_id: int | None = None,
):
    """Ensure child transaction sums do not exceed the parent bill."""
    total = _child_total(parent.id, db, exclude_tx_id) + Decimal(
        str(child_amount)
    )
    parent_amount = Decimal(str(parent.amount or 0))
    if total > parent_amount:
        raise HTTPException(
            400, "child transaction total cannot exceed parent amount"
        )


@router.post("/transactions", response_model=TransactionOut, status_code=201)
def create_transaction(
    body: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    parent = None
    if body.parent_transaction_id is not None:
        parent = _validate_parent_depth(
            body.parent_transaction_id, current_user.id, db
        )
        if parent.ledger_id != body.ledger_id:
            raise HTTPException(
                400,
                "child transaction must belong to the same ledger as parent",
            )
        _validate_child_total(parent, body.amount, db)

    tx_data = {
        k: v
        for k, v in body.model_dump().items()
        if k
        not in ("tag_ids", "split_items", "attachment_ids", "linked_todo_ids")
    }
    if body.sort_order == 0:
        max_order = (
            db.query(func.max(Transaction.sort_order))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.ledger_id == body.ledger_id,
                Transaction.parent_transaction_id
                == body.parent_transaction_id,
            )
            .scalar()
        )
        tx_data["sort_order"] = (
            int(max_order if max_order is not None else -1) + 1
        )
    tx = Transaction(
        **tx_data, user_id=current_user.id, recorded_at=datetime.utcnow()
    )
    db.add(tx)
    db.flush()

    if body.tag_ids:
        tags = (
            db.query(FinanceTag)
            .filter(
                FinanceTag.id.in_(body.tag_ids),
                FinanceTag.user_id == current_user.id,
            )
            .all()
        )
        tx.tags = tags

    if body.attachment_ids:
        attachments = (
            db.query(Attachment)
            .filter(
                Attachment.id.in_(body.attachment_ids),
                Attachment.user_id == current_user.id,
            )
            .all()
        )
        tx.attachments = attachments

    if body.linked_todo_ids:
        for todo_id in body.linked_todo_ids:
            rel = ResourceRelation(
                from_type="transaction",
                from_id=tx.id,
                relation_type="related_to",
                to_type="todo",
                to_id=todo_id,
            )
            db.add(rel)

    for si_data in body.split_items:
        si = SplitItem(**si_data.model_dump(), transaction_id=tx.id)
        db.add(si)

    db.commit()
    db.refresh(tx)
    refreshed_tx = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.event),
            joinedload(Transaction.tags),
            joinedload(Transaction.attachments),
            joinedload(Transaction.children),
            joinedload(Transaction.split_items).joinedload(SplitItem.category),
        )
        .filter(Transaction.id == tx.id)
        .first()
    )
    if not refreshed_tx:
        raise HTTPException(404, "transaction not found")
    return _build_transaction_out(refreshed_tx, db)


@router.put("/transactions/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    body: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.id == tx_id, Transaction.user_id == current_user.id
        )
        .first()
    )
    if not tx:
        raise HTTPException(404, "transaction not found")

    update_data = {
        k: v
        for k, v in body.model_dump(exclude_unset=True).items()
        if k
        not in ("tag_ids", "split_items", "attachment_ids", "linked_todo_ids")
    }

    new_parent_id = update_data.get("parent_transaction_id")
    next_amount = update_data.get("amount", tx.amount)
    next_parent_id = (
        new_parent_id
        if "parent_transaction_id" in update_data
        else tx.parent_transaction_id
    )
    if "parent_transaction_id" in update_data and new_parent_id is not None:
        if new_parent_id == tx_id:
            raise HTTPException(400, "transaction cannot be its own parent")
        parent = _validate_parent_depth(new_parent_id, current_user.id, db)
        next_ledger_id = update_data.get("ledger_id", tx.ledger_id)
        if parent.ledger_id != next_ledger_id:
            raise HTTPException(
                400,
                "child transaction must belong to the same ledger as parent",
            )
        # Prevent making a parent (that has children) into a child
        children_count = (
            db.query(Transaction)
            .filter(
                Transaction.parent_transaction_id == tx_id,
            )
            .count()
        )
        if children_count > 0:
            raise HTTPException(
                400,
                (
                    "transaction with children cannot be nested under "
                    "another parent"
                ),
            )

    if next_parent_id is not None:
        parent = _validate_parent_depth(next_parent_id, current_user.id, db)
        _validate_child_total(parent, next_amount, db, exclude_tx_id=tx_id)
    elif "amount" in update_data:
        children_total = _child_total(tx_id, db)
        if children_total > Decimal(str(next_amount)):
            raise HTTPException(
                400,
                "parent amount cannot be less than child transaction total",
            )

    for key, val in update_data.items():
        setattr(tx, key, val)

    if body.tag_ids is not None:
        tags = (
            db.query(FinanceTag)
            .filter(
                FinanceTag.id.in_(body.tag_ids),
                FinanceTag.user_id == current_user.id,
            )
            .all()
        )
        tx.tags = tags

    if body.attachment_ids is not None:
        attachments = (
            db.query(Attachment)
            .filter(
                Attachment.id.in_(body.attachment_ids),
                Attachment.user_id == current_user.id,
            )
            .all()
        )
        tx.attachments = attachments

    if body.linked_todo_ids is not None:
        db.query(ResourceRelation).filter(
            ResourceRelation.from_type == "transaction",
            ResourceRelation.from_id == tx.id,
            ResourceRelation.relation_type == "related_to",
            ResourceRelation.to_type == "todo",
        ).delete()
        for todo_id in body.linked_todo_ids:
            rel = ResourceRelation(
                from_type="transaction",
                from_id=tx.id,
                relation_type="related_to",
                to_type="todo",
                to_id=todo_id,
            )
            db.add(rel)

    if body.split_items is not None:
        db.query(SplitItem).filter(SplitItem.transaction_id == tx.id).delete()
        for si_data in body.split_items:
            si = SplitItem(**si_data.model_dump(), transaction_id=tx.id)
            db.add(si)

    db.commit()
    db.refresh(tx)
    refreshed_tx = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.event),
            joinedload(Transaction.tags),
            joinedload(Transaction.attachments),
            joinedload(Transaction.children),
            joinedload(Transaction.split_items).joinedload(SplitItem.category),
        )
        .filter(Transaction.id == tx.id)
        .first()
    )
    if not refreshed_tx:
        raise HTTPException(404, "transaction not found")
    return _build_transaction_out(refreshed_tx, db)


@router.delete("/transactions/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = (
        db.query(Transaction)
        .filter(
            Transaction.id == tx_id, Transaction.user_id == current_user.id
        )
        .first()
    )
    if not tx:
        raise HTTPException(404, "transaction not found")
    db.query(ResourceRelation).filter(
        ResourceRelation.from_type == "transaction",
        ResourceRelation.from_id == tx_id,
    ).delete()
    db.delete(tx)
    db.commit()


# --- Event ---


@router.get("/events", response_model=list[EventOut])
def list_events(
    ledger_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    events = (
        db.query(Event)
        .filter(
            Event.user_id == current_user.id,
            Event.ledger_id == ledger_id,
        )
        .order_by(Event.start_at.desc().nullslast())
        .all()
    )
    result = []
    for ev in events:
        d = EventOut.model_validate(ev)
        d.transaction_count = (
            db.query(func.count(Transaction.id))
            .filter(
                Transaction.event_id == ev.id,
            )
            .scalar()
            or 0
        )
        total = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.event_id == ev.id,
        ).scalar() or Decimal("0")
        d.total_amount = total
        result.append(d)
    return result


@router.post("/events", response_model=EventOut, status_code=201)
def create_event(
    body: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = Event(**body.model_dump(), user_id=current_user.id)
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev


@router.put("/events/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    body: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not ev:
        raise HTTPException(404, "event not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(ev, key, val)
    db.commit()
    db.refresh(ev)
    return ev


@router.delete("/events/{event_id}", status_code=204)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not ev:
        raise HTTPException(404, "event not found")
    db.delete(ev)
    db.commit()


@router.get("/events/{event_id}/summary", response_model=EventSummary)
def event_summary(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ev = (
        db.query(Event)
        .filter(Event.id == event_id, Event.user_id == current_user.id)
        .first()
    )
    if not ev:
        raise HTTPException(404, "event not found")
    txs = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.tags),
        )
        .filter(
            Transaction.event_id == event_id,
            Transaction.user_id == current_user.id,
        )
        .order_by(Transaction.occurred_at.desc())
        .all()
    )

    event_out = EventOut.model_validate(ev)
    event_out.transaction_count = len(txs)
    amounts = [tx.amount or Decimal("0") for tx in txs]
    event_out.total_amount = sum(amounts, Decimal("0"))
    total_expense = sum(
        (
            a
            for tx, a in zip(txs, amounts)
            if tx.type == TransactionType.expense
        ),
        Decimal("0"),
    )
    total_income = sum(
        (
            a
            for tx, a in zip(txs, amounts)
            if tx.type == TransactionType.income
        ),
        Decimal("0"),
    )

    return EventSummary(
        event=event_out,
        transactions=[_build_transaction_out(tx, db) for tx in txs],
        total_expense=total_expense,
        total_income=total_income,
    )


# --- Budget ---


def _calc_budget_spent(budget, db):
    q = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == budget.user_id,
        Transaction.ledger_id == budget.ledger_id,
        Transaction.type == TransactionType.expense,
        Transaction.parent_transaction_id.is_(None),
    )
    filters = budget.filters or {}
    if filters.get("category_ids"):
        q = q.filter(Transaction.category_id.in_(filters["category_ids"]))
    if filters.get("tag_ids"):
        q = q.join(Transaction.tags).filter(
            FinanceTag.id.in_(filters["tag_ids"])
        )
    if filters.get("event_ids"):
        q = q.filter(Transaction.event_id.in_(filters["event_ids"]))
    return q.scalar() or Decimal("0")


@router.get("/budgets", response_model=list[BudgetOut])
def list_budgets(
    ledger_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.ledger_id == ledger_id,
        )
        .all()
    )
    result = []
    for b in budgets:
        d = BudgetOut.model_validate(b)
        spent = _calc_budget_spent(b, db)
        d.current_spent = spent
        d.progress_pct = (
            float(spent / b.amount * 100) if b.amount and b.amount > 0 else 0.0
        )
        result.append(d)
    return result


@router.post("/budgets", response_model=BudgetOut, status_code=201)
def create_budget(
    body: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = Budget(**body.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    d = BudgetOut.model_validate(budget)
    d.current_spent = Decimal("0")
    d.progress_pct = 0.0
    return d


@router.put("/budgets/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(404, "budget not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(budget, key, val)
    db.commit()
    db.refresh(budget)
    d = BudgetOut.model_validate(budget)
    spent = _calc_budget_spent(budget, db)
    d.current_spent = spent
    d.progress_pct = (
        float(spent / budget.amount * 100)
        if budget.amount and budget.amount > 0
        else 0.0
    )
    return d


@router.delete("/budgets/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(404, "budget not found")
    db.delete(budget)
    db.commit()


# --- Attachments ---

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post(
    "/attachments/upload", response_model=AttachmentOut, status_code=201
)
def upload_attachment(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "file")[1]
    safe_name = f"{current_user.id}_{uuid_lib.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    attachment = Attachment(
        user_id=current_user.id,
        url=f"/uploads/{safe_name}",
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return AttachmentOut.model_validate(attachment)


# --- Relations ---


@router.get("/relations", response_model=list[RelationOut])
def list_relations(
    from_type: str = Query(...),
    from_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ResourceRelation)
        .filter(
            ResourceRelation.from_type == from_type,
            ResourceRelation.from_id == from_id,
        )
        .all()
    )


@router.post("/relations", response_model=RelationOut, status_code=201)
def create_relation(
    body: RelationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rel = ResourceRelation(**body.model_dump())
    db.add(rel)
    db.commit()
    db.refresh(rel)
    return rel


@router.delete("/relations/{relation_id}", status_code=204)
def delete_relation(
    relation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rel = (
        db.query(ResourceRelation)
        .filter(ResourceRelation.id == relation_id)
        .first()
    )
    if not rel:
        raise HTTPException(404, "relation not found")
    db.delete(rel)
    db.commit()


# --- Dashboard ---


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(
    ledger_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total_assets = Decimal("0")
    accounts = (
        db.query(Account)
        .filter(
            Account.user_id == current_user.id,
            Account.ledger_id == ledger_id,
        )
        .all()
    )
    for a in accounts:
        total_assets += _calc_account_balance(a.id, db)

    month_income = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.ledger_id == ledger_id,
        Transaction.type == TransactionType.income,
        Transaction.occurred_at >= month_start,
        Transaction.parent_transaction_id.is_(None),
    ).scalar() or Decimal("0")

    month_expense = db.query(
        func.coalesce(func.sum(Transaction.amount), 0)
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.ledger_id == ledger_id,
        Transaction.type == TransactionType.expense,
        Transaction.occurred_at >= month_start,
        Transaction.parent_transaction_id.is_(None),
    ).scalar() or Decimal("0")

    recent_txs = (
        db.query(Transaction)
        .options(
            joinedload(Transaction.account),
            joinedload(Transaction.category),
            joinedload(Transaction.tags),
        )
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.ledger_id == ledger_id,
            Transaction.parent_transaction_id.is_(None),
        )
        .order_by(Transaction.occurred_at.desc())
        .limit(10)
        .all()
    )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.ledger_id == ledger_id,
        )
        .all()
    )
    budget_list = []
    max_usage = 0.0
    for b in budgets:
        d = BudgetOut.model_validate(b)
        spent = _calc_budget_spent(b, db)
        d.current_spent = spent
        d.progress_pct = (
            float(spent / b.amount * 100) if b.amount and b.amount > 0 else 0.0
        )
        budget_list.append(d)
        if d.progress_pct > max_usage:
            max_usage = d.progress_pct

    return DashboardSummary(
        total_assets=total_assets,
        month_income=Decimal(str(month_income)),
        month_expense=Decimal(str(month_expense)),
        budget_usage_pct=max_usage,
        recent_transactions=[
            _build_transaction_out(tx, db) for tx in recent_txs
        ],
        budgets=budget_list,
    )


# --- Stats ---


@router.get("/stats", response_model=StatsResponse)
def get_stats(
    ledger_id: int = Query(...),
    period: str = Query("month"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    if period == "week":
        start = now - timedelta(days=7)
    elif period == "year":
        start = now - timedelta(days=365)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.ledger_id == ledger_id,
            Transaction.type == TransactionType.expense,
            Transaction.occurred_at >= start,
            Transaction.parent_transaction_id.is_(None),
        )
        .options(joinedload(Transaction.category))
        .all()
    )

    cat_totals: dict[str, Decimal] = {}
    cat_icons: dict[str, str] = {}
    for tx in txs:
        cat_name = tx.category.name if tx.category else "未分类"
        cat_icon = tx.category.icon if tx.category else "\U0001f4c2"
        cat_totals[cat_name] = cat_totals.get(cat_name, Decimal("0")) + (
            tx.amount or Decimal("0")
        )
        cat_icons[cat_name] = cat_icon
    category_data: list[CategoryStatsItem] = [
        CategoryStatsItem(
            category_name=name,
            category_icon=cat_icons[name],
            total=total,
            color=CATEGORY_STATS_COLORS[index % len(CATEGORY_STATS_COLORS)],
        )
        for index, (name, total) in enumerate(
            sorted(cat_totals.items(), key=lambda item: item[1], reverse=True)
        )
    ]

    trend_data: list[TrendStatsItem] = []
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        if m <= 0:
            m += 12
            y -= 1
        month_label = f"{y}-{m:02d}"
        m_start = datetime(y, m, 1)
        if m == 12:
            m_end = datetime(y + 1, 1, 1)
        else:
            m_end = datetime(y, m + 1, 1)
        income = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.ledger_id == ledger_id,
            Transaction.type == TransactionType.income,
            Transaction.occurred_at >= m_start,
            Transaction.occurred_at < m_end,
            Transaction.parent_transaction_id.is_(None),
        ).scalar() or Decimal("0")
        expense = db.query(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).filter(
            Transaction.user_id == current_user.id,
            Transaction.ledger_id == ledger_id,
            Transaction.type == TransactionType.expense,
            Transaction.occurred_at >= m_start,
            Transaction.occurred_at < m_end,
            Transaction.parent_transaction_id.is_(None),
        ).scalar() or Decimal("0")
        trend_data.append(
            TrendStatsItem(month=month_label, income=income, expense=expense)
        )

    return StatsResponse(category_data=category_data, trend_data=trend_data)
