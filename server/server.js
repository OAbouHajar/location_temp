const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const SQLiteStorage = require('./database/sqlite-storage');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize SQLite storage
const storage = new SQLiteStorage();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Storage directory for SQLite database
const DATA_DIR = path.join(__dirname, 'storage');

// Initialize storage
async function initStorage() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('✅ Storage directory initialized');
        console.log('✅ SQLite database ready for location tracking');
    } catch (error) {
        console.error('Error initializing storage:', error);
    }
}

// Get IP-based geolocation
async function getIPGeolocation(ip) {
    try {
        // Use a free IP geolocation service
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        return response.data;
    } catch (error) {
        console.error('Error getting IP geolocation:', error);
        return null;
    }
}

// API Routes

// Collect main data
app.post('/api/collect', async (req, res) => {
    try {
        const clientIP = req.headers['x-forwarded-for'] || 
                         req.connection.remoteAddress || 
                         req.socket.remoteAddress ||
                         '127.0.0.1';

        // Get IP-based geolocation
        const ipGeo = await getIPGeolocation(clientIP);

        const sessionData = {
            ...req.body,
            clientIP,
            ipGeolocation: ipGeo,
            serverTimestamp: new Date().toISOString(),
            headers: {
                userAgent: req.headers['user-agent'],
                acceptLanguage: req.headers['accept-language'],
                referer: req.headers['referer'] || 'direct',
                origin: req.headers['origin']
            }
        };

        // Store in SQLite database
        await storage.insertSession(sessionData);
        
        // Store GPS location if available
        if (sessionData.gps && !sessionData.gps.error) {
            await storage.insertGPSLocation(sessionData.sessionId, sessionData.gps);
            console.log(`📍 GPS Location stored: ${sessionData.gps.latitude}, ${sessionData.gps.longitude}`);
        }
        
        // Store IP geolocation if available
        if (ipGeo && ipGeo.status === 'success') {
            await storage.insertIPGeolocation(sessionData.sessionId, ipGeo);
            console.log(`🌍 IP Location: ${ipGeo.city}, ${ipGeo.country}`);
        }

        console.log(`✅ Data collected for session: ${req.body.sessionId}`);
        console.log(`🔗 IP: ${clientIP}`);

        res.json({ 
            success: true, 
            message: 'Data collected successfully',
            sessionId: req.body.sessionId,
            hasGPS: sessionData.gps && !sessionData.gps.error,
            hasIPLocation: ipGeo && ipGeo.status === 'success'
        });
    } catch (error) {
        console.error('❌ Error collecting data:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to collect data' 
        });
    }
});

// Track interactions
app.post('/api/interaction', async (req, res) => {
    try {
        const interactionData = {
            ...req.body,
            serverTimestamp: new Date().toISOString()
        };

        // Store interaction in SQLite
        await storage.insertInteraction(interactionData);

        console.log(`📝 Interaction tracked: ${interactionData.type}`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error tracking interaction:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to track interaction' 
        });
    }
});

