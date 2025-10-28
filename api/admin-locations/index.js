module.exports = async function (context, req) {
    context.log('📊 Simple admin locations request');

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
        // For now, return sample data to test the dashboard
        // In a real scenario, you'd want to use a proper storage solution
        const sampleLocations = [
            {
                sessionId: 'sample_session_1',
                timestamp: new Date().toISOString(),
                location: {
                    latitude: 53.3498,
                    longitude: -6.2603,
                    accuracy: 10,
                    source: 'gps'
                },
                client: {
                    ip: '192.168.1.1',
                    userAgent: 'Mozilla/5.0...',
                    platform: 'MacIntel'
                }
            },
            {
                sessionId: 'sample_session_2',
                timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                location: {
                    latitude: 51.5074,
                    longitude: -0.1278,
                    accuracy: 15,
                    source: 'gps'
                },
                client: {
                    ip: '192.168.1.2',
                    userAgent: 'Mozilla/5.0...',
                    platform: 'Win32'
                }
            }
        ];

        const stats = {
            totalSessions: 2,
            sessionsWithGPS: 2,
            gpsSuccessRate: 100,
            lastCollected: new Date().toISOString()
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
                locations: sampleLocations,
                total: sampleLocations.length,
                message: 'This is sample data. Real data will be stored when you set up proper storage.'
            }
        };

        context.log(`📍 Returned sample location data for testing`);
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