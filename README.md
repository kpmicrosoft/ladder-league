# Ladder League Web App

A modern web application for managing ladder leagues, built with React (frontend) and FastAPI (backend).

## Live Application
- **Frontend**: https://kind-desert-008bcc01e.6.azurestaticapps.net
- **Backend API**: https://ladder-league-api.whitedesert-91991436.westus2.azurecontainerapps.io

## Features
- User signup/login
- Persistent user storage (JSON, can be upgraded to PostgreSQL)
- League/tournament browsing and joining
- League membership management
- Leaderboards with real match results, points, matches played, won/lost, and recent results
- Add match scores (supports tennis, badminton, pickleball)
- Animated, visually appealing UI

## Project Structure

```
ladder-league/
├── backend/         # FastAPI backend
│   ├── app/
│   │   └── main.py
│   └── requirements.txt
├── frontend/        # React frontend (TypeScript)
│   ├── src/
│   └── package.json
├── data/            # Persistent data (users, leagues, scores)
│   ├── users.json
│   ├── leagues.json
│   └── scores/
│       ├── arbors_tennis_league_scores.json
│       └── stratford_badminton_league_scores.json
└── README.md        # This file
```

## Local Development

1. **Backend:**
   ```sh
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend:**
   ```sh
   cd frontend
   npm install
   npm start
   ```

3. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Deployment to Azure

This application is deployed on Azure with the following setup:
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure Container Apps
- **Live URLs**:
  - Frontend: https://kind-desert-008bcc01e.6.azurestaticapps.net
  - Backend API: https://ladder-league-api.whitedesert-91991436.westus2.azurecontainerapps.io

### Prerequisites

1. **Azure CLI**: Install from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
2. **Azure Static Web Apps CLI**: `npm install -g @azure/static-web-apps-cli`
3. **Docker**: For building container images
4. **Node.js**: For building the frontend
5. **Azure Subscription**: Active Azure subscription

### Step-by-Step Deployment

#### 1. Login to Azure
```bash
az login
```

#### 2. Create Resource Group
```bash
az group create --name ladder-league-rg --location westus
```

#### 3. Deploy Backend to Azure Container Apps

##### Create Container Registry
```bash
az acr create --resource-group ladder-league-rg --name ladderleagueregistry --sku Basic --admin-enabled true
```

##### Get registry credentials
```bash
az acr credential show --name ladderleagueregistry
```

##### Build and push Docker image
```bash
cd backend
az acr build --registry ladderleagueregistry --image ladder-league-api:latest .
```

##### Create Container Apps environment
```bash
az containerapp env create \
  --name ladder-league-env \
  --resource-group ladder-league-rg \
  --location westus
```

##### Deploy the container app
```bash
az containerapp create \
  --name ladder-league-api \
  --resource-group ladder-league-rg \
  --environment ladder-league-env \
  --image ladderleagueregistry.azurecr.io/ladder-league-api:latest \
  --registry-server ladderleagueregistry.azurecr.io \
  --registry-username ladderleagueregistry \
  --registry-password <PASSWORD_FROM_CREDENTIALS> \
  --target-port 8000 \
  --ingress external \
  --env-vars LADDER_LEAGUE_DATA_DIR=/app/data
```

#### 4. Deploy Frontend to Azure Static Web Apps

##### Build the frontend
```bash
cd frontend
npm install
npm run build
```

##### Deploy using SWA CLI
```bash
swa deploy ./build --resource-group ladder-league-rg --app-name ladder-league-app
```

#### 5. Configure Environment Variables

The frontend automatically detects the environment and uses the appropriate API endpoint:
- **Development**: `http://localhost:8000`
- **Production**: `https://ladder-league-api.whitedesert-91991436.westus2.azurecontainerapps.io`

### Configuration Files

#### Backend Configuration
- `backend/Dockerfile`: Container configuration
- `backend/.deployment`: Azure deployment settings
- `backend/startup.sh`: Container startup script

#### Frontend Configuration
- `frontend/src/config.ts`: API endpoint configuration
- Environment-based API URL switching

### Data Persistence

The backend stores data in the container at `/app/data/` with the following structure:
- `leagues.json`: League definitions
- `users.json`: User accounts
- `scores/`: Match scores by league

### Updating Deployments

#### Update Backend
```bash
cd backend
az acr build --registry ladderleagueregistry --image ladder-league-api:latest .
az containerapp update --name ladder-league-api --resource-group ladder-league-rg --image ladderleagueregistry.azurecr.io/ladder-league-api:latest
```

#### Update Frontend
```bash
cd frontend
npm run build
swa deploy ./build --resource-group ladder-league-rg --app-name ladder-league-app
```

### Monitoring and Logs

#### View backend logs
```bash
az containerapp logs show --name ladder-league-api --resource-group ladder-league-rg
```

#### View resource status
```bash
az containerapp show --name ladder-league-api --resource-group ladder-league-rg
az staticwebapp show --name ladder-league-app --resource-group ladder-league-rg
```

## Notes
- Do NOT commit `venv/`, `.venv/`, or `node_modules/` folders. See `.gitignore`.
- All persistent data is stored in the `data/` folder at the project root.

---

## Sub-pages

### backend/README.md
```
# Backend (FastAPI)

- All API endpoints for user, league, and score management.
- Uses the root-level `data/` folder for persistent storage.
- To run:
  ```sh
  pip install -r requirements.txt
  uvicorn app.main:app --reload
  ```
```

### frontend/README.md
```
# Frontend (React)

- Modern React app (TypeScript) for ladder league management.
- Animated UI, leaderboard, score entry, and more.
- To run:
  ```sh
  npm install
  npm start
  ```
```

### data/README.md
```
# Data Directory

- All persistent data for the app (users, leagues, scores).
- Structure:
  - users.json
  - leagues.json
  - scores/
```
