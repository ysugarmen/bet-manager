from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.models.betting_league import BettingLeague
from app.models.user import User
from app.utils.database import get_db
from app.utils.logger import get_logger
from app.schemas.betting_league import BettingLeagueCreate, BettingLeagueResponse
from app.schemas.user import UserResponse
from app.schemas.chat_message import ChatMessageCreate, ChatMessageResponse
from datetime import datetime
from typing import List


# Router setup
router = APIRouter(prefix="/betting-leagues")
logger = get_logger("router.betting_league")


@router.post("/", response_model=BettingLeagueResponse)
def create_betting_league(betting_league_request: BettingLeagueCreate, db: Session = Depends(get_db)):
    """
    Create a new betting league.
    """
    logger.info(f"Creating a new betting league: {betting_league_request.name}")
    manager = db.query(User).filter(User.id == betting_league_request.manager_id).first()
    
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    members = [{"id": manager.id, "username": manager.username, "points": manager.points}]
    
    new_league = BettingLeague(
        name=betting_league_request.name,
        description=betting_league_request.description,
        manager_id=betting_league_request.manager_id,
        members=members,
        created_at=datetime.utcnow(),
        public=betting_league_request.public,
        group_picture=betting_league_request.group_picture,  # ✅ Store picture URL
    )

    new_league.generate_code(db)
    db.add(new_league)
    db.commit()
    db.refresh(new_league)

    logger.info(f"New betting league created: {new_league.name}")
    return new_league

@router.get("/", response_model=list[BettingLeagueResponse])
def get_all_betting_leagues(db: Session = Depends(get_db)):
    """
    Get all the betting leagues.
    """
    leagues = db.query(BettingLeague).all()
    if not leagues:
        raise HTTPException(status_code=404, detail="No betting leagues found")
    
    return [BettingLeagueResponse(
        id=league.id,
        name=league.name,
        members=league.members,
        code=league.code
    ) for league in leagues]

@router.get("/public", response_model=list[BettingLeagueResponse])
def get_all_public_betting_leagues(db: Session = Depends(get_db)):
    """
    Get all the public betting leagues.
    """
    leagues = db.query(BettingLeague).filter(BettingLeague.public == True).all()

    if not leagues:
        raise HTTPException(status_code=404, detail="No public betting leagues found")
    
    return [
        BettingLeagueResponse(
            id=league.id,
            name=league.name,
            description=league.description,
            group_picture=league.group_picture,
            manager_id=league.manager_id,
            num_members=len(league.members),
            members=league.members,
            code=league.code
        )
        for league in leagues
    ]

@router.get("/{league_id}", response_model=BettingLeagueResponse)
def get_betting_league(league_id: int, db: Session = Depends(get_db)):
    """
    Get a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="Betting league not found")
    
    return BettingLeagueResponse(
        id=league.id,
        name=league.name,
        description=league.description,
        manager_id=league.manager_id,
        members=league.members,
        num_members=len(league.members),
        code=league.code
    )


@router.get("/find-by-code/{league_code}", response_model=BettingLeagueResponse)
def get_league_by_code(league_code: str, db: Session = Depends(get_db)):
    """
    Retrieve a betting league by its invitation code.
    """
    league = db.query(BettingLeague).filter(BettingLeague.code == league_code).first()

    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    return BettingLeagueResponse(
        id=league.id,
        name=league.name,
        description=league.description,
        manager_id=league.manager_id,
        members=league.members,
        num_members=len(league.members),
        code=league.code
    )


@router.delete("/{league_id}")
def delete_betting_league(league_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="Betting league not found")

    db.delete(league)
    db.commit()
    logger.info(f"Betting league deleted: {league.name}")
    return {"message": "Betting league successfully deleted"}


@router.put("/{league_id}", response_model=BettingLeagueResponse)
def update_betting_league(league_id: int, league_request: BettingLeagueCreate, db: Session = Depends(get_db)):
    """
    Update a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="Betting league not found")

    league.name = league_request.name
    league.description = league_request.description
    league.public = league_request.public
    league.group_picture = league_request.group_picture  # ✅ Allow updating picture

    db.commit()
    db.refresh(league)

    return league


