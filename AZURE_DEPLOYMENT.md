# 🚀 Azure Deployment Guide - Location Tracking App

## Overview
Your location tracking app is now ready to deploy to Azure using **Azure Static Web Apps** with **Azure Functions** backend and **Cosmos DB** for data storage.

## Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Static Web    │    │  Azure Functions │    │   Cosmos DB     │
│     Apps        │────│    (Backend)     │────│   (Database)    │
│  (Frontend)     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 IMPORTANT: Database Setup Required

Since your app now uses a **centralized database** for location tracking, you need to set up **Cosmos DB** instead of the local SQLite database.

### 1. Create Cosmos DB Account
```bash
# Login to Azure CLI
az login

# Create resource group (if not exists)
az group create --name rg-location-tracker --location eastus

# Create Cosmos DB account
az cosmosdb create \
  --name cosmos-location-tracker \
  --resource-group rg-location-tracker \
  --kind GlobalDocumentDB \
  --default-consistency-level Session

# Create database and container
az cosmosdb sql database create \
  --account-name cosmos-location-tracker \
  --resource-group rg-location-tracker \
  --name LocationTracker

az cosmosdb sql container create \
  --account-name cosmos-location-tracker \
  --resource-group rg-location-tracker \
  --database-name LocationTracker \
  --name Sessions \
  --partition-key-path "/id"
```

### 2. Get Cosmos DB Connection String
```bash
az cosmosdb keys list \
  --name cosmos-location-tracker \
  --resource-group rg-location-tracker \
  --type connection-strings
```

Copy the `Primary SQL Connection String` - you'll need this for configuration.

## 🚀 Deployment Steps

### Method 1: Using Your Existing Azure Static Web App

Since you already have an Azure Static Web App set up, you just need to:

1. **Configure Cosmos DB Connection:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to your existing Static Web App
   - Go to **Configuration** → **Application settings**
   - Add this setting:
     ```
     Name: CosmosDbConnectionString
     Value: [Your Cosmos DB connection string from step 2 above]
     ```

2. **Deploy your enhanced code:**
   ```bash
   git add .
   git commit -m "feat: add centralized location tracking with Cosmos DB"
   git push origin main
   ```

   The GitHub Action will automatically deploy your updated app!

## 🌍 Testing Your Deployment

### 1. Access Your Deployed App
- Main app: `https://[your-app-name].azurestaticapps.net/`
- **NEW**: Azure dashboard: `https://[your-app-name].azurestaticapps.net/azure-dashboard.html`

### 2. Test Location Collection
1. Visit your deployed app
2. Grant location permission when prompted
3. Check the Azure dashboard to see collected data in Cosmos DB

## 📊 New API Endpoints Available

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/collect` | POST | Collect visitor location data (enhanced) |
| `/api/admin/locations` | GET | Retrieve GPS locations from Cosmos DB |
| `/api/admin/sessions` | GET | Get all sessions |

## 🔧 What's Changed for Azure Deployment

### ✅ Files Updated for Cloud Deployment:
- ✅ `/api/collect/index.js` - Enhanced with detailed location tracking
- ✅ `/api/admin-locations/` - **NEW** endpoint for location data retrieval
- ✅ `/public/azure-dashboard.html` - **NEW** cloud-optimized dashboard
- ✅ `staticwebapp.config.json` - Updated routing for new dashboard

### 🗄️ Database Migration
- **Before**: Local SQLite database (doesn't work in cloud)
- **After**: Azure Cosmos DB (globally distributed, scalable)

## 🎯 Key Benefits of Azure Deployment

1. **Global Scale**: Your location data is stored in Cosmos DB with worldwide replication
2. **Serverless**: Azure Functions automatically scale based on traffic
3. **Security**: Connection strings securely stored in Azure App Settings
4. **Monitoring**: Built-in Application Insights for tracking performance
5. **Cost-Effective**: Pay only for what you use

## 🔍 Troubleshooting

### Common Issues:

1. **Location data not saving:**
   - ✅ Check Cosmos DB connection string in App Settings
   - ✅ Verify the database name is "LocationTracker" and container is "Sessions"

2. **Functions not working:**
   - ✅ Check function logs in Azure Portal
   - ✅ Verify API endpoints start with `/api/`

3. **Dashboard shows no data:**
   - ✅ Test the main app first to collect some location data
   - ✅ Check browser console for errors

## 🎉 Success Indicators

After deployment, you should see:
- ✅ Location data being collected in Cosmos DB
- ✅ Azure dashboard showing GPS coordinates and statistics
- ✅ Functions processing requests successfully
- ✅ Global availability and automatic scaling

---

## 🚀 Quick Start Summary

1. **Set up Cosmos DB** (see commands above)
2. **Add connection string** to Azure Static Web App settings
3. **Push your code** to trigger deployment
4. **Test location collection** at your deployed URL
5. **View analytics** at `/azure-dashboard.html`

Your centralized location tracking app is now ready for production! 🌍
   - You'll see the URL (e.g., `https://your-app-name.azurestaticapps.net`)

### Option B: Using Azure CLI (Alternative)

If you have Azure CLI installed:

```bash
# Login to Azure
az login

# Create resource group
az group create --name real-estate-rg --location westeurope

# Create Static Web App with GitHub integration
az staticwebapp create \
  --name real-estate-app \
  --resource-group real-estate-rg \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO_NAME \
  --location westeurope \
  --branch main \
  --app-location "/public" \
  --api-location "/server" \
  --login-with-github
```

## Step 3: Verify Deployment

1. Go to your GitHub repository
2. Click on "Actions" tab
3. You should see a workflow running
4. Wait for it to complete (green checkmark)
5. Visit your Azure Static Web App URL
6. Your app should be live!

## Automatic Updates

From now on, every time you push to the `main` branch on GitHub:
- GitHub Actions will automatically deploy to Azure
- Changes will be live in 1-2 minutes

## Important Notes

- **HTTPS is automatic** - Azure provides free SSL certificates
- **Custom domain**: You can add your own domain in Azure Portal
- **Free tier**: Includes 100GB bandwidth/month and is free for small apps
- **Location permission**: Make sure to test on HTTPS (required for geolocation)

## Troubleshooting

If deployment fails:
1. Check GitHub Actions logs in your repository
2. Verify the workflow file is in `.github/workflows/`
3. Make sure `AZURE_STATIC_WEB_APPS_API_TOKEN` secret exists in GitHub
4. Check that app_location is `/public` and api_location is `/server`

## Cost

Azure Static Web Apps has a **FREE tier** that includes:
- 100 GB bandwidth per month
- Custom domains
- Free SSL certificates
- GitHub integration
- Perfect for this project!

## Need Help?

If you encounter issues:
1. Check Azure Portal for error messages
2. Review GitHub Actions logs
3. Verify your repository structure matches the configuration
