import requests
import random
import time
import re
from bs4 import BeautifulSoup
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_
from sqlalchemy.sql import text
from app.models.game import Game
from app.models.team import Team
from app.models.player import Player
from app.utils.logger import get_logger
from app.config import settings
import unicodedata

logger = get_logger("scraper")

# Rotating User-Agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_5_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/92.0.902.67",
]

# Persistent session to maintain cookies & headers
session = requests.Session()

# Custom headers to reduce bot detection
DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Referer": "https://google.com",
    "DNT": "1",  # Do Not Track request
    "Upgrade-Insecure-Requests": "1",
}


def make_request(url, max_retries=5, base_delay=3, max_delay=30):
    """Makes a request with retry logic to handle rate limiting (429)."""
    delay = base_delay  # Start with a base delay
    for attempt in range(max_retries):
        headers = {**DEFAULT_HEADERS, "User-Agent": random.choice(USER_AGENTS)}
        try:
            response = session.get(url, headers=headers, timeout=10)

            if response.status_code == 200:
                return response  # ✅ Success
            elif response.status_code == 429:  # Rate limit exceeded
                delay_with_jitter = delay + random.uniform(1, 3)  # Random jitter
                logger.warning(
                    f"⏳ Rate limited (429). Retrying in {delay_with_jitter:.1f} seconds..."
                )
                time.sleep(delay_with_jitter)
                delay = min(delay * 2, max_delay)  # Exponential backoff (max 60s)
            else:
                logger.error(f"❌ Request failed: {response.status_code} ({url})")
                return None  # No retry for non-429 errors

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Connection error: {e}")
            time.sleep(delay)
            delay = min(delay * 2, max_delay)

    logger.error(f"🚫 Max retries exceeded for {url}")
    return None  # Request failed after max retries


import re


def fetch_games_from_web(db: Session, target_date: str = None):
    """
    Fetches all games (or games from a specific date) from FBRef and stores them in the database.
    """
    logger.info(
        f"🔍 Fetching matches from FBRef for {target_date if target_date else 'all upcoming dates'}"
    )

    response = make_request(settings.CL_GAMES_SCRAPING_URL)
    if not response:
        return

    soup = BeautifulSoup(response.content, "html.parser")
    games_table = soup.find("table", {"id": "sched_all"})
    if not games_table:
        logger.error("❌ No matches found on the page")
        return

    added_games = 0
    for row in games_table.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) > 1:
            stage = cells[0].get_text(strip=True)
            gameday = cells[1].get_text(strip=True) or None
            date = cells[3].get_text(strip=True)
            start_time = cells[4].get_text(strip=True)
            team1 = clean_team_name(cells[5].get_text(strip=True))
            team2 = clean_team_name(cells[9].get_text(strip=True))
            score_text = cells[7].get_text(strip=True)

            # Extract the main score (ignoring penalties)
            score_match = re.search(r"(\d+)–(\d+)", score_text)
            if score_match:
                team1_score, team2_score = map(int, score_match.groups())
            else:
                team1_score, team2_score = None, None

            # Extract penalty scores if available
            penalty_match = re.findall(r"\((\d+)\)", score_text)
            if len(penalty_match) == 2:
                penalty_team1, penalty_team2 = map(int, penalty_match)
            else:
                penalty_team1, penalty_team2 = None, None

            if target_date and date != target_date:
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

            game = Game(
                team1=team1,
                team2=team2,
                match_time=match_datetime,
                score_team1=team1_score,
                score_team2=team2_score,
                penalty_score_team1=penalty_team1,
                penalty_score_team2=penalty_team2,
                stage=stage,
                gameday=gameday,
            )
            game.game_winner = game.determine_game_winner()
            db.add(game)
            added_games += 1
            logger.info(
                f"✅ Added {game.team1} {team1_score} - {team2_score} {game.team2} (Pens: {penalty_team1}-{penalty_team2})"
            )

        time.sleep(random.uniform(1, 3))  # ✅ Random delay

    db.commit()
    logger.info(f"✅ {added_games} new matches added to the database")


