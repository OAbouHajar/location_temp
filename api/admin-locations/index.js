module.exports = async function (context, req) {
    context.log('📊 Admin locations request received');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
        return;
    }

    try {
        const sessions = context.bindings.inputDocuments || [];
        
        // Filter sessions that have GPS location data
        const locationsData = sessions
            .filter(session => session.gps && !session.gps.error && session.gps.latitude)
            .map(session => ({
                sessionId: session.sessionId,
                timestamp: session.serverTimestamp,
                location: {
                    latitude: session.gps.latitude,
                    longitude: session.gps.longitude,
                    accuracy: session.gps.accuracy,
                    source: session.locationSource || 'gps'
                },
                client: {
                    ip: session.clientIP,
                    userAgent: session.headers?.userAgent,
                    platform: session.device?.platform
                }
            }));

        // Calculate some basic stats
        const stats = {
            totalSessions: sessions.length,
            sessionsWithGPS: locationsData.length,
            gpsSuccessRate: sessions.length > 0 ? ((locationsData.length / sessions.length) * 100).toFixed(1) : 0,
            lastCollected: locationsData.length > 0 ? locationsData[0].timestamp : null
        };

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: true,
                stats: stats,
                locations: locationsData,
                total: locationsData.length
            }
        };

        context.log(`📍 Returned ${locationsData.length} GPS locations out of ${sessions.length} total sessions`);
    } catch (error) {
        context.log.error('❌ Error retrieving location data:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: false,
                error: 'Failed to retrieve location data'
            }
        };
    }
};