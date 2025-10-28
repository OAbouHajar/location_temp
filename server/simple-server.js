const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage for simplicity (resets on restart)
let collectedSessions = [];
let collectedLocations = [];

// API Routes
app.post('/api/collect', (req, res) => {
    try {
        const sessionData = req.body;
        
        // Get client IP
        const clientIP = req.headers['x-forwarded-for'] || 
                         req.headers['x-real-ip'] || 
                         req.connection.remoteAddress || 
                         'unknown';

        // Create simple data structure
        const simpleData = {
            sessionId: sessionData.sessionId,
            timestamp: new Date().toISOString(),
            clientIP: clientIP,
            location: {
                hasGPS: sessionData.gps && !sessionData.gps.error,
                latitude: sessionData.gps && sessionData.gps.latitude ? sessionData.gps.latitude : null,
                longitude: sessionData.gps && sessionData.gps.longitude ? sessionData.gps.longitude : null,
                accuracy: sessionData.gps && sessionData.gps.accuracy ? sessionData.gps.accuracy : null,
                source: sessionData.locationSource || 'unknown'
            },
            device: {
                userAgent: req.headers['user-agent'],
                platform: sessionData.device?.platform,
                screenWidth: sessionData.screen?.screenWidth,
                screenHeight: sessionData.screen?.screenHeight,
                language: sessionData.device?.language
            }
        };

        // Store in memory
        collectedSessions.push(simpleData);
        
        // Store location separately if GPS available
        if (simpleData.location.hasGPS) {
            collectedLocations.push({
                sessionId: simpleData.sessionId,
                timestamp: simpleData.timestamp,
                location: simpleData.location,
                client: {
                    ip: simpleData.clientIP,
                    userAgent: simpleData.device.userAgent,
                    platform: simpleData.device.platform
                }
            });
        }

        console.log(`📍 Location collected: ${simpleData.location.hasGPS ? 
            `${simpleData.location.latitude}, ${simpleData.location.longitude}` : 
            'No GPS'}`);

        res.json({
            success: true,
            message: 'Location data collected successfully',
            sessionId: sessionData.sessionId,
            location: simpleData.location,
            timestamp: simpleData.timestamp
        });

    } catch (error) {
        console.error('❌ Error collecting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to collect location data'
        });
    }
});

app.get('/api/admin/locations', (req, res) => {
    try {
        const stats = {
            totalSessions: collectedSessions.length,
            sessionsWithGPS: collectedLocations.length,
            gpsSuccessRate: collectedSessions.length > 0 ? 
                ((collectedLocations.length / collectedSessions.length) * 100).toFixed(1) : 0,
            lastCollected: collectedLocations.length > 0 ? 
                collectedLocations[collectedLocations.length - 1].timestamp : null
        };

        res.json({
            success: true,
            stats: stats,
            locations: collectedLocations,
            total: collectedLocations.length
        });

    } catch (error) {
        console.error('❌ Error retrieving locations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve location data'
        });
    }
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/azure-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/azure-dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║         🌍 Simple Location Tracker Server            ║
╠═══════════════════════════════════════════════════════╣
║   Server running on: http://localhost:${PORT}          ║
║   📍 Location dashboard: /azure-dashboard             ║
║   💾 Data stored in memory (simple & fast)           ║
╚═══════════════════════════════════════════════════════╝
    `);
});

module.exports = app;