# Ladder League Data Directory

This directory contains all persistent data for the Ladder League app. It is now located outside the frontend/backend codebase for easier backup and separation from source code.

- users.json: All registered users
- leagues.json: All league and membership data
- scores/: Per-league match results (one file per league)

You can change the location of this directory by setting the LADDER_LEAGUE_DATA_DIR environment variable.
