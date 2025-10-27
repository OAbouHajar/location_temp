module.exports = async function (context, req) {
    context.log('Data collection request received');

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
        
        // Add server-side metadata
        const enrichedData = {
            ...sessionData,
            id: sessionData.sessionId, // Cosmos DB needs 'id' field
            clientIP: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
            serverTimestamp: new Date().toISOString(),
            headers: {
                userAgent: req.headers['user-agent'],
                acceptLanguage: req.headers['accept-language'],
                referer: req.headers['referer'] || 'direct',
                origin: req.headers['origin']
            }
        };

        // Save to Cosmos DB
        context.bindings.outputDocument = enrichedData;

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: true,
                message: 'Data collected successfully',
                sessionId: sessionData.sessionId
            }
        };

        context.log('Session data saved:', sessionData.sessionId);
    } catch (error) {
        context.log.error('Error collecting data:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: false,
                error: 'Failed to collect data'
            }
        };
    }
};
