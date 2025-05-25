from fastapi import FastAPI, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import json
import os
from datetime import datetime

app = FastAPI()

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class League(BaseModel):
    sport: str
    leagues: List[str]

class Member(BaseModel):
    name: str
    recent: list[str]  # List of last 5 results, e.g., ['Win', 'Loss', ...]
    points: int
    games_played: int

class User(BaseModel):
    phone: str
    firstName: str
    lastName: str

# Configurable data directory
DATA_DIR = os.environ.get('LADDER_LEAGUE_DATA_DIR', os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data')))
SCORES_DIR = os.path.join(DATA_DIR, 'scores')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
LEAGUES_FILE = os.path.join(DATA_DIR, 'leagues.json')

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def load_leagues():
    if not os.path.exists(LEAGUES_FILE):
        return {}
    with open(LEAGUES_FILE, 'r') as f:
        return json.load(f)

def save_leagues(leagues):
    with open(LEAGUES_FILE, 'w') as f:
        json.dump(leagues, f, indent=2)

@app.get("/api/leagues", response_model=List[League])
def get_leagues():
    return [
        {"sport": "Tennis", "leagues": ["Arbors Tennis League", "Gateway Tennis League"]},
        {"sport": "Badminton", "leagues": ["Stratford Badminton League"]},
        {"sport": "Pickleball", "leagues": ["Monroe Manor Pickleball League"]},
    ]

@app.get("/api/league-members", response_model=List[Member])
def get_league_members(league: str = Query(...)):
    leagues = load_leagues()
    # Load scores for this league
    score_file = os.path.join(SCORES_DIR, f"{league.replace(' ', '_').lower()}_scores.json")
    if os.path.exists(score_file):
        with open(score_file, 'r') as f:
            try:
                league_scores = json.load(f)
            except Exception:
                league_scores = []
    else:
        league_scores = []
    members = []
    if league in leagues:
        for u in leagues[league]:
            full_name = f"{u.get('firstName', '')} {u.get('lastName', '')}".strip()
            # Calculate matches played, won, lost, and recent results
            matches_played = 0
            matches_won = 0
            matches_lost = 0
            recent_results = []
            for match in league_scores:
                # Assume match has 'winner' and 'players' fields
                players = match.get('players', [])
                winner = match.get('winner', '')
                if full_name in players:
                    matches_played += 1
                    if winner == full_name:
                        matches_won += 1
                        recent_results.append('Win')
                    else:
                        matches_lost += 1
                        recent_results.append('Loss')
            # Only keep last 5 results
            recent_results = recent_results[-5:][::-1]
            # Points: 3 per win, 1 per loss (customize as needed)
            points = matches_won * 3 + matches_lost * 1
            members.append({
                "name": full_name,
                "recent": recent_results,
                "points": points,
                "games_played": matches_played,
                "matches_won": matches_won,
                "matches_lost": matches_lost
            })
        return members
    # fallback to mock data
    mock_data = {
        "Arbors Tennis League": [
            {"name": "Amit", "recent": ["Win", "Win", "Loss", "Win", "Loss"], "points": 120, "games_played": 25},
            {"name": "Priya", "recent": ["Loss", "Loss", "Win", "Loss", "Win"], "points": 110, "games_played": 22},
            {"name": "Rahul", "recent": ["Win", "Loss", "Win", "Win", "Win"], "points": 100, "games_played": 20},
        ],
        "Gateway Tennis League": [
            {"name": "Sneha", "recent": ["Loss", "Win", "Loss", "Loss", "Win"], "points": 90, "games_played": 18},
            {"name": "Vikram", "recent": ["Win", "Win", "Win", "Loss", "Loss"], "points": 80, "games_played": 15},
        ],
        "Stratford Badminton League": [
            {"name": "Anjali", "recent": ["Win", "Win", "Loss", "Win", "Win"], "points": 95, "games_played": 19},
            {"name": "Rohan", "recent": ["Loss", "Loss", "Win", "Loss", "Loss"], "points": 85, "games_played": 17},
        ],
        "Monroe Manor Pickleball League": [
            {"name": "Neha", "recent": ["Win", "Loss", "Win", "Win", "Win"], "points": 105, "games_played": 21},
            {"name": "Suresh", "recent": ["Loss", "Win", "Loss", "Loss", "Win"], "points": 100, "games_played": 20},
        ],
    }
    # Add matches_won and matches_lost to mock data for consistency
    for m in mock_data.get(league, []):
        m["matches_won"] = m.get("points", 0) // 5  # mock logic
        m["matches_lost"] = m.get("games_played", 0) - m["matches_won"]
    return mock_data.get(league, [])

@app.post("/api/signup")
def signup(user: User = Body(...)):
    users = load_users()
    if any(u['phone'] == user.phone for u in users):
        return {"success": False, "message": "User already exists"}
    users.append(user.dict())
    save_users(users)
    return {"success": True, "user": user.dict()}

@app.post("/api/login")
def login(data: dict = Body(...)):
    phone = data.get('phone')
    users = load_users()
    user = next((u for u in users if u['phone'] == phone), None)
    if user:
        return {"success": True, "user": user}
    return {"success": False, "message": "User not found"}

@app.get("/api/all-users")
def all_users():
    users = load_users()
    return users

@app.post("/api/join-league")
def join_league(data: dict = Body(...)):
    league = data.get('league')
    user = data.get('user')  # expects dict with at least 'phone', 'firstName', 'lastName'
    if not league or not user:
        return {"success": False, "message": "Missing league or user info"}
    leagues = load_leagues()
    if league not in leagues:
        leagues[league] = []
    # Check if user already in league by phone
    if any(u['phone'] == user['phone'] for u in leagues[league]):
        # Update user info if needed
        for u in leagues[league]:
            if u['phone'] == user['phone']:
                u.update(user)
        save_leagues(leagues)
        return {"success": True, "message": "User already in league, info updated"}
    leagues[league].append(user)
    save_leagues(leagues)
    return {"success": True, "message": "User added to league"}

@app.get("/api/user-leagues")
def get_user_leagues(phone: str = Query(...)):
    leagues = load_leagues()
    joined = []
    for league, members in leagues.items():
        if any(u.get('phone') == phone for u in members):
            joined.append(league)
    return joined

@app.post("/api/add-score")
def add_score(data: dict = Body(...)):
    league = data.get('league')
    if not league:
        return {"success": False, "message": "Missing league name"}
    os.makedirs(SCORES_DIR, exist_ok=True)
    score_file = os.path.join(SCORES_DIR, f"{league.replace(' ', '_').lower()}_scores.json")
    # Load existing scores
    if os.path.exists(score_file):
        with open(score_file, 'r') as f:
            try:
                scores = json.load(f)
            except Exception:
                scores = []
    else:
        scores = []
    # Add timestamp
    data['timestamp'] = datetime.now().isoformat()
    scores.append(data)
    with open(score_file, 'w') as f:
        json.dump(scores, f, indent=2)
    return {"success": True, "message": "Score saved"}

@app.get("/api/league-scores")
def get_league_scores(league: str = Query(...)):
    score_file = os.path.join(SCORES_DIR, f"{league.replace(' ', '_').lower()}_scores.json")
    if os.path.exists(score_file):
        with open(score_file, 'r') as f:
            try:
                return json.load(f)
            except Exception:
                return []
    return []