// Session end
app.post('/api/session-end', async (req, res) => {
    try {
        console.log(`🔚 Session ended: ${req.body.sessionId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error ending session:', error);
        res.status(500).json({ success: false });
    }
});

// View collected data (for admin/debugging)
app.get('/api/admin/sessions', async (req, res) => {
    try {
        const sessions = await storage.getAllSessions();
        
        res.json({
            total: sessions.length,
            sessions: sessions
        });
    } catch (error) {
        console.error('❌ Error reading sessions:', error);
        res.status(500).json({ error: 'Failed to read sessions' });
    }
});

// View interactions
app.get('/api/admin/interactions', async (req, res) => {
    try {
        // Get all interactions from all sessions
        const sessions = await storage.getAllSessions();
        let allInteractions = [];
        
        for (const session of sessions) {
            const interactions = await storage.getInteractionsBySession(session.session_id);
            allInteractions = allInteractions.concat(interactions);
        }
        
        res.json({
            total: allInteractions.length,
            interactions: allInteractions
        });
    } catch (error) {
        console.error('❌ Error reading interactions:', error);
        res.status(500).json({ error: 'Failed to read interactions' });
    }
});

// Get GPS locations specifically
app.get('/api/admin/locations', async (req, res) => {
    try {
        const locations = await storage.getAllGPSLocations();
        
        res.json({
            total: locations.length,
            locations: locations
        });
    } catch (error) {
        console.error('❌ Error reading GPS locations:', error);
        res.status(500).json({ error: 'Failed to read GPS locations' });
    }
});

// Export data as CSV
app.get('/api/admin/export/csv', async (req, res) => {
    try {
        const sessions = await storage.getAllSessions();
        const locations = await storage.getAllGPSLocations();
        
        // Create a map of sessions to their GPS data
        const sessionGPS = {};
        locations.forEach(loc => {
            sessionGPS[loc.session_id] = loc;
        });

        // Simple CSV export of key fields
        let csv = 'Session ID,Timestamp,IP,Browser,Platform,Screen Resolution,GPS Latitude,GPS Longitude,GPS Accuracy,GPS Timestamp\n';
        
        sessions.forEach(session => {
            const gps = sessionGPS[session.session_id] || {};
            csv += `${session.session_id},`;
            csv += `${session.created_at},`;
            csv += `${session.client_ip || 'N/A'},`;
            csv += `${session.user_agent?.split(' ')[0] || 'N/A'},`;
            csv += `${session.platform || 'N/A'},`;
            csv += `${session.screen_width}x${session.screen_height},`;
            csv += `${gps.latitude || 'N/A'},`;
            csv += `${gps.longitude || 'N/A'},`;
            csv += `${gps.accuracy || 'N/A'},`;
            csv += `${gps.created_at || 'N/A'}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=location-data.csv');
        res.send(csv);
    } catch (error) {
        console.error('❌ Error exporting CSV:', error);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// Clear all data (for testing)
app.post('/api/admin/clear', async (req, res) => {
    try {
        // Note: In SQLite, we'll just recreate the tables to clear data
        // This is a simple approach for testing
        await storage.db.run('DELETE FROM interactions');
        await storage.db.run('DELETE FROM gps_locations');
        await storage.db.run('DELETE FROM ip_geolocations');
        await storage.db.run('DELETE FROM device_fingerprints');
        await storage.db.run('DELETE FROM sessions');
        
        console.log('🗑️ All data cleared from database');
        res.json({ success: true, message: 'All data cleared from database' });
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        res.status(500).json({ error: 'Failed to clear data' });
    }
});

// Admin dashboard
app.get('/admin', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Data Collection Admin</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 1200px; 
                    margin: 50px auto; 
                    padding: 20px;
                    background: #f5f5f5;
                }
                h1 { color: #2c3e50; }
                .stats { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px; 
                    margin: 30px 0;
                }
                .stat-card {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .stat-value { 
                    font-size: 2.5rem; 
                    font-weight: bold; 
                    color: #3498db; 
                }
                button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 5px;
                    font-size: 1rem;
                }
                button:hover { background: #2980b9; }
                button.danger { background: #e74c3c; }
                button.danger:hover { background: #c0392b; }
                pre { 
                    background: white; 
                    padding: 20px; 
                    border-radius: 5px;
                    overflow-x: auto;
                    max-height: 500px;
                    overflow-y: auto;
                }
            </style>
        </head>
        <body>
            <h1>📊 Data Collection Dashboard</h1>
            
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-value" id="totalSessions">0</div>
                    <div>Total Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalInteractions">0</div>
                    <div>Total Interactions</div>
                </div>
            </div>

            <div>
                <button onclick="loadSessions()">View Sessions</button>
                <button onclick="loadInteractions()">View Interactions</button>
                <button onclick="exportCSV()">Export CSV</button>
                <button class="danger" onclick="clearData()">Clear All Data</button>
            </div>

            <div id="dataDisplay"></div>

            <script>
                async function loadSessions() {
                    const res = await fetch('/api/admin/sessions');
                    const data = await res.json();
                    document.getElementById('totalSessions').textContent = data.total;
                    document.getElementById('dataDisplay').innerHTML = 
                        '<h2>Sessions</h2><pre>' + JSON.stringify(data.sessions, null, 2) + '</pre>';
                }

                async function loadInteractions() {
                    const res = await fetch('/api/admin/interactions');
                    const data = await res.json();
                    document.getElementById('totalInteractions').textContent = data.total;
                    document.getElementById('dataDisplay').innerHTML = 
                        '<h2>Interactions</h2><pre>' + JSON.stringify(data.interactions, null, 2) + '</pre>';
                }

                function exportCSV() {
                    window.location.href = '/api/admin/export/csv';
                }

                async function clearData() {
                    if (confirm('Are you sure you want to clear all data?')) {
                        await fetch('/api/admin/clear', { method: 'POST' });
                        alert('Data cleared');
                        location.reload();
                    }
                }

                // Load stats on page load
                loadSessions();
                loadInteractions();
            </script>
        </body>
        </html>
    `);
});

// Additional routes for different dashboards
app.get('/location-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/location-dashboard.html'));
});

// Start server
async function startServer() {
    await initStorage();
    
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════╗
║         🌍 Location Data Collector Server             ║
╠═══════════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}          ║
║   🏠 Main app: http://localhost:${PORT}/                ║
║   📊 Admin panel: http://localhost:${PORT}/admin       ║
║   📍 Location dashboard: http://localhost:${PORT}/location-dashboard  ║
║   💾 Storage manager: http://localhost:${PORT}/storage-manager.html   ║
╠═══════════════════════════════════════════════════════╣
║   ✅ SQLite database ready for location tracking       ║
║   📍 GPS location collection enabled                   ║
║   🌐 IP-based geolocation fallback active             ║
╚═══════════════════════════════════════════════════════╝
        `);
    });
}

startServer();
