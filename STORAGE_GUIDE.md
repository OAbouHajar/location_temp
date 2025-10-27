# 📦 Location Data Storage Guide

## Overview

Your location tracking system now supports **multiple storage options** to store user location data and interactions:

1. **JSON Files** (Default) - Simple, no setup required
2. **SQLite Database** - Better performance, structured data
3. **MongoDB** - Scalable, cloud-ready, geospatial queries

---

## Current Storage Methods

### 1. Browser LocalStorage (Client-Side Backup)
- Automatically stores data in user's browser
- Maximum 100 sessions, 500 interactions
- Accessible via `storage-manager.html` page
- **Files**: `public/js/collector.js` (lines 272-295)

### 2. Server-Side Storage (Your Choice)
- Choose between JSON, SQLite, or MongoDB
- Persistent, unlimited storage
- Accessible via `/admin` dashboard

---

## Storage Options Comparison

| Feature | JSON Files | SQLite | MongoDB |
|---------|-----------|--------|---------|
| **Setup** | ✅ None | ✅ Easy | ⚠️ Requires DB |
| **Performance** | Good (< 1000 records) | Excellent | Excellent |
| **Scalability** | Limited | Medium | Unlimited |
| **Queries** | Basic | Advanced | Advanced + Geo |
| **Best For** | Testing, Small sites | Production | Large scale |

---

## Quick Start

### Option 1: JSON Files (Default - Already Working!)

**No setup required!** Your data is already being stored in:
- `server/storage/sessions.json`
- `server/storage/interactions.json`

```bash
npm start
```

### Option 2: SQLite Database

**Install dependencies:**
```bash
npm install
```

**Create `.env` file:**
```bash
cp .env.example .env
```

**Edit `.env`:**
```env
STORAGE_TYPE=sqlite
```

**Start server:**
```bash
npm start
```

Your data will be stored in `server/storage/location_data.db`

### Option 3: MongoDB

**Install dependencies:**
```bash
npm install
```

**Option A - Local MongoDB:**
```bash
# Install MongoDB locally
brew install mongodb-community  # macOS
# or follow https://www.mongodb.com/docs/manual/installation/

# Start MongoDB
brew services start mongodb-community

# Create .env file
cp .env.example .env
```

**Option B - MongoDB Atlas (Cloud):**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Create `.env` file

**Edit `.env`:**
```env
STORAGE_TYPE=mongodb
MONGODB_URI=mongodb://localhost:27017/location_tracker
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/location_tracker
```

**Start server:**
```bash
npm start
```

---

## What Data Is Stored?

### Session Data
- **Session ID**: Unique identifier
- **GPS Location**: Latitude, longitude, accuracy
- **IP Geolocation**: City, country, ISP
- **Device Info**: Browser, platform, screen size
- **Fingerprints**: Canvas, WebGL, audio signatures
- **Network**: Connection type, speed
- **Timezone**: User's timezone
- **Timestamps**: When data was collected

### Interaction Data
- User clicks, scrolls, form submissions
- Property views
- Search queries
- Time spent on page
- Navigation patterns

---

## Accessing Your Data

### 1. Admin Dashboard
```
http://localhost:3000/admin
```
- View all sessions
- View interactions
- Export to CSV
- Clear data
- Statistics

### 2. Browser Storage Manager
```
http://localhost:3000/storage-manager.html
```
- View localStorage data
- Export browser data
- Clear browser cache

### 3. API Endpoints

**Get all sessions:**
```bash
GET http://localhost:3000/api/admin/sessions
```

**Get all interactions:**
```bash
GET http://localhost:3000/api/admin/interactions
```

**Export CSV:**
```bash
GET http://localhost:3000/api/admin/export/csv
```

---

## Database Schema

### SQLite/MongoDB Tables/Collections

#### Sessions
- `session_id` - Unique identifier
- `client_ip` - User's IP address
- `user_agent` - Browser info
- `platform` - OS platform
- `language` - Browser language
- `screen_width` / `screen_height` - Display size
- `timezone` - User timezone
- `created_at` / `updated_at` - Timestamps

#### GPS Locations
- `session_id` - Foreign key
- `latitude` / `longitude` - GPS coordinates
- `accuracy` - Location accuracy in meters
- `altitude` / `heading` / `speed` - Additional GPS data
- `timestamp` - When location was captured

#### IP Geolocation
- `session_id` - Foreign key
- `ip_address` - IP used
- `country` / `city` / `region` - Location
- `lat` / `lon` - Approximate coordinates
- `isp` - Internet provider
- `timezone` - IP-based timezone

