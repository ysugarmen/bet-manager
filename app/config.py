import os
from pydantic_settings import BaseSettings
from typing import ClassVar, Dict
from fastapi.security import OAuth2PasswordBearer


class Settings(BaseSettings):
    DEBUG_MODE: bool = os.getenv("DEBUG_MODE", True)
    DB_URL: str = os.getenv(
        "DB_URL",
        "postgresql://yonatansugarmen:your_password@localhost:5432/bet_manager",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    CL_GAMES_SCRAPING_URL: str = os.getenv(
        "CL_GAMES_SCRAPING_URL",
        "https://fbref.com/en/comps/8/schedule/Champions-League-Scores-and-Fixtures",
    )
    TEAM_NAME_MAPPING: ClassVar[dict[str, str]] = {
        "Dortmundde": "Borussia Dortmund",
        "deDortmund": "Borussia Dortmund",
        "Sporting CPpt": "Sporting Lisbon",
        "ptSporting CP": "Sporting Lisbon",
        "Manchester Cityeng": "Manchester City",
        "engManchester City": "Manchester City",
        "Real Madrides": "Real Madrid",
        "esReal Madrid": "Real Madrid",
        "esBarcelona": "Barcelona",
        "Barcelonaes": "Barcelona",
        "Paris S-Gfr": "Paris Saint Germain",
        "frParis S-G": "Paris Saint Germain",
        "Atalantait": "Atalanta",
        "itAtalanta": "Atalanta",
        "Juventusit": "Juventus",
        "itJuventus": "Juventus",
        "Bayern Munichde": "Bayern München",
        "deBayern Munich": "Bayern München",
        "engLiverpool": "Liverpool",
        "Liverpooleng": "Liverpool",
        "engArsenal": "Arsenal",
        "Arsenaleng": "Arsenal",
        "Milanit": "AC Milan",
        "itMilan": "AC Milan",
        "Atletico Madrides": "Atletico Madrid",
        "esAtletico Madrid": "Atletico Madrid",
        "esAtlético Madrid": "Atletico Madrid",
        "Atlético Madrides": "Atletico Madrid",
        "Benficapt": "Benfica",
        "ptBenfica": "Benfica",
        "Portopt": "Porto",
        "ptPorto": "Porto",
        "deStuttgart": "Stuttgart",
        "Stuttgartde": "Stuttgart",
        "Feyenoordnl": "Feyenoord",
        "nlFeyenoord": "Feyenoord",
        "RB Leipzigde": "RB Leipzig",
        "deRB Leipzig": "RB Leipzig",
        "nlPSV Eindhoven": "PSV Eindhoven",
        "PSV Eindhovennl": "PSV Eindhoven",
        "Bolognait": "Bologna",
        "itBologna": "Bologna",
        "Sparta Praguecz": "Sparta Prague",
        "czSparta Prague": "Sparta Prague",
        "Celticsct": "Celtic",
        "sctCeltic": "Celtic",
        "frLille": "Lille",
        "Lillefr": "Lille",
        "itInter": "Inter",
        "Interit": "Inter",
        "Young Boysch": "Young Boys",
        "chYoung Boys": "Young Boys",
        "engAston Villa": "Aston Villa",
        "Aston Villaeng": "Aston Villa",
        "Monacofr": "Monaco",
        "frMonaco": "Monaco",
        "hrDinamo Zagreb": "Dinamo Zagreb",
        "Dinamo Zagrebhr": "Dinamo Zagreb",
        "atRB Salzburg": "RB Salzburg",
        "RB Salzburgat": "RB Salzburg",
        "skSlovan Bratislava": "Slovan Bratislava",
        "Slovan Bratislavask": "Slovan Bratislava",
        "uaShakhtar": "Shakhtar Donetsk",
        "Shakhtarua": "Shakhtar Donetsk",
        "esGirona": "Girona",
        "Gironaes": "Girona",
        "Club Bruggebe": "Club Brugge",
        "beClub Brugge": "Club Brugge",
        "deLeverkusen": "Bayren Leverkusen",
        "Leverkusende": "Bayren Leverkusen",
        "Red Starrs": "Red Star",
        "rsRed Star": "Red Star",
        "atStrum Graz": "Strum Graz",
        "Strum Grazat": "Strum Graz",
        "frBrest": "Brest",
        "Brestfr": "Brest",
    }
    STAGE_TO_GAMEDAY_BUDGET_KEY_MAPPING: ClassVar[dict[str, int]] = {
        "League phase": 2,
        "Knockout phase play-offs": 3,
        "Round of 16": 4,
        "Quarter-finals": 5,
        "Semi-finals": 8,
        "Final": 10,
    }
    LOGO_BASE_PATH: str = (
        "/Users/yonatansugarmen/Desktop/Projects/Apps/BetManager/static/team_logos/"
    )
    GAME_STANSDART_LENGTH: int = 3
    BETTING_ODDS_API_URL: str = (
        "https://api.the-odds-api.com/v4/sports/soccer_uefa_champs_league/odds/"
    )
    BETTING_ODDS_API_KEY: str = os.getenv(
        "BETTING_ODDS_API_KEY", "924657fcf70ca731200be32d4656b10a"
    )
    oauth2_scheme: ClassVar[OAuth2PasswordBearer] = OAuth2PasswordBearer(
        tokenUrl="token"
    )


settings = Settings()
