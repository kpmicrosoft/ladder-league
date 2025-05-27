// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ladder-league-api.whitedesert-91991436.westus2.azurecontainerapps.io'
  : 'http://localhost:8000';

export { API_BASE_URL };
