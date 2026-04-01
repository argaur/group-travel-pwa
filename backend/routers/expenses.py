from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ExpenseCreate(BaseModel):
    amount: int  # in paise (₹1 = 100 paise)
    category: str
    paid_by: str  # user_id
    split_type: str  # equal | custom | category_owner
    description: Optional[str] = None
    member_splits: Optional[dict[str, int]] = None  # user_id -> amount_owed (for custom)


@router.post("/{trip_id}/expenses", status_code=201)
async def log_expense(trip_id: str, body: ExpenseCreate):
    raise NotImplementedError


@router.get("/{trip_id}/expenses")
async def list_expenses(trip_id: str, category: Optional[str] = None):
    raise NotImplementedError


@router.get("/{trip_id}/expenses/summary")
async def expense_summary(trip_id: str):
    # TODO: return per-person totals
    raise NotImplementedError


@router.get("/{trip_id}/expenses/settlement")
async def settlement(trip_id: str):
    # TODO: calculate net balances (minimize transactions algo), return Razorpay UPI payload
    raise NotImplementedError
