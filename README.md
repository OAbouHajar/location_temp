# Real Estate Data Collection Web Application

A professional real estate website that collects comprehensive user data for analytics purposes.

## 🎯 Features

### Frontend (Real Estate Website)
- Professional property listings
- Search and filter functionality
- Contact forms
- Responsive design
- Mobile-friendly interface

### Data Collection Capabilities

#### Automatic Collection (No Permission Required)
- **Browser Fingerprinting**:
  - Canvas fingerprinting
  - WebGL fingerprinting
  - Audio fingerprinting
  - Font detection
- **Device Information**:
  - User agent, platform, language
  - Screen resolution & color depth
  - Hardware concurrency (CPU cores)
  - Device memory
  - Touch support detection
- **Network Information**:
  - Connection type (WiFi, 4G, etc.)
  - Bandwidth estimation
  - Round-trip time (RTT)
- **Location Data**:
  - IP-based geolocation (city/country level)
  - Timezone information
- **Browser Capabilities**:
  - Installed plugins
  - Ad blocker detection
  - WebRTC local IPs
  - Cookie status
  - Do Not Track setting
- **Behavioral Tracking**:
  - Mouse movements
  - Scroll depth
  - Time on page
  - Click patterns
  - Form interactions

#### Permission-Based Collection
- **GPS Location**: High-precision coordinates (requires user approval)
- **Device Orientation**: Gyroscope/accelerometer data
- **Battery Status**: Charging state and level

## 📁 Project Structure

```
real-estate-webapp/
├── public/
│   ├── index.html              # Main webpage
│   ├── css/
│   │   └── styles.css          # Styling
│   └── js/
│       ├── fingerprint.js      # Browser fingerprinting
│       ├── collector.js        # Data collection engine
│       └── app.js              # UI logic
├── server/
│   ├── server.js               # Express backend
│   └── storage/                # Data storage (auto-created)
│       ├── sessions.json       # Session data
│       └── interactions.json   # User interactions
├── package.json
├── web.config                  # Azure deployment config
├── .gitignore
└── README.md
```

## 🚀 Quick Start

### Local Development

1. **Install Dependencies**:
```bash
npm install
```

2. **Start the Server**:
```bash
npm start
```

3. **Access the Application**:
- Main site: http://localhost:3000
- Admin panel: http://localhost:3000/admin

### Development Mode (Auto-reload)
```bash
npm run dev
```

## 📊 Admin Dashboard

Access the admin dashboard at `/admin` to:
- View collected sessions and interactions
- Export data as CSV
- Clear all data
- Monitor real-time statistics

### API Endpoints

- `POST /api/collect` - Receive session data
- `POST /api/interaction` - Track user interactions
- `POST /api/session-end` - Log session end
- `GET /api/admin/sessions` - View all sessions
- `GET /api/admin/interactions` - View all interactions
- `GET /api/admin/export/csv` - Export data as CSV
- `POST /api/admin/clear` - Clear all collected data

## ☁️ Azure Deployment

### Prerequisites
- Azure account
- Azure CLI installed

### Deployment Steps

1. **Login to Azure**:
```bash
az login
```

2. **Create Resource Group**:
```bash
az group create --name RealEstateApp --location eastus
```

3. **Create App Service Plan**:
```bash
az appservice plan create --name RealEstatePlan --resource-group RealEstateApp --sku B1 --is-linux
```

4. **Create Web App**:
```bash
az webapp create --resource-group RealEstateApp --plan RealEstatePlan --name your-unique-app-name --runtime "NODE|18-lts"
```

5. **Deploy from Local Git**:
```bash
# Configure deployment user
az webapp deployment user set --user-name <username> --password <password>

# Get Git URL
az webapp deployment source config-local-git --name your-unique-app-name --resource-group RealEstateApp

# Add Azure remote
git remote add azure <git-url-from-previous-command>

# Deploy
git add .
git commit -m "Initial deployment"
git push azure main
```

6. **Configure App Settings**:
```bash
az webapp config appsettings set --resource-group RealEstateApp --name your-unique-app-name --settings PORT=8080
```

### Alternative: Deploy from GitHub

1. Fork this repository
2. In Azure Portal:
   - Go to your App Service
   - Select "Deployment Center"
   - Choose GitHub as source
   - Authorize and select your repository
   - Configure branch (main/master)
   - Save

### Environment Variables (Optional)

Set in Azure App Service Configuration:
```bash
PORT=8080
NODE_ENV=production
```

## 📈 Data Collection Flow

1. **Page Load**: Automatic data collection starts
2. **Passive Collection**: Collects all available data without permissions
3. **User Interaction**: "Find Properties Near You" button triggers GPS request
4. **Data Storage**: All data saved to JSON files on server
5. **Admin Review**: View and export data from admin dashboard

## 🔒 Collected Data Structure

### Session Data
```json
{
  "sessionId": "unique-id",
  "timestamp": "ISO-8601",
  "clientIP": "x.x.x.x",
  "ipGeolocation": {
    "city": "City",
    "country": "Country",
    "lat": 0.0,
    "lon": 0.0
  },
  "device": { /* device info */ },
  "screen": { /* screen info */ },
  "network": { /* network info */ },
  "fingerprints": { /* browser fingerprints */ },
  "gps": { /* GPS data if granted */ }
}
```

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Storage**: JSON file-based (easily upgradeable to database)
- **Deployment**: Azure App Service
- **APIs**: Geolocation API, Network Information API, Battery API, WebRTC

## ⚠️ Legal & Ethical Considerations

**IMPORTANT**: This application collects user data. Ensure compliance with:

- **GDPR** (EU users)
- **CCPA** (California users)
- **Local privacy laws**

### Recommendations:
1. Add a privacy policy
2. Include cookie consent banner
3. Provide opt-out mechanisms
4. Clearly disclose data collection practices
5. Implement data retention policies
6. Secure collected data appropriately

## 📝 License

This project is for educational/analytical purposes only. Use responsibly and in compliance with applicable laws.

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change port in server/server.js or set environment variable
PORT=3001 npm start
```

### Data Not Collecting
- Check browser console for errors
- Verify server is running
- Check network tab for API calls
- Ensure `/api/collect` endpoint is reachable

### Azure Deployment Issues
- Verify Node.js version compatibility
- Check Azure logs: `az webapp log tail --name your-app-name --resource-group RealEstateApp`
- Ensure web.config is properly configured
- Verify storage directory permissions

## 📧 Support

For issues or questions, check the logs or review the admin dashboard for debugging information.