#### Interactions
- `session_id` - Foreign key
- `interaction_type` - Type (click, scroll, etc.)
- `data` - Interaction details (JSON)
- `timestamp` - When it occurred

---

## Advanced Features

### MongoDB Geospatial Queries

Find all users within 5km of a location:
```javascript
const nearbyUsers = await storage.findLocationsNear(
  -7.297284,  // longitude
  53.036136,  // latitude
  5000        // 5km in meters
);
```

### Statistics API

Get usage statistics:
```bash
GET http://localhost:3000/api/admin/statistics
```

Returns:
```json
{
  "total_sessions": 150,
  "total_gps_locations": 89,
  "total_interactions": 1250,
  "sessions_with_gps": 89,
  "gps_permission_rate": "59.33%"
}
```

---

## Data Privacy & GDPR

### Compliance Features
- Session-based tracking (anonymous by default)
- No PII (Personal Identifiable Information) collected without consent
- GPS requires explicit user permission
- Clear data export functionality
- Easy data deletion (clear button in admin)

### Recommended Practices
1. Add privacy policy to your website
2. Get user consent before GPS tracking
3. Explain what data you collect
4. Provide data export/deletion options
5. Secure your admin panel (add authentication)

---

## Backup & Export

### Manual Backup (JSON)
```bash
cp server/storage/sessions.json backups/sessions-$(date +%Y%m%d).json
cp server/storage/interactions.json backups/interactions-$(date +%Y%m%d).json
```

### SQLite Backup
```bash
sqlite3 server/storage/location_data.db .dump > backup.sql
```

### MongoDB Backup
```bash
mongodump --uri="mongodb://localhost:27017/location_tracker"
```

### Export via API
```bash
curl http://localhost:3000/api/admin/export/csv -o data.csv
```

---

## Switching Storage Types

You can switch between storage types anytime:

1. **Stop the server** (Ctrl+C)
2. **Edit `.env` file:**
   ```env
   STORAGE_TYPE=sqlite  # or json or mongodb
   ```
3. **Restart server:**
   ```bash
   npm start
   ```

**Note**: Existing data won't migrate automatically. Export before switching if you want to keep it.

---

## Migration Script (Optional)

To migrate from JSON to SQLite/MongoDB:

```javascript
// migration.js
const JSONStorage = require('./server/database/storage-config');
const SQLiteStorage = require('./server/database/sqlite-storage');

async function migrate() {
  const jsonStore = new JSONStorage();
  await jsonStore.initialize();
  
  const sqliteStore = new SQLiteStorage();
  
  const data = await jsonStore.exportAllData();
  
  for (const session of data.sessions) {
    await sqliteStore.insertSession(session);
    if (session.gps) {
      await sqliteStore.insertGPSLocation(session.sessionId, session.gps);
    }
  }
  
  console.log('Migration complete!');
}

migrate();
```

---

## Troubleshooting

### "Cannot find module 'sqlite3'"
```bash
npm install
```

### "MongoDB connection failed"
- Check MongoDB is running: `brew services list`
- Check connection string in `.env`
- For Atlas: verify network access settings

### "Permission denied" on storage directory
```bash
chmod 755 server/storage
```

### Data not appearing
- Check browser console for errors
- Verify server is running: `http://localhost:3000`
- Check admin panel: `http://localhost:3000/admin`

---

## Production Deployment

### Environment Variables
Set in your hosting platform:
```env
STORAGE_TYPE=mongodb
MONGODB_URI=mongodb+srv://...
PORT=3000
```

### Recommended Setup
- Use MongoDB Atlas for cloud database
- Enable SSL/TLS
- Add authentication to admin panel
- Set up automated backups
- Monitor storage usage

---

## Files Reference

| File | Purpose |
|------|---------|
| `server/database/storage-config.js` | Storage type selector |
| `server/database/sqlite-storage.js` | SQLite implementation |
| `server/database/mongodb-storage.js` | MongoDB implementation |
| `server/storage/sessions.json` | JSON session data |
| `server/storage/interactions.json` | JSON interaction data |
| `public/js/collector.js` | Client-side data collection |
| `server/server.js` | Main server file |
| `.env` | Configuration (create from `.env.example`) |

---

## Need Help?

- Check server logs for errors
- Visit admin dashboard for data verification
- Review `server/server.js` for API endpoints
- Check browser console for client-side issues

Your location data is being collected and stored successfully! 🎉
