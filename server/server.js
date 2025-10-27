const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Storage file paths
const DATA_DIR = path.join(__dirname, 'storage');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');

// Initialize storage
async function initStorage() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Create sessions file if it doesn't exist
        try {
            await fs.access(SESSIONS_FILE);
        } catch {
            await fs.writeFile(SESSIONS_FILE, JSON.stringify([], null, 2));
        }

        // Create interactions file if it doesn't exist
        try {
            await fs.access(INTERACTIONS_FILE);
        } catch {
            await fs.writeFile(INTERACTIONS_FILE, JSON.stringify([], null, 2));
        }

        console.log('Storage initialized');
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
                         req.socket.remoteAddress;

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

        // Read existing sessions
        const sessionsData = await fs.readFile(SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(sessionsData);

        // Add new session
        sessions.push(sessionData);

        // Save to file
        await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));

        console.log(`Data collected for session: ${req.body.sessionId}`);
        console.log(`IP: ${clientIP}, Location: ${ipGeo?.city}, ${ipGeo?.country}`);

        res.json({ 
            success: true, 
            message: 'Data collected successfully',
            sessionId: req.body.sessionId
        });
    } catch (error) {
        console.error('Error collecting data:', error);
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

        // Read existing interactions
        const interactionsData = await fs.readFile(INTERACTIONS_FILE, 'utf8');
        const interactions = JSON.parse(interactionsData);

        // Add new interaction
        interactions.push(interactionData);

        // Save to file
        await fs.writeFile(INTERACTIONS_FILE, JSON.stringify(interactions, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking interaction:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to track interaction' 
        });
    }
});

// Session end
app.post('/api/session-end', async (req, res) => {
    try {
        console.log(`Session ended: ${req.body.sessionId}`);
        res.json({ success: true });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ success: false });
    }
});

// View collected data (for admin/debugging)
app.get('/api/admin/sessions', async (req, res) => {
    try {
        const sessionsData = await fs.readFile(SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(sessionsData);
        
        res.json({
            total: sessions.length,
            sessions: sessions
        });
    } catch (error) {
        console.error('Error reading sessions:', error);
        res.status(500).json({ error: 'Failed to read sessions' });
    }
});

// View interactions
app.get('/api/admin/interactions', async (req, res) => {
    try {
        const interactionsData = await fs.readFile(INTERACTIONS_FILE, 'utf8');
        const interactions = JSON.parse(interactionsData);
        
        res.json({
            total: interactions.length,
            interactions: interactions
        });
    } catch (error) {
        console.error('Error reading interactions:', error);
        res.status(500).json({ error: 'Failed to read interactions' });
    }
});

// Export data as CSV
app.get('/api/admin/export/csv', async (req, res) => {
    try {
        const sessionsData = await fs.readFile(SESSIONS_FILE, 'utf8');
        const sessions = JSON.parse(sessionsData);

        // Simple CSV export of key fields
        let csv = 'Session ID,Timestamp,IP,City,Country,Browser,Platform,Screen Resolution,GPS Latitude,GPS Longitude,GPS Accuracy\n';
        
        sessions.forEach(session => {
            const gps = session.gps || {};
            csv += `${session.sessionId},`;
            csv += `${session.timestamp},`;
            csv += `${session.clientIP},`;
            csv += `${session.ipGeolocation?.city || 'N/A'},`;
            csv += `${session.ipGeolocation?.country || 'N/A'},`;
            csv += `${session.device?.userAgent?.split(' ')[0] || 'N/A'},`;
            csv += `${session.device?.platform || 'N/A'},`;
            csv += `${session.screen?.screenWidth}x${session.screen?.screenHeight},`;
            csv += `${gps.latitude || 'N/A'},`;
            csv += `${gps.longitude || 'N/A'},`;
            csv += `${gps.accuracy || 'N/A'}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=collected-data.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: 'Failed to export CSV' });
    }
});

// Clear all data (for testing)
app.post('/api/admin/clear', async (req, res) => {
    try {
        await fs.writeFile(SESSIONS_FILE, JSON.stringify([], null, 2));
        await fs.writeFile(INTERACTIONS_FILE, JSON.stringify([], null, 2));
        
        res.json({ success: true, message: 'All data cleared' });
    } catch (error) {
        console.error('Error clearing data:', error);
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

// Start server
async function startServer() {
    await initStorage();
    
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════╗
║   Real Estate Data Collector Server           ║
╠════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}   ║
║   Admin panel: http://localhost:${PORT}/admin  ║
╚════════════════════════════════════════════════╝
        `);
    });
}

startServer();
