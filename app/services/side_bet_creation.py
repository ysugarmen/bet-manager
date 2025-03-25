from app.models.side_bet import SideBet
from app.models.team import Team
from app.models.player import Player
from app.schemas.bet import BetState
from app.utils.database import get_db
from datetime import datetime


def create_side_bets(db):
    teams = db.query(Team).all()
    players = db.query(Player).all()

    players_by_team = {}
    for player in players:
        team__name = db.query(Team).filter(Team.id == player.team_id).first().name
        if team__name not in players_by_team:
            players_by_team[team__name] = []
        players_by_team[team__name].append(player.name)

    side_bets_data = [
        {
            "last_time_to_bet": datetime(2025, 12, 1, 23, 59),
            "question": "League Champion",
            "options": [team.name for team in teams if team.name != "Squad"],
            "reward": 50,
            "bet_state": BetState.editable,
            "answer": None,
        },
        {
            "last_time_to_bet": datetime(2025, 12, 1, 23, 59),
            "question": "Top Scorer",
            "options": players_by_team,
            "reward": 20,
            "bet_state": BetState.editable,
            "answer": None,
        },
        {
            "last_time_to_bet": datetime(2025, 12, 1, 23, 59),
            "question": "Top Assister",
            "options": players_by_team,
            "reward": 20,
            "bet_state": BetState.editable,
            "answer": None,
        },
        {
            "last_time_to_bet": datetime(2025, 12, 1, 23, 59),
            "question": "Knockout stages qualifiers",
            "options": [team.name for team in teams if team.name != "Squad"],
            "reward": 20,
            "bet_state": BetState.editable,
            "answer": None,
        },
    ]
    db_side_bets = db.query(SideBet).all()
    existing_questions = [side_bet.question for side_bet in db_side_bets]
    for side_bet in side_bets_data:
        new_question = side_bet["question"]
        if new_question in existing_questions:
            continue
        new_side_bet = SideBet(
            last_time_to_bet=side_bet["last_time_to_bet"],
            question=side_bet["question"],
            options=side_bet["options"],
            reward=side_bet["reward"],
            bet_state=side_bet["bet_state"],
            answer=side_bet["answer"],
        )
        db.add(new_side_bet)

        db.commit()
        db.refresh(new_side_bet)


if __name__ == "__main__":
    db = next(get_db())
    create_side_bets(db)
