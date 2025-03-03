from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.utils.database import get_db
from app.models.bet import Bet
from app.models.game import Game
from app.models.user import User
from app.schemas.bet import BetCreate, BetResponse, BetState
from app.utils.logger import get_logger

router = APIRouter(
    prefix="/bets",
)

logger = get_logger("router.bet")


@router.post("/", response_model=dict)
def create_bet(bet_request: BetCreate, db: Session = Depends(get_db)):
    """
    Place a new bet and update the user's budget accordingly.
    """
    logger.info(
        f"Creating a new bet for user {bet_request.user_id} on game {bet_request.game_id}"
    )

    user = db.query(User).filter(User.id == bet_request.user_id).first()
    game = db.query(Game).filter(Game.id == bet_request.game_id).first()

    if not game or not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User or Game not found"
        )

    gameday = str(game.match_time.date())

    # Ensure user has a budget for the gameday
    if gameday not in user.gameday_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No budget allocated for this gameday",
        )

    if user.gameday_budget[gameday] < bet_request.bet_amount:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough budget for this gameday",
        )

    # Deduct budget
    budget_updated = user.update_gameday_budget(gameday, bet_request.bet_amount, db)
    if not budget_updated:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Budget deduction failed"
        )

    updated_budget = user.gameday_budget[
        gameday
    ]  # ✅ Now correctly defined after commit

    # Create the new bet
    new_bet = Bet(
        user_id=bet_request.user_id,
        game_id=bet_request.game_id,
        bet_choice=bet_request.bet_choice,
        bet_state=BetState.editable,
        amount=bet_request.bet_amount,
        reward=None,
    )

    db.add(new_bet)
    db.commit()
    db.refresh(new_bet)

    logger.info(f"✅ Bet {new_bet.id} placed. Updated budget: {updated_budget} coins.")

    return {
        "bet": {
            "id": new_bet.id,
            "user_id": new_bet.user_id,
            "game_id": new_bet.game_id,
            "bet_choice": new_bet.bet_choice,
            "bet_amount": new_bet.amount,
        },
        "updated_budget": updated_budget,
    }


@router.put("/{bet_id}", response_model=BetResponse)
def update_bet(bet_id: int, bet_request: BetCreate, db: Session = Depends(get_db)):
    """
    Update an existing bet. Only allowed if bet_state is "upcoming".
    The user **must still have enough budget** after modification.
    """
    logger.info(f"Updating bet {bet_id} for user {bet_request.user_id}")

    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    user = db.query(User).filter(User.id == bet.user_id).first()
    game = db.query(Game).filter(Game.id == bet.game_id).first()
    if not bet or not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bet not found"
        )
    gameday = str(game.match_time.date())
    amount_diff = bet.amount - bet_request.bet_amount
    bet.amount = bet_request.bet_amount
    user.update_gameday_budget(gameday, -(amount_diff), db)
    bet.bet_choice = bet_request.bet_choice
    db.commit()
    logger.info(
        f"✅ Bet {bet.id} updated. Remaining budget: {user.gameday_budget[gameday]} coins."
    )

    return bet


@router.get("/user/{user_id}/bets", response_model=List[BetResponse])
def get_user_bets(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all bets for a user
    """
    logger.info(f"Retrieving all bets for user {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User with id {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    bets = user.bets
    for bet in bets:
        bet.update_state()
    db.commit()
    logger.info(f"Found {len(bets)} bets for user {user_id}")
    return bets


@router.get("/user/{user_id}/bets/upcoming", response_model=List[BetResponse])
def get_user_upcoming_bets(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all upcoming bets for a user
    """
    logger.info(f"Retrieving all upcoming bets for user {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User with id {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    upcoming_bets = (
        db.query(Bet)
        .filter(Bet.user_id == user_id, Bet.bet_state == BetState.editable)
        .all()
    )
    formatted_bets = [
        {
            "id": bet.id,
            "user_id": bet.user_id,
            "game_id": bet.game_id,
            "bet_choice": str(bet.bet_choice),  # Convert to string
            "bet_amount": float(bet.amount)
            if bet.amount is not None
            else 0.0,  # Default to 0 if missing
        }
        for bet in upcoming_bets
    ]

    logger.info(f"Found {len(formatted_bets)} upcoming bets for user {user_id}")
    return formatted_bets


@router.get("/user/{user_id}/bets/history", response_model=List[BetResponse])
def get_user_history_bets(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all history bets for a user
    """
    logger.info(f"Retrieving all history bets for user {user_id}")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User with id {user_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    history_bets = (
        db.query(Bet)
        .filter(Bet.user_id == user_id, Bet.bet_state == BetState.locked)
        .all()
    )
    logger.info(f"Found {len(history_bets)} history bets for user {user_id}")
    return history_bets


### 🔹 **Retrieve a Bet for a Specific User & Game**
@router.get("/user/{user_id}/game/{game_id}", response_model=BetResponse)
def get_user_game_bet(user_id: int, game_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a bet for a user on a specific game.
    """
    logger.info(f"Retrieving bet for user {user_id} for game {game_id}")
    bet = db.query(Bet).filter(Bet.user_id == user_id, Bet.game_id == game_id).first()
    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bet not found"
        )

    bet.update_bet_state()
    db.commit()
    return bet


### 🔹 **Calculate Reward for a Bet**
@router.put("/{bet_id}/calculate-reward")
def calculate_reward(bet_id: int, db: Session = Depends(get_db)):
    """
    Calculate the reward for a bet.
    """
    logger.info(f"Calculating reward for bet with id {bet_id}")
    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    if not bet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bet not found"
        )

    game = Game.get_by_id(db, bet.game_id)
    if not game.game_winner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Game has no result yet"
        )

    points = Bet.calculate_reward(game)
    bet.bet_state = BetState.history  # ✅ Mark as history when reward is assigned
    db.commit()
    return {"bet_id": bet_id, "reward": points}


### 🔹 **Delete a Bet (Only Allowed for "Upcoming" Bets)**
@router.delete("/{bet_id}")
def delete_bet(bet_id: int, db: Session = Depends(get_db)):
    """
    Delete a bet by ID. Users **cannot delete locked or history bets**.
    """
    logger.info(f"Deleting bet with id {bet_id}")
    bet = db.query(Bet).filter(Bet.id == bet_id).first()
    user = db.query(User).filter(User.id == bet.user_id).first()
    game = db.query(Game).filter(Game.id == bet.game_id).first()
    if not bet or not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bet not found"
        )
    gameday = str(game.match_time.date())
    user.update_gameday_budget(gameday, -(bet.amount), db)  # Refund user
    db.delete(bet)
    db.commit()
    return {"message": "Bet deleted"}
