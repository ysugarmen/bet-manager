import requests
import json
import re
from datetime import datetime, timedelta
from ..config import settings
from app.models.game import Game
from app.schemas.game import GameState
from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.sql import text


def fetch_fixtures_data(page):
    params = {
        "key": settings.LIVE_SCORES_API_KEY,
        "secret": settings.LIVE_SCORES_API_SECRET,
        "competition_id": settings.LIVE_SCORES_CL_COMP_ID,
        "page": page,
    }
    response = requests.get(settings.LIVE_SCORES_API_FIXTURES_ENDPOINT, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print("Failed to fetch data from API: ", response.status_code)
        return None


# Function to fetch data
def fetch_history_data(page):
    params = {
        "key": settings.LIVE_SCORES_API_KEY,
        "secret": settings.LIVE_SCORES_API_SECRET,
        "competition_id": settings.LIVE_SCORES_CL_COMP_ID,
        "from": "2024-09-01",
        "page": page,
    }
    response = requests.get(settings.LIVE_SCORES_API_HISTORY_ENDPOINT, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print("Failed to fetch data from API: ", response.status_code)
        return None


# Function to filter games by date
def fetch_all_history_pages():
    current_page = 1
    total_pages = 6  # Start with one to ensure the loop runs at least once

    all_matches = []

    while current_page <= total_pages:
        print(f"Fetching page {current_page}...")
        data = fetch_history_data(current_page)
        if data and data["success"]:
            all_matches.extend(data["data"]["match"])
            total_pages = data["data"][
                "total_pages"
            ]  # Update total pages from the response
            current_page += 1
        else:
            print("No data returned or error encountered")
            break

    print(f"Total matches fetched: {len(all_matches)}")
    return all_matches


def fetch_all_fixture_pages():
    current_page = 1
    total_pages = 1  # Initialize to 1 to ensure the loop is entered
    all_fixtures = []

    while current_page <= total_pages:
        print(f"Fetching fixtures page {current_page}...")
        data = fetch_fixtures_data(current_page)
        if data and data["success"]:
            all_fixtures.extend(data["data"]["fixtures"])  # Accessing fixtures key
            # Checking if 'next_page' is provided and updating the total_pages and current_page accordingly
            if "total_pages" in data["data"]:
                total_pages = data["data"]["total_pages"]
            current_page += 1
        else:
            print("No fixtures data returned or error encountered")
            break

    print(f"Total fixtures fetched: {len(all_fixtures)}")
    return all_fixtures


def fetch_history_games_from_api(db: Session):
    matches = fetch_all_history_pages()
    added_games = 0
    for match in matches:
        team1 = match["home_name"]
        team1_name = api_clean_team_name(team1)
        team2 = match["away_name"]
        team2_name = api_clean_team_name(team2)
        score = match["ft_score"]
        match_datetime = datetime.strptime(
            f"{match['date']} {match['scheduled']}", "%Y-%m-%d %H:%M"
        )
        match_datetime += timedelta(hours=2)  # Convert to UTC
        db_game = (
            db.query(Game)
            .filter(
                and_(
                    Game.team1 == team1,
                    Game.team2 == team2,
                    Game.match_time == match_datetime,
                )
            )
            .first()
        )
        if db_game:
            if db_game.game_state == GameState.upcoming:
                score_match = re.search(r"(\d+)\s*-\s*(\d+)", score)
                if score_match:
                    db_game.score_team1, db_game.score_team2 = map(
                        int, score_match.groups()
                    )
                db_game.game_winner = match["outcomes"]["full_time"]
                db.commit()  # Make sure to commit changes
                continue  # Skip the rest of the loop after updating
            else:
                continue  # Skip the rest of the loop if the game is already in the database
        stadium = match["location"]

        score_match = re.search(r"(\d+)\s*-\s*(\d+)", score)
        if score_match:
            team1_score, team2_score = map(int, score_match.groups())
        else:
            team1_score, team2_score = None, None

        game_winner = match["outcomes"]["full_time"]
        odds = match["odds"]
        if odds:
            team1_odds = float(odds["pre"]["1"])
            team2_odds = float(odds["pre"]["2"])
            draw_odds = float(odds["pre"]["X"])
        else:
            team1_odds, team2_odds, draw_odds = 1, 1, 1
        overtime = match["outcomes"]["penalty_shootout"]
        if not overtime:
            penalty_score_team1, penalty_score_team2 = None, None
        game = Game(
            team1=team1_name,
            team2=team2_name,
            match_time=match_datetime,
            stadium=stadium,
            score_team1=team1_score,
            score_team2=team2_score,
            penalty_score_team1=penalty_score_team1,
            penalty_score_team2=penalty_score_team2,
            game_winner=game_winner,
            team1_odds=team1_odds,
            team2_odds=team2_odds,
            draw_odds=draw_odds,
        )
        db.add(game)
        added_games += 1


def fetch_fixtures_games_from_api(db: Session):
    fixtures = fetch_all_fixture_pages()
    added_games = 0
    for fixture in fixtures:
        team1 = fixture["home"]["name"]
        team1_name = api_clean_team_name(team1)
        team2 = fixture["away"]["name"]
        team2_name = api_clean_team_name(team2)
        match_datetime = datetime.strptime(
            f"{fixture['date']} {fixture['time']}", "%Y-%m-%d %H:%M:%S"
        )
        match_datetime += timedelta(hours=2)  # Convert to UTC
        db_game = (
            db.query(Game)
            .filter(
                and_(
                    Game.team1 == team1,
                    Game.team2 == team2,
                    Game.match_time == match_datetime,
                )
            )
            .first()
        )
        if db_game:
            continue
        stadium = fixture["location"]
        team1_odds = (
            float(fixture["odds"]["pre"]["1"])
            if fixture["odds"]["pre"]["1"] is not None
            else None
        )
        team2_odds = (
            float(fixture["odds"]["pre"]["2"])
            if fixture["odds"]["pre"]["2"] is not None
            else None
        )
        draw_odds = (
            float(fixture["odds"]["pre"]["X"])
            if fixture["odds"]["pre"]["X"] is not None
            else None
        )

        fixture = Game(
            team1=team1_name,
            team2=team2_name,
            match_time=match_datetime,
            stadium=stadium,
            team1_odds=team1_odds,
            team2_odds=team2_odds,
            draw_odds=draw_odds,
        )
        db.add(fixture)
        added_games += 1


def api_clean_team_name(team_name):
    return settings.API_TEAM_MAPPING.get(team_name, team_name)


def fecth_and_process_games_data(db: Session):
    fetch_history_games_from_api(db)
    fetch_fixtures_games_from_api(db)