@router.post("/{league_id}/join/{user_id}")
def join_betting_league(league_id: int, user_id: int, code: str = None, db: Session = Depends(get_db)):
    """
    Allows a user to join a public betting league without a code,
    and a private betting league with a code.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    user = db.query(User).filter(User.id == user_id).first()

    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If league is private, require a code
    if not league.public and league.code != code:
        raise HTTPException(status_code=400, detail="Incorrect league code")

    # Ensure user is not already a member
    if any(member["id"] == user_id for member in league.members):
        raise HTTPException(status_code=400, detail="User already in league")

    # Update league members list
    league.members.append({"id": user.id, "username": user.username, "points": user.points})
    flag_modified(league, "members")
    # Update user's betting leagues
    user.join_league(league, db)  # ✅ Pass `db` to ensure update is tracked

    # Explicitly add both objects to session
    db.add(league)
    db.add(user)

    db.commit()  # ✅ Commit both changes at once

    return {"message": f"User {user.username} joined league {league.name}"}


@router.post("/{league_id}/leave/{user_id}")
def leave_betting_league(league_id: int, user_id: int, db: Session = Depends(get_db)):
    """
    Allows a user to leave a betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    league.members = [member for member in league.members if member["id"] != user_id]

    flag_modified(league, "members")
    user.leave_league(league_id, db)
    db.add(league)
    db.add(user)
    db.commit()
    
    return {"message": f"User {user.username} left league {league.name}"}

@router.get("/{league_id}/leaderboard", response_model=list[UserResponse])
def get_league_leaderboard(league_id: int, db: Session = Depends(get_db)):
    """
    Get the leaderboard for a specific betting league using the 'members' field.
    """
    # Fetch the league using the league_id
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()

    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    
    # Get the list of user IDs from the 'members' field (extracting 'id' from each member dictionary)
    member_ids = [member["id"] for member in league.members]

    # Fetch all users who are members of the league
    users = db.query(User).filter(User.id.in_(member_ids)).all()

    # Sort users by points in descending order
    users = sorted(users, key=lambda user: user.points, reverse=True)

    # Return a list of user objects with points and username
    return [UserResponse(
        id=user.id,
        username=user.username,
        points=user.points
    ) for user in users]


# Group chat routes
@router.post("/{league_id}/chat", response_model=ChatMessageResponse)
def send_chat_message(league_id: int, message_request: ChatMessageCreate, db: Session = Depends(get_db)):
    """
    Send a message to the group chat of a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    user = db.query(User).filter(User.id == message_request.user_id).first()
    if not any(member["id"] == user.id for member in league.members):
        raise HTTPException(status_code=403, detail="User not a member of league")
    if league.chat_messages is None:
        league.chat_messages = []

    new_message = {
        "id": len(league.chat_messages) + 1,
        "user_id": message_request.user_id,
        "username": user.username,
        "content": message_request.content,
        "timestamp": datetime.utcnow().isoformat()
    }
    league.chat_messages.append(new_message)
    flag_modified(league, "chat_messages")
    db.commit()
    db.refresh(league)
    return ChatMessageResponse(
        id=new_message["id"],
        user_id=new_message["user_id"],
        username=new_message["username"],
        content=new_message["content"],
        timestamp=new_message["timestamp"]
    )

@router.get("/{league_id}/chat", response_model=list[ChatMessageResponse])
def get_chat_messages(league_id: int, db: Session = Depends(get_db)):
    """
    Get the group chat messages for a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    if league.chat_messages is None:
        return []
    return [ChatMessageResponse(
        id=message["id"],
        user_id=message["user_id"],
        username=message["username"],
        content=message["content"],
        timestamp=message["timestamp"]
    ) for message in league.chat_messages]

@router.put("/{league_id}/chat/{message_id}", response_model=ChatMessageResponse)
def update_chat_message(league_id: int, message_id: int, message_request: ChatMessageCreate, db: Session = Depends(get_db)):
    """
    Update a specific chat message in the group chat of a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    chat_message = next((msg for msg in league.chat_messages if msg['id'] == message_id), None)
    if not chat_message:
        raise HTTPException(status_code=404, detail="Message not found")

    chat_message['content'] = message_request.content
    flag_modified(league, "chat_messages")
    db.commit()
    return chat_message

@router.delete("/{league_id}/chat/{message_id}")
def delete_chat_message(league_id: int, message_id: int, db: Session = Depends(get_db)):
    """
    Delete a specific chat message from the group chat of a specific betting league.
    """
    league = db.query(BettingLeague).filter(BettingLeague.id == league_id).first()
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    chat_message = next((msg for msg in league.chat_messages if msg['id'] == message_id), None)
    if not chat_message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    league.chat_messages.remove(chat_message)
    flag_modified(league, "chat_messages")
    db.commit()
    return {"message": "Message deleted successfully"}