from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import cast, Date, func, or_
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.utils.database import get_db
from app.models.team import Team
from app.schemas.team import TeamResponse
from app.models.player import Player
from app.schemas.player import PlayerResponse
from app.models.game import Game
from app.schemas.game import GameResponse, GameState
from app.utils.logger import get_logger

router = APIRouter(prefix="/teams")
logger = get_logger("router.team")


@router.get("/sorted", response_model=List[TeamResponse])
async def get_sorted_teams(db: Session = Depends(get_db)):
    teams = db.query(Team).all()
    sorted_teams = sorted(
        teams,
        key=lambda team: (
            team.points,  # Primary sort by points
            team.stats.get("League Phase", {}).get(
                "goal_difference", 0
            ),  # Secondary sort by goal_difference
        ),
        reverse=True,  # Descending order
    )
    return sorted_teams


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/{team_id}/players", response_model=List[PlayerResponse])
async def get_team_players(team_id: int, db: Session = Depends(get_db)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    players_list = team.players
    players = []
    for player_name in players_list:
        player = db.query(Player).filter(Player.name == player_name).first()
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
            continue
        players.append(player)
    return players


@router.get("/{team_id}/games-history", response_model=List[GameResponse])
async def get_team_game_history(team_id: int, db: Session = Depends(get_db)):
    """
    Fetch all past games of a given team.
    """
    # ✅ Get team by ID
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # ✅ Query all past games where the team played (either as team1 or team2)
    games_history = (
        db.query(Game)
        .filter(or_(Game.team1 == team.name, Game.team2 == team.name))
        .filter(
            Game.game_state == GameState.history
        )  # ✅ Check both home & away matches
        .order_by(Game.match_time.desc())  # ✅ Sort by latest matches first
        .all()  # ✅ Fetch all matches
    )

    return games_history
