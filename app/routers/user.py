from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.models import Base
from app.models.user import User
from app.models.betting_league import BettingLeague
from app.utils.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.bet import BetResponse
from app.schemas.betting_league import BettingLeagueResponse
from app.utils.auth import create_access_token, pwd_context, get_current_user
from app.services.user_gameday_budget_setter import set_gameday_budget
from app.utils.logger import get_logger
from datetime import datetime



# Router setup
router = APIRouter(
    prefix="/users",
)

logger = get_logger("router.user")

# Routes
@router.post("/login", response_model=dict)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Login using username and password.
    """
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        logger.error(f"Invalid login attempt for user {user.username}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    access_token = create_access_token(user_id=db_user.id)
    logger.info(f"User {user.username} logged in successfully")
    return {
        "access_token": access_token,
          "token_type": "bearer",
          "user": {
              "id": db_user.id,
              "username": db_user.username,
              "email": db_user.email,
              "points": db_user.points,
          },
    }


@router.post("/register", response_model=dict)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        logger.error(f"User {user.username} already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        last_updated_at=datetime.utcnow())
    
    gameday_budget_dict = set_gameday_budget(db)
    new_user.gameday_budget = gameday_budget_dict

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"User {user.username} registered successfully")
    access_token = create_access_token(user_id=new_user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout():
    """
    Logout the user.
    """
    return {"message": "Successfully logged out"}


@router.get("/user", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        betting_leagues=user.betting_leagues,
    )

@router.post("/{user_id}/update_points")
def update_user_points(user_id: int, db: Session = Depends(get_db)):
    """
    Calculate the user's points based on their bets.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} does not exist")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    total_points = user.points
    for bet in user.bets:
        if bet.reward:
            total_points += bet.reward
    
    user.points = total_points
    db.commit()
    logger.info(f"User {user_id} points updated successfully")

@router.get("/{user_id}/points")
def get_user_points(user_id: int, db: Session = Depends(get_db)):
    """
    Get the user's points.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} does not exist")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {"points": user.points}

@router.get("/{user_id}/bets", response_model=List[BetResponse])
def get_user_bets(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all bets for a user.
    """
    logger.info(f"Retrieving all bets for user {user_id}")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    bets = user.bets
    bet_list = []
    for bet in bets:
        bet_list.append({
            "id": bet.id,
            "user_id": bet.user_id,
            "game_id": bet.game_id,
            "bet_choice": bet.bet_choice,
            "bet_amount": bet.amount,  # ✅ Explicitly include bet_amount
        })

    return bet_list

@router.get("/{user_id}/gameday_budget/{selected_date}", response_model=dict)
def get_gameday_budget(user_id: int, selected_date: str, db: Session = Depends(get_db)):
    """
    Retrieve the user's gameday budget for a specific gameday.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User with id {user_id} not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    budget = user.gameday_budget[selected_date]
    if budget is None:
        logger.warning(f"User {user_id} does not have a budget for gameday {selected_date}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    return {"budget": budget}


@router.get("/leaderboard", response_model=list[dict])
def get_leaderboard(db: Session = Depends(get_db)):
    """
    Retrieve the leaderboard for all users.
    """
    users = db.query(User).order_by(User.points.desc()).all()
    if not users:
        return []  # ✅ Ensure response is always an array

    return [{"username": user.username, "points": user.points} for user in users]


@router.get("/{user_id}/leagues", response_model=list[BettingLeagueResponse])
def get_user_leagues(user_id: int, db: Session = Depends(get_db)):
    """
    Get all leagues that a user is part of.
    """
    logger.info(f"Fetching leagues for user {user_id}")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    leagues = db.query(BettingLeague).filter(BettingLeague.id.in_(user.betting_leagues)).all()
    
    return [{"id": league.id, "name": league.name, "code": league.code, "members": league.members} for league in leagues]
