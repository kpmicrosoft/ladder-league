#!/bin/bash
# Startup script for Azure App Service
cd /home/site/wwwroot
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