def update_scores_from_web(db: Session, target_date: str = None):
    """
    Updates scores for matches (all or on a given date).
    """
    logger.info(
        f"🔍 Updating match scores from FBRef for {target_date if target_date else 'all upcoming games'}"
    )

    response = make_request(settings.CL_GAMES_SCRAPING_URL)
    if not response:
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
            team1 = clean_team_name(cells[5].get_text(strip=True))
            team2 = clean_team_name(cells[9].get_text(strip=True))
            score_text = cells[7].get_text(strip=True)

            if target_date and date != target_date:
                continue

            # Extract the main score
            score_match = re.search(r"(\d+)–(\d+)", score_text)
            if score_match:
                score_team1, score_team2 = map(int, score_match.groups())
            else:
                score_team1, score_team2 = None, None

            # Extract penalty scores if available
            penalty_match = re.findall(r"\((\d+)\)", score_text)
            if len(penalty_match) == 2:
                penalty_team1, penalty_team2 = map(int, penalty_match)
            else:
                penalty_team1, penalty_team2 = None, None

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

            if game:
                game.score_team1 = score_team1
                game.score_team2 = score_team2
                game.penalty_score_team1 = penalty_team1
                game.penalty_score_team2 = penalty_team2
                game.game_winner = game.determine_game_winner()
                db.add(game)
                updated_count += 1
                logger.info(
                    f"✅ Updated score: {game.team1} {score_team1} - {score_team2} {game.team2} (Pens: {penalty_team1}-{penalty_team2})"
                )

    db.commit()
    logger.info(f"✅ Updated {updated_count} match scores")


def fetch_betting_odds(db: Session):
    """
    Fetches the latest betting odds from the ODDS API.
    """
    logger.info("🔍 Fetching betting odds from ODDS API")

    params = {
        "api_key": settings.BETTING_ODDS_API_KEY,
        "regions": "eu",
        "markets": "h2h",
        "bookmakers": "unibet_eu",
    }

    response = make_request(settings.BETTING_ODDS_API_URL)
    if not response:
        return

    odds_data = response.json()

    if not odds_data:
        logger.info("⚠️ No betting odds found.")
        return

    updated_games = 0

    for game_odds in odds_data:
        home_team = game_odds["home_team"]
        away_team = game_odds["away_team"]

        db_game = (
            db.query(Game)
            .filter((Game.team1 == home_team) & (Game.team2 == away_team))
            .first()
        )

        if db_game:
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


