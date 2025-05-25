# Data Directory

This directory contains all persistent data for the Ladder League app.

- All user, league, and score data is stored here.
- Structure:
  - users.json         # All registered users
  - leagues.json       # All league and membership data
  - scores/            # Per-league match results (one file per league)

You can change the location of this directory by setting the `LADDER_LEAGUE_DATA_DIR` environment variable in the backend.
