import requests
from bs4 import BeautifulSoup
from datetime import datetime
from app.models.game import Game
from sqlalchemy import and_
from sqlalchemy.orm import Session
from app.utils.logger import get_logger
from app.config import settings
import os

logger = get_logger("scraper")


def fetch_games_from_web(db: Session, target_date: str = None):
    """
    Fetches all games (or games from a specific date) from FBRef.
    :param target_date: Date in 'YYYY-MM-DD' format (optional).
    :return: List of Game objects.
    """
    logger.info(
        f"🔍 Fetching matches from FBRef for {target_date if target_date else 'all upcoming dates'}"
    )

    response = requests.get(settings.CL_GAMES_SCRAPING_URL)
    if response.status_code != 200:
        logger.error(f"❌ Failed to fetch matches: {response.status_code}")
        return []

    soup = BeautifulSoup(response.content, "html.parser")
    games_table = soup.find("table", {"id": "sched_all"})
    if not games_table:
        logger.error("❌ No matches found on the page")
        return []

    games = []
    for row in games_table.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) > 1:
            stage = cells[0].get_text(strip=True)
            gameday = cells[1].get_text(strip=True)
            if gameday == "":
                gameday = None
            date = cells[3].get_text(strip=True)
            start_time = cells[4].get_text(strip=True)
            raw_team1 = cells[5].get_text(strip=True)
            raw_team2 = cells[9].get_text(strip=True)
            team1 = clean_team_name(raw_team1)
            team2 = clean_team_name(raw_team2)
            score_text = cells[7].get_text(strip=True)

            team1_score, team2_score = None, None
            if score_text and score_text != "Score":
                team1_score, team2_score = map(int, score_text.split("–"))
            if target_date and date != target_date:
                continue  # Skip games not on the target date

            try:
                match_datetime = datetime.strptime(
                    f"{date} {start_time}", "%Y-%m-%d %H:%M"
                )
            except ValueError:
                logger.warning(
                    f"⚠️ Skipping match with invalid date/time: {team1} vs {team2}"
                )
                continue

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
                continue  # Skip games already in the database

            game = Game(
                team1=team1,
                team2=team2,
                match_time=match_datetime,
                score_team1=team1_score,
                score_team2=team2_score,
                game_winner=Game.detirmine_game_winner(team1_score, team2_score),
                stage=stage,
                gameday=gameday,
            )
            # game.update_game_state()
            games.append(game)
            logger.info(f"✅ Found {game.team1} vs {game.team2} on {game.match_time}")

    logger.info(f"✅ Fetched {len(games)} matches")
    return games


def update_scores_from_web(db: Session, target_date: str = None):
    """
    Updates scores for matches (all or on a given date).
    :param db: Database session.
    :param target_date: Date in 'YYYY-MM-DD' format (optional).
    """
    logger.info(
        f"🔍 Updating match scores from FBRef for {target_date if target_date else 'all upcoming games'}"
    )

    response = requests.get(settings.CL_GAMES_SCRAPING_URL)
    if response.status_code != 200:
        logger.error(f"❌ Failed to fetch matches: {response.status_code}")
        return

    soup = BeautifulSoup(response.content, "html.parser")
    games_table = soup.find("table", {"id": "sched_all"})
    if not games_table:
        logger.error("❌ No matches found on the page")
        return

    updated_count = 0
    for row in games_table.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) > 1:
            date = cells[3].get_text(strip=True)
            start_time = cells[4].get_text(strip=True)
            raw_team1 = cells[5].get_text(strip=True)
            raw_team2 = cells[9].get_text(strip=True)
            team1 = clean_team_name(raw_team1)
            team2 = clean_team_name(raw_team2)
            score_text = cells[7].get_text(strip=True)

            if target_date and date != target_date:
                continue  # Skip games not on the target date

            if "–" in score_text:  # Proper score format
                score_team1, score_team2 = map(int, score_text.split("–"))
            else:
                continue

            try:
                match_datetime = datetime.strptime(
                    f"{date} {start_time}", "%Y-%m-%d %H:%M"
                )
            except ValueError:
                logger.warning(
                    f"⚠️ Skipping match with invalid date/time: {team1} vs {team2}"
                )
                continue

            game = (
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

            if game and (game.score_team1 is None or game.score_team2 is None):
                game.score_team1 = score_team1
                game.score_team2 = score_team2
                game.game_winner = Game.detirmine_game_winner()
                db.add(game)
                updated_count += 1
                logger.info(
                    f"✅ Updated score: {game.team1} {game.score_team1} - {game.score_team2} {game.team2}"
                )

    db.commit()
    logger.info(f"✅ Updated {updated_count} match scores")


def clean_team_name(raw_name: str) -> str:
    """
    Cleans and formats the team name by removing unwanted country codes.
    :param raw_name: The extracted team name from the website.
    :return: The properly formatted team name.
    """
    return settings.TEAM_NAME_MAPPING.get(raw_name, raw_name)


def fetch_betting_odds(db: Session):
    """
    Fetches the latest betting odds from the ODDS API.
    If DEBUG_MODE is enabled, sets all odds to 1 without making an API call.
    """
    if settings.DEBUG_MODE:

        # Update all games with odds = 1
        updated_games = 0
        games = db.query(Game).all()
        for game in games:
            game.team1_odds = 1.0
            game.team2_odds = 1.0
            game.draw_odds = 1.0
            db.add(game)
            updated_games += 1

        db.commit()
        logger.info(f"✅ DEBUG MODE: Set odds to 1 for {updated_games} games.")
        return

    logger.info("🔍 Fetching betting odds from ODDS API")

    params = {
        "api_key": settings.BETTING_ODDS_API_KEY,
        "regions": "eu",
        "markets": "h2h",
        "bookmakers": "unibet_eu",
    }

    try:
        response = requests.get(settings.BETTING_ODDS_API_URL, params=params)
        response.raise_for_status()
        odds_data = response.json()

        if not odds_data:
            logger.info("⚠️ No betting odds found.")
            return

        updated_games = 0

        for game_odds in odds_data:
            home_team = game_odds["home_team"]
            away_team = game_odds["away_team"]

            # Get the game from the database
            db_game = (
                db.query(Game)
                .filter((Game.team1 == home_team) & (Game.team2 == away_team))
                .first()
            )

            if db_game:
                # Extract odds
                h2h_odds = game_odds["bookmakers"][0]["markets"][0]["outcomes"]
                for outcome in h2h_odds:
                    if outcome["name"] == home_team:
                        db_game.team1_odds = outcome["price"]
                    elif outcome["name"] == away_team:
                        db_game.team2_odds = outcome["price"]
                    elif outcome["name"] == "Draw":
                        db_game.draw_odds = outcome["price"]

                updated_games += 1
                db.add(db_game)

        db.commit()
        logger.info(f"✅ Betting odds updated for {updated_games} games.")

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error fetching betting odds: {e}")
