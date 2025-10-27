# Azure Deployment Guide - Easy Method

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit - Real Estate App with Location Permission"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Create Azure Static Web App

### Option A: Using Azure Portal (Easiest - No CLI needed)

1. **Go to Azure Portal**: https://portal.azure.com
2. **Click "Create a resource"**
3. **Search for "Static Web App"** and click Create
4. **Fill in the details**:
   - **Subscription**: Choose your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: Give it a name (e.g., `real-estate-app`)
   - **Region**: Choose closest to you (e.g., West Europe)
   - **Deployment Details**:
     - Source: **GitHub**
     - Click "Sign in with GitHub"
     - Organization: Your GitHub username
     - Repository: Select your repository
     - Branch: `main`
   - **Build Details**:
     - Build Presets: **Custom**
     - App location: `/public`
     - Api location: `/server`
     - Output location: leave empty

5. **Click "Review + Create"** then **"Create"**

6. **Wait for deployment** (takes 2-3 minutes)
   - Azure will automatically:
     - Add a deployment token to your GitHub repository secrets
     - Create the workflow file (or use the one we created)
     - Deploy your app

7. **Get your URL**:
   - After creation, go to your Static Web App resource
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
