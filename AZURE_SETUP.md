# 🚀 Azure Deployment Setup Guide

## Problem Solved
Your Azure Static Web App now has a **backend** to store location data from all devices (phone, tablet, desktop) in a **cloud database**.

---

## What We Created

### Azure Functions API
- ✅ `/api/collect` - Stores session data (GPS, device info)
- ✅ `/api/interaction` - Tracks user interactions
- ✅ `/api/admin/sessions` - View all sessions
- ✅ `/api/admin/interactions` - View all interactions

### Database: Azure Cosmos DB
- Stores all location data permanently
- Accessible from anywhere
- Automatically scales
- Free tier available (25GB storage, 1000 RU/s)

---

## Setup Instructions

### Step 1: Create Cosmos DB Account

1. **Go to Azure Portal**: https://portal.azure.com

2. **Create Cosmos DB**:
   - Click "Create a resource"
   - Search for "Azure Cosmos DB"
   - Click "Create" → "Azure Cosmos DB for NoSQL"

3. **Configure**:
   - **Subscription**: Your subscription
   - **Resource Group**: Same as your Static Web App (or create new)
   - **Account Name**: `location-tracker-db` (must be unique)
   - **Location**: Same region as your Static Web App
   - **Capacity mode**: Serverless (FREE for development)
   - Click "Review + Create" → "Create"

4. **Wait for deployment** (2-3 minutes)

### Step 2: Get Connection String

1. **Open your Cosmos DB account**
2. **Go to "Keys"** (left menu)
3. **Copy "PRIMARY CONNECTION STRING"**
   - It looks like: `AccountEndpoint=https://...;AccountKey=...`

### Step 3: Configure Azure Static Web App

1. **Go to your Static Web App**: 
   - https://portal.azure.com
   - Find "purple-water-0d0bc2403"

2. **Go to "Configuration"** (left menu)

3. **Add Application Setting**:
   - Click "+ Add"
   - **Name**: `CosmosDbConnectionString`
   - **Value**: Paste the connection string from Step 2
   - Click "OK"
   - Click "Save" at the top

### Step 4: Deploy the Code

#### Option A: Using GitHub (Recommended)

1. **Commit and push your code**:
```bash
git add .
git commit -m "Add Azure Functions backend"
git push origin main
```

2. **Azure will automatically deploy** (takes 2-3 minutes)
   - Check deployment status in Azure Portal → Static Web Apps → Deployment history

#### Option B: Manual Deploy

1. **Install Azure Static Web Apps CLI**:
```bash
npm install -g @azure/static-web-apps-cli
```

2. **Deploy**:
```bash
swa deploy --env production
```

### Step 5: Verify It's Working

1. **Test from your phone**:
   - Visit: https://purple-water-0d0bc2403.3.azurestaticapps.net
   - Click the button to grant location permission
   - Wait 5 seconds

2. **Check admin panel**:
   - Visit: https://purple-water-0d0bc2403.3.azurestaticapps.net/admin
   - You should see your session data!

3. **Test API directly**:
```bash
curl https://purple-water-0d0bc2403.3.azurestaticapps.net/api/admin/sessions
```

---

## How It Works Now

### Before (Not Working)
```
Phone → Website → localStorage only
Computer → Website → localStorage only
❌ No shared database
❌ Can't see phone data on computer
```

### After (Working!)
```
Phone → Website → Azure Functions → Cosmos DB ✅
Computer → Website → Azure Functions → Cosmos DB ✅
Tablet → Website → Azure Functions → Cosmos DB ✅

Admin Panel → Shows ALL data from ALL devices! 🎉
```

---

## Viewing Your Data

### Method 1: Admin Dashboard
**URL**: https://purple-water-0d0bc2403.3.azurestaticapps.net/admin

Shows:
- All sessions from all devices
- GPS locations
- User interactions
- Device information
- Timestamps

### Method 2: Azure Portal
1. Go to Cosmos DB → Data Explorer
2. Database: `LocationTracker`
3. Collections:
   - `Sessions` - All session data
   - `Interactions` - All user interactions

### Method 3: Direct API
```bash
# Get all sessions
curl https://purple-water-0d0bc2403.3.azurestaticapps.net/api/admin/sessions

# Get all interactions
curl https://purple-water-0d0bc2403.3.azurestaticapps.net/api/admin/interactions
```

---

## What Data Gets Stored

Every time someone visits your website from ANY device:

### Session Data (Cosmos DB → Sessions collection)
```json
{
  "id": "session_1234567890_abc123",
  "sessionId": "session_1234567890_abc123",
  "clientIP": "81.123.45.67",
  "gps": {
    "latitude": 53.036136,
    "longitude": -7.297284,
    "accuracy": 35
  },
  "device": {
    "userAgent": "Mozilla/5.0...",
    "platform": "iPhone",
    "language": "en-US",
    "screenWidth": 390,
    "screenHeight": 844
  },
  "timezone": {
    "timezone": "Europe/Dublin",
    "locale": "en-IE"
  },
  "serverTimestamp": "2025-10-27T23:15:00.000Z"
}
```

