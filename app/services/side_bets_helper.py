from sqlalchemy import Integer, func, cast, not_
from app.models.side_bet import SideBet, UsersSideBet
from app.models.team import Team
from app.models.user import User
from app.models.player import Player
from datetime import datetime


def get_top_scorers(db):
    """
    Returns a list of names of the league top scorers in case of a tie.
    """
    max_goals = db.query(
        func.max(cast(func.json_extract_path_text(Player.stats, "goals"), Integer))
    ).scalar()
    top_scorers = (
        db.query(Player.name)
        .filter(
            cast(func.json_extract_path_text(Player.stats, "goals"), Integer)
            == max_goals
        )
        .all()
    )
    return [scorer.name for scorer in top_scorers]


def get_top_assisters(db):
    """
    Returns a list of names of the league top assisters in case of a tie.
    """
    max_assists = db.query(
        func.max(cast(func.json_extract_path_text(Player.stats, "assists"), Integer))
    ).scalar()
    top_assisters = (
        db.query(Player.name)
        .filter(
            cast(func.json_extract_path_text(Player.stats, "assists"), Integer)
            == max_assists
        )
        .all()
    )
    return [assister.name for assister in top_assisters]


def get_league_qulifiers(db):
    """
    returns the league qualifiers (top 8 teams from league phase)
    """
    teams = db.query(Team).all()
    sorted_teams = sorted(
        teams,
        key=lambda team: (
            team.points,  # Primary sort by points
            team.stats.get("League Phase", {}).get(
                "goal_difference", 0
            ),  # Secondary sort by goal_difference
        ),
        reverse=True,
    )
    qualifiers = [team.name for team in sorted_teams[:8]]
    return qualifiers


def should_check_answer(side_bet):
    """
    returns True if the side bet should be checked for answer, False otherwise
    """
    if not side_bet.time_to_check_answer:
        return False
    if side_bet.time_to_check_answer < datetime.now() and not side_bet.answer:
        return True
    return False


def get_side_bet_answer(db, side_bet):
    """
    update a single bet answer
    """
    if should_check_answer(side_bet):
        if side_bet.question == "Top Scorer":
            answer = get_top_scorers(db)
        elif side_bet.question == "Top Assister":
            answer = get_top_assisters(db)
        elif side_bet.question == "Knockout stages qualifiers":
            answer = get_league_qulifiers(db)
        else:
            answer = None
        side_bet.answer = answer
        db.add(side_bet)
        db.commit()


def update_side_bets_answers(db):
    """
    update all side bets answers
    """
    side_bets = db.query(SideBet).all()
    for side_bet in side_bets:
        get_side_bet_answer(db, side_bet)


def update_users_side_bets_rewards(db):
    """
    update all users side bets rewards
    """
    side_bets = db.query(SideBet).all()
    for side_bet in side_bets:
        if not side_bet.answer:
            continue
        users_side_bets = (
            db.query(UsersSideBet).filter(UsersSideBet.side_bet_id == side_bet.id).all()
        )
        if side_bet.question == "Knockout stages qualifiers":
            for user_side_bet in users_side_bets:
                if user_side_bet.reward:
                    continue
                user = db.query(User).filter(User.id == user_side_bet.user_id).first()
                reward = calculate_qualifiers_bet_reward(user_side_bet, side_bet)
                user.points += reward
                user_side_bet.reward = reward
                db.add(user, user_side_bet)
                db.commit()
        elif side_bet.question == "Top Scorer" or side_bet.question == "Top Assister":
            for user_side_bet in users_side_bets:
                if user_side_bet.reward:
                    continue
                user = db.query(User).filter(User.id == user_side_bet.user_id).first()
                reward = calculate_players_bet_reward(user_side_bet, side_bet)
                user.points += reward
                user_side_bet.reward = reward
                db.add(user, user_side_bet)
                db.commit()
        elif side_bet.question == "Champion":
            for user_side_bet in users_side_bets:
                if user_side_bet.reward:
                    continue
                user = db.query(User).filter(User.id == user_side_bet.user_id).first()
                reward = calculate_champion_bet_reward(user_side_bet, side_bet)
                user.points += reward
                user_side_bet.reward = reward
                db.add(user, user_side_bet)
                db.commit()


def calculate_champion_bet_reward(user_side_bet, side_bet):
    """
    calculate the reward for regular bets
    """
    answer = side_bet.answer
    if user_side_bet.bet_choice == answer:
        return side_bet.reward
    return 0


def calculate_qualifiers_bet_reward(user_side_bet, side_bet):
    """
    calculate the reward for iregular bets (knockout stages qualifiers)
    """
    reward = 0
    guessed_order = [
        user_side_bet.bet_choice[str(i)] for i in range(len(side_bet.answer))
    ]
    points_per_correct_position = 20
    points_per_correct_qulifier = 10

    for i, team in enumerate(guessed_order):
        if team in side_bet.answer:
            if i == side_bet.answer.index(team):
                reward += points_per_correct_position
            else:
                reward += points_per_correct_qulifier
    return reward


def calculate_players_bet_reward(user_side_bet, side_bet):
    """
    calculate the reward for players bets (top scorrer/assister)
    """
    answer = side_bet.answer
    user_bet_choice = user_side_bet.bet_choice["player"]
    if user_bet_choice in answer:
        return side_bet.reward
    return 0
