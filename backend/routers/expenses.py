import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models.db import Expense, ExpenseSplit, TripMember, User
from routers.guards import require_preferences_submitted
from routers.stream import publish

router = APIRouter()


class ExpenseCreate(BaseModel):
    amount: int  # in paise (₹1 = 100 paise)
    category: str
    paid_by: str  # user_id
    split_type: str  # equal | custom | category_owner
    description: Optional[str] = None
    member_splits: Optional[dict[str, int]] = None  # user_id -> amount_owed (for custom)


@router.post("/{trip_id}/expenses", status_code=201)
async def log_expense(
    trip_id: str,
    body: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    paid_by = uuid.UUID(body.paid_by)
    paid_member = await db.execute(
        select(TripMember).where(
            TripMember.trip_id == trip_uuid,
            TripMember.user_id == paid_by,
        )
    )
    if paid_member.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payer is not a trip member")
    expense = Expense(
        trip_id=trip_uuid,
        amount=body.amount,
        category=body.category,
        paid_by=paid_by,
        split_type=body.split_type,
        description=body.description,
    )
    db.add(expense)
    await db.flush()

    splits: list[ExpenseSplit] = []
    if body.split_type == "custom" and body.member_splits:
        for user_id, amount in body.member_splits.items():
            splits.append(
                ExpenseSplit(
                    expense_id=expense.id,
                    user_id=uuid.UUID(user_id),
                    amount_owed=amount,
                )
            )
    else:
        members_result = await db.execute(
            select(TripMember).where(TripMember.trip_id == trip_uuid)
        )
        members = members_result.scalars().all()
        if not members:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No members to split")
        per = body.amount // len(members)
        remainder = body.amount - (per * len(members))
        for idx, member in enumerate(members):
            amount_owed = per + (remainder if idx == 0 else 0)
            splits.append(
                ExpenseSplit(
                    expense_id=expense.id,
                    user_id=member.user_id,
                    amount_owed=amount_owed,
                )
            )
    for split in splits:
        db.add(split)

    await publish(trip_id, "expense_added", {"amount": body.amount, "category": body.category, "paid_by": body.paid_by})
    return {"id": str(expense.id)}


@router.get("/{trip_id}/expenses")
async def list_expenses(
    trip_id: str,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    query = select(Expense).where(Expense.trip_id == trip_uuid)
    if category:
        query = query.where(Expense.category == category)
    result = await db.execute(query)
    expenses = result.scalars().all()
    return [
        {
            "id": str(expense.id),
            "amount": expense.amount,
            "category": expense.category,
            "paid_by": str(expense.paid_by),
            "split_type": expense.split_type,
            "description": expense.description,
            "created_at": expense.created_at,
        }
        for expense in expenses
    ]


@router.get("/{trip_id}/expenses/summary")
async def expense_summary(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    paid_result = await db.execute(select(Expense).where(Expense.trip_id == trip_uuid))
    expenses = paid_result.scalars().all()
    splits_result = await db.execute(
        select(ExpenseSplit).join(Expense).where(Expense.trip_id == trip_uuid)
    )
    splits = splits_result.scalars().all()

    paid_totals: dict[str, int] = {}
    owed_totals: dict[str, int] = {}
    for expense in expenses:
        paid_totals[str(expense.paid_by)] = paid_totals.get(str(expense.paid_by), 0) + expense.amount
    for split in splits:
        owed_totals[str(split.user_id)] = owed_totals.get(str(split.user_id), 0) + split.amount_owed

    all_users = set(paid_totals.keys()) | set(owed_totals.keys())
    return [
        {
            "user_id": user_id,
            "paid": paid_totals.get(user_id, 0),
            "owed": owed_totals.get(user_id, 0),
            "net": paid_totals.get(user_id, 0) - owed_totals.get(user_id, 0),
        }
        for user_id in all_users
    ]


@router.get("/{trip_id}/expenses/settlement")
async def settlement(
    trip_id: str,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user),
):
    trip_uuid = uuid.UUID(trip_id)
    await require_preferences_submitted(db, trip_uuid, user.id)

    summary = await expense_summary(trip_id, db=db, user=user)
    balances = {item["user_id"]: item["net"] for item in summary}
    if not balances:
        return []

    creditors = [(uid, amt) for uid, amt in balances.items() if amt > 0]
    debtors = [(uid, -amt) for uid, amt in balances.items() if amt < 0]

    settlements = []
    ci = 0
    di = 0
    while ci < len(creditors) and di < len(debtors):
        c_uid, c_amt = creditors[ci]
        d_uid, d_amt = debtors[di]
        pay = min(c_amt, d_amt)
        settlements.append({"from": d_uid, "to": c_uid, "amount": pay})
        c_amt -= pay
        d_amt -= pay
        creditors[ci] = (c_uid, c_amt)
        debtors[di] = (d_uid, d_amt)
        if c_amt == 0:
            ci += 1
        if d_amt == 0:
            di += 1

    users_result = await db.execute(select(User).where(User.id.in_([uuid.UUID(u) for u in balances.keys()])))
    users = {str(u.id): u for u in users_result.scalars().all()}

    return [
        {
            "from_user": {"id": uid, "name": users.get(uid).name if users.get(uid) else "", "avatar_url": users.get(uid).avatar_url if users.get(uid) else None},
            "to_user": {"id": to, "name": users.get(to).name if users.get(to) else "", "avatar_url": users.get(to).avatar_url if users.get(to) else None},
            "amount": amount,
            "settled": False,
        }
        for uid, to, amount in [(s["from"], s["to"], s["amount"]) for s in settlements]
    ]
