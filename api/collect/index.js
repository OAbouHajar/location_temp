const fs = require('fs').promises;
const path = require('path');

module.exports = async function (context, req) {
    context.log('🌍 Simple location data collection');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
        return;
    }

    try {
        const sessionData = req.body;
        
        // Get client IP from various headers
        const clientIP = req.headers['x-forwarded-for'] || 
                         req.headers['x-real-ip'] || 
                         req.headers['x-client-ip'] || 
                         'unknown';

        // Create simple data structure
        const simpleData = {
            sessionId: sessionData.sessionId,
            timestamp: new Date().toISOString(),
            clientIP: clientIP,
            // Location data
            location: {
                hasGPS: sessionData.gps && !sessionData.gps.error,
                latitude: sessionData.gps && sessionData.gps.latitude ? sessionData.gps.latitude : null,
                longitude: sessionData.gps && sessionData.gps.longitude ? sessionData.gps.longitude : null,
                accuracy: sessionData.gps && sessionData.gps.accuracy ? sessionData.gps.accuracy : null,
                source: sessionData.locationSource || 'unknown'
            },
            // Device info
            device: {
                userAgent: req.headers['user-agent'],
                platform: sessionData.device?.platform,
                screenWidth: sessionData.screen?.screenWidth,
                screenHeight: sessionData.screen?.screenHeight,
                language: sessionData.device?.language
            }
        };

        // Store in a simple way - just log for now since Azure Functions have limited file write access
        context.log(`📍 Location Data Collected:`, JSON.stringify(simpleData, null, 2));

        // Log location info for easy tracking
        if (simpleData.location.hasGPS) {
            context.log(`📍 GPS: ${simpleData.location.latitude}, ${simpleData.location.longitude} (±${simpleData.location.accuracy}m)`);
        } else {
            context.log(`⚠️ No GPS data available`);
        }

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: true,
                message: 'Location data collected successfully',
                sessionId: sessionData.sessionId,
                location: simpleData.location,
                timestamp: simpleData.timestamp
            }
        };

        context.log(`✅ Session processed: ${sessionData.sessionId}`);
    } catch (error) {
        context.log.error('❌ Error collecting location data:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: false,
                error: 'Failed to collect location data'
            }
        };
    }
};
