from sqlalchemy.orm import Session
from app.models.team import Team
from app.models.player import Player
from sqlalchemy import func


def reset_team_ids(db: Session):
    old_ids = [
        13,
        16,
        36,
        37,
        15,
        11,
        12,
        23,
        24,
        27,
        14,
        25,
        26,
        28,
        40,
        31,
        32,
        33,
        41,
        42,
        29,
        30,
        43,
        34,
        35,
        46,
        48,
        52,
        55,
        47,
        53,
        54,
        56,
        57,
        58,
        44,
    ]
    old_ids.sort()

    # Create a mapping of old IDs to new IDs (1 to 36)
    id_mapping = {old_id: new_id + 1 for new_id, old_id in enumerate(old_ids)}

    # Step 1: Duplicate each row in the teams table with a temporary name
    for old_id, new_id in id_mapping.items():
        team = db.query(Team).filter(Team.id == old_id).first()
        if team:
            # Temporarily change the team name to avoid unique constraint violation
            original_name = team.name
            team.name = f"{original_name}_temp"  # Add "_temp" to avoid name duplication

            # Create a copy of the team with the new ID
            new_team = Team(
                name=team.name,
                webpage_url=team.webpage_url,
                logo_url=team.logo_url,
                points=team.points,
                players=team.players,  # Keep players' reference but will update later
                stats=team.stats,
            )
            new_team.id = new_id  # Assign the new ID
            db.add(new_team)

    db.commit()  # Commit the duplicate teams

    # Step 2: Now that the teams are duplicated, update the name back to the original name
    for old_id, new_id in id_mapping.items():
        team = db.query(Team).filter(Team.id == new_id).first()
        if team:
            # Restore the original name
            team.name = team.name.replace("_temp", "")  # Remove the "_temp" suffix
            db.add(team)

    db.commit()  # Commit the name restoration

    # Step 3: Update the team_id references in the players table to the new team_ids
    for old_id, new_id in id_mapping.items():
        db.query(Player).filter(Player.team_id == old_id).update(
            {Player.team_id: new_id}, synchronize_session=False
        )

    db.commit()  # Commit the update to the players table

    # Step 4: Now that the players are updated, delete the old teams
    db.query(Team).filter(Team.id.in_(old_ids)).delete(synchronize_session=False)
    db.commit()  # Commit the deletion of old teams
