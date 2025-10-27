module.exports = async function (context, req) {
    context.log('🌍 Location data collection request received');

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

        // Add server-side metadata
        const enrichedData = {
            ...sessionData,
            id: sessionData.sessionId, // Cosmos DB needs 'id' field
            clientIP: clientIP,
            serverTimestamp: new Date().toISOString(),
            headers: {
                userAgent: req.headers['user-agent'],
                acceptLanguage: req.headers['accept-language'],
                referer: req.headers['referer'] || 'direct',
                origin: req.headers['origin'],
                forwarded: req.headers['x-forwarded-for']
            },
            // Enhanced location tracking metadata
            locationMetadata: {
                hasGPS: sessionData.gps && !sessionData.gps.error,
                hasIPGeolocation: sessionData.ipGeolocation && sessionData.ipGeolocation.status === 'success',
                locationSource: sessionData.locationSource || 'unknown',
                gpsAccuracy: sessionData.gps && sessionData.gps.accuracy ? sessionData.gps.accuracy : null,
                collectionTimestamp: new Date().toISOString()
            }
        };

        // Save to Cosmos DB
        context.bindings.outputDocument = enrichedData;

        // Log location info
        if (sessionData.gps && !sessionData.gps.error) {
            context.log(`📍 GPS Location: ${sessionData.gps.latitude}, ${sessionData.gps.longitude} (±${sessionData.gps.accuracy}m)`);
        } else {
            context.log(`⚠️ GPS not available: ${sessionData.gps?.error || 'Unknown error'}`);
        }

        if (sessionData.ipGeolocation && sessionData.ipGeolocation.status === 'success') {
            context.log(`🌐 IP Location: ${sessionData.ipGeolocation.city}, ${sessionData.ipGeolocation.country}`);
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
                locationStatus: {
                    hasGPS: enrichedData.locationMetadata.hasGPS,
                    hasIPLocation: enrichedData.locationMetadata.hasIPGeolocation,
                    source: enrichedData.locationMetadata.locationSource
                }
            }
        };

        context.log(`✅ Session data saved to Cosmos DB: ${sessionData.sessionId}`);
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
                error: 'Failed to collect location data',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            }
        };
    }
};