### Interaction Data (Cosmos DB → Interactions collection)
```json
{
  "id": "session_123_1698445200_xyz",
  "sessionId": "session_1234567890_abc123",
  "type": "scroll_50",
  "data": {
    "depth": 52.3
  },
  "timestamp": "2025-10-27T23:16:30.000Z"
}
```

---

## Troubleshooting

### "No data showing in admin panel"

**Check 1: Is Cosmos DB configured?**
```bash
# In Azure Portal
Static Web Apps → Configuration → Application settings
# Should see: CosmosDbConnectionString = AccountEndpoint=...
```

**Check 2: Are Functions deployed?**
```bash
# In Azure Portal
Static Web Apps → Functions
# Should see: collect, interaction, admin-sessions, admin-interactions
```

**Check 3: Test API directly**
```bash
curl https://purple-water-0d0bc2403.3.azurestaticapps.net/api/admin/sessions
# Should return: {"total": 0, "sessions": []}
```

**Check 4: Browser Console**
```javascript
// Open browser console (F12)
// Should see: "Data sent successfully to server"
// NOT: "Server unavailable, data saved locally"
```

### "Functions not deploying"

1. **Check GitHub Actions**:
   - Go to your GitHub repo
   - Click "Actions" tab
   - Check if workflow is failing

2. **Check build logs**:
   - Azure Portal → Static Web Apps → Deployment history
   - Click on latest deployment
   - Check logs for errors

3. **Verify file structure**:
```
your-repo/
├── api/
│   ├── collect/
│   │   ├── function.json
│   │   └── index.js
│   ├── interaction/
│   ├── admin-sessions/
│   └── admin-interactions/
├── host.json
└── public/
```

### "Cosmos DB connection failed"

1. **Verify connection string**:
   - Azure Portal → Cosmos DB → Keys
   - Copy PRIMARY CONNECTION STRING
   - Azure Portal → Static Web Apps → Configuration
   - Update `CosmosDbConnectionString`

2. **Check Cosmos DB is running**:
   - Azure Portal → Cosmos DB
   - Status should be "Online"

---

## Cost Estimate

### Free Tier (Included)
- ✅ **Azure Static Web Apps**: FREE (100GB bandwidth/month)
- ✅ **Azure Functions**: FREE (1M executions/month)
- ✅ **Cosmos DB Serverless**: FREE first 1000 RU/s

### Expected Usage
For a small website (< 1000 visitors/month):
- **Total Cost**: $0/month (stays in free tier)

For medium website (10,000 visitors/month):
- **Static Web Apps**: $0
- **Functions**: $0
- **Cosmos DB**: ~$2-5/month
- **Total**: ~$2-5/month

---

## Monitoring

### View Real-time Data
**Azure Portal → Cosmos DB → Data Explorer**
- See data as it comes in
- Run queries
- Export data

### View Logs
**Azure Portal → Static Web Apps → Application Insights**
- API request logs
- Error tracking
- Performance metrics

### Function Logs
**Azure Portal → Static Web Apps → Functions → Monitor**
- Execution count
- Success/failure rate
- Duration times

---

## Next Steps

### Security (Optional but Recommended)

Add authentication to admin panel:

1. **Azure Portal → Static Web Apps → Role Management**
2. **Add role**: `admin`
3. **Update** `staticwebapp.config.json`:
```json
{
  "routes": [
    {
      "route": "/admin",
      "allowedRoles": ["admin"]
    }
  ]
}
```

### Backup Strategy

**Automatic backups** are included with Cosmos DB:
- Continuous backup for 7 days (free)
- Point-in-time restore available

**Manual export**:
```bash
# Download all data via API
curl https://your-site.azurestaticapps.net/api/admin/sessions > backup.json
```

---

## Files Created

| File | Purpose |
|------|---------|
| `api/collect/` | Stores session data to Cosmos DB |
| `api/interaction/` | Stores interaction data to Cosmos DB |
| `api/admin-sessions/` | Retrieves all sessions |
| `api/admin-interactions/` | Retrieves all interactions |
| `host.json` | Azure Functions configuration |

---

## Support

**Azure Documentation**:
- Static Web Apps: https://docs.microsoft.com/azure/static-web-apps/
- Azure Functions: https://docs.microsoft.com/azure/azure-functions/
- Cosmos DB: https://docs.microsoft.com/azure/cosmos-db/

**Check deployment status**:
```
https://portal.azure.com
→ Static Web Apps
→ purple-water-0d0bc2403
→ Deployment history
```

---

## Success Checklist

- [ ] Cosmos DB created and online
- [ ] Connection string added to Static Web App configuration
- [ ] Code committed and pushed to GitHub
- [ ] GitHub Actions deployment succeeded
- [ ] API endpoints responding (test with curl)
- [ ] Admin panel shows data
- [ ] Phone data visible on computer admin panel

Once all checked, your location tracking system is **fully operational**! 🎉