### **✅ Fetch Teams**
def fetch_teams_from_web(db: Session):
    """
    Fetches all teams from FBRef and stores them in the database.
    """
    logger.info(f"🔍 Fetching teams from FBRef")
    response = make_request(settings.CL_GENERAL_SCRAPING_URL)
    if not response:
        return

    soup = BeautifulSoup(response.content, "html.parser")
    teams_table = soup.find("table", {"id": "results2024-202582_overall"})
    if not teams_table:
        logger.error("❌ No teams found on the page")
        return

    added_teams = 0
    for row in teams_table.find_all("tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) < 10:
            continue

        team_name = clean_team_name(cells[1].get_text(strip=True))
        if team_name == "Squad":
            continue  # Skip the header row
        team_name_slug = team_name.replace(" ", "-")
        points = (
            int(cells[9].get_text(strip=True))
            if cells[9].get_text(strip=True).isdigit()
            else 0
        )
        team_href = ""
        team_link = cells[1].find("a")
        champions_league_addon = "/2024-2025/c8"
        if team_link:
            team_href = (
                settings.FBREF_BASE_URL
                + team_link["href"].replace(
                    f"/{team_name_slug}-Stats",
                    f"{champions_league_addon}/{team_name_slug}-Stats",
                )
                + settings.CL_STATS_SUFIX
            )
        stats = {
            "League Phase": {
                "matches_played": int(cells[2].get_text(strip=True))
                if cells[2].get_text(strip=True).isdigit()
                else 0,
                "wins": int(cells[3].get_text(strip=True))
                if cells[3].get_text(strip=True).isdigit()
                else 0,
                "draws": int(cells[4].get_text(strip=True))
                if cells[4].get_text(strip=True).isdigit()
                else 0,
                "losses": int(cells[5].get_text(strip=True))
                if cells[5].get_text(strip=True).isdigit()
                else 0,
                "goals_for": int(cells[6].get_text(strip=True))
                if cells[6].get_text(strip=True).isdigit()
                else 0,
                "goals_against": int(cells[7].get_text(strip=True))
                if cells[7].get_text(strip=True).isdigit()
                else 0,
                "goal_difference": int(cells[8].get_text(strip=True))
                if cells[8].get_text(strip=True).isdigit()
                else 0,
            },
        }
        db_team = db.query(Team).filter(Team.name == team_name).first()
        if db_team:
            continue

        new_team = Team(
            name=team_name,
            webpage_url=team_href,
            logo_url="",
            points=points,
            players=[],
            stats=stats,
        )
        db.add(new_team)
        added_teams += 1
        logger.info(f"✅ Added team {new_team.name} with {new_team.points} points")

        time.sleep(random.uniform(1, 3))  # ✅ Random delay

    db.commit()
    logger.info(f"✅ {added_teams} new teams added to the database")


def fetch_players_from_web(db: Session):
    """
    Fetches all players from FBRef and stores them in the database.
    """
    logger.info(f"🔍 Fetching players from FBRef")
    # teams = db.query(Team).all()
    teams = (
        db.query(Team)
        .filter(text("jsonb_array_length(teams.players::jsonb) = 0"))
        .all()
    )
    if not teams:
        logger.error("❌ No teams found in the database")
        return

    added_players = 0

    for team in teams:
        if not team.webpage_url:
            continue

        request_url = team.webpage_url
        logger.info(f"🔍 Fetching players for {team.name} from {request_url}")

        response = make_request(request_url)
        if not response:
            continue

        soup = BeautifulSoup(response.content, "html.parser")

        # ✅ Find table with any ID matching "stats_standard_{int}"
        players_table = soup.find("table", id=re.compile(r"^stats_standard_\d+$"))

        if not players_table:
            logger.error(f"❌ No players found for {team.name}")
            continue

        rows_to_skip = 2
        team_players = []

        for row in players_table.find_all("tr"):
            if len(team_players) >= 20:
                break  # ✅ Stop after 20 players
            cells = row.find_all(["th", "td"])
            if rows_to_skip > 0:
                rows_to_skip -= 1
                continue

            player_name = unicodedata.normalize("NFC", cells[0].get_text(strip=True))
            if player_name in team_players or player_name in [
                "Squad Total",
                "Opponent Total",
            ]:
                continue

            team_players.append(player_name)  # ✅ Store player name instead of object

            db_player = db.query(Player).filter(Player.name == player_name).first()
            if db_player:
                continue

            stats = {
                "goals": int(cells[8].get_text(strip=True))
                if cells[8].get_text(strip=True).isdigit()
                else 0,
                "assists": int(cells[9].get_text(strip=True))
                if cells[9].get_text(strip=True).isdigit()
                else 0,
                "yellow_cards": int(cells[14].get_text(strip=True))
                if cells[14].get_text(strip=True).isdigit()
                else 0,
                "red_cards": int(cells[15].get_text(strip=True))
                if cells[15].get_text(strip=True).isdigit()
                else 0,
            }

            new_player = Player(
                name=player_name,
                team_id=team.id,
                stats=stats,
            )
            db.add(new_player)
            added_players += 1
            logger.info(f"✅ Added player {new_player.name} to team {team.name}")

        team.players = team_players
        db.add(team)

        time.sleep(random.uniform(1, 3))  # ✅ Random delay

    db.commit()
    logger.info(f"✅ {added_players} new players added to the database")


def clean_team_name(raw_name: str) -> str:
    """
    Cleans and formats the team name by removing unwanted country codes.
    :param raw_name: The extracted team name from the website.
    :return: The properly formatted team name.
    """
    return settings.TEAM_NAME_MAPPING.get(raw_name, raw_name)
