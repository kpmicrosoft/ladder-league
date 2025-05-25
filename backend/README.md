# Backend (FastAPI)

This directory contains the FastAPI backend for the Ladder League app.

- All API endpoints for user, league, and score management.
- Uses the root-level `data/` folder for persistent storage.

## Running the Backend

```sh
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- The backend will be available at http://localhost:8000
- Make sure the `data/` directory exists at the project root.
