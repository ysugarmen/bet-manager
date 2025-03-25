from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime
from app.utils.database import get_db
from app.models.side_bet import SideBet, UsersSideBet
from app.schemas.bet import SideBetResponse, UserSideBetResponse, BetChoiceModel
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/side-bets",
)
logger = get_logger("router.side_bet")


@router.get("/", response_model=List[SideBetResponse])
def get_all_side_bets(db: Session = Depends(get_db)):
    side_bets = db.query(SideBet).all()
    if not side_bets:
        raise HTTPException(status_code=404, detail="No side bets found")
    return side_bets


@router.get("/user/{user_id}", response_model=List[UserSideBetResponse])
def get_user_side_bets(user_id: int, db: Session = Depends(get_db)):
    user_side_bets = (
        db.query(UsersSideBet).filter(UsersSideBet.user_id == user_id).all()
    )
    if not user_side_bets:
        raise HTTPException(status_code=404, detail="No user side bets found")
    return user_side_bets


@router.post("/user/{user_id}/{side_bet_id}", response_model=UserSideBetResponse)
def place_user_side_bet(
    user_id: int,
    side_bet_id: int,
    bet_choice: BetChoiceModel,
    db: Session = Depends(get_db),
):
    side_bet = db.query(SideBet).filter(SideBet.id == side_bet_id).first()
    if not side_bet:
        raise HTTPException(status_code=404, detail="Side bet not found")
    new_user_side_bet = UsersSideBet(
        timestamp=datetime.utcnow(),
        user_id=user_id,
        side_bet_id=side_bet_id,
        bet_choice=bet_choice.bet_choice,
    )
    db.add(new_user_side_bet)
    db.commit()
    db.refresh(new_user_side_bet)
    return new_user_side_bet


@router.get("/user/{user_id}/{side_bet_id}", response_model=UserSideBetResponse)
def get_user_side_bet(user_id: int, side_bet_id: int, db: Session = Depends(get_db)):
    user_side_bet = (
        db.query(UsersSideBet)
        .filter(
            UsersSideBet.user_id == user_id, UsersSideBet.side_bet_id == side_bet_id
        )
        .first()
    )
    if not user_side_bet:
        raise HTTPException(status_code=404, detail="User side bet not found")
    return user_side_bet


@router.put("/user/{user_id}/{side_bet_id}", response_model=UserSideBetResponse)
def update_user_side_bet(
    user_id: int,
    side_bet_id: int,
    bet_choice: BetChoiceModel,
    db: Session = Depends(get_db),
):
    user_side_bet = (
        db.query(UsersSideBet)
        .filter(
            UsersSideBet.user_id == user_id, UsersSideBet.side_bet_id == side_bet_id
        )
        .first()
    )
    if not user_side_bet:
        raise HTTPException(status_code=404, detail="User side bet not found")
    user_side_bet.bet_choice = bet_choice.bet_choice
    user_side_bet.timestamp = datetime.utcnow()
    db.commit()
    db.refresh(user_side_bet)
    return user_side_bet


@router.delete("/user/{user_id}/{side_bet_id}")
def delete_user_side_bet(user_id: int, side_bet_id: int, db: Session = Depends(get_db)):
    user_side_bet = (
        db.query(UsersSideBet)
        .filter(
            UsersSideBet.user_id == user_id, UsersSideBet.side_bet_id == side_bet_id
        )
        .first()
    )
    if not user_side_bet:
        raise HTTPException(status_code=404, detail="User side bet not found")
    db.delete(user_side_bet)
    db.commit()
    return {"message": "User side bet deleted successfully"}
