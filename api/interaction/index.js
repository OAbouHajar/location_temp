module.exports = async function (context, req) {
    context.log('Interaction tracking request received');

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
        const interactionData = req.body;
        
        // Create document with unique ID
        const document = {
            id: `${interactionData.sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...interactionData,
            serverTimestamp: new Date().toISOString()
        };

        // Save to Cosmos DB
        context.bindings.outputDocument = document;

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: true
            }
        };

        context.log('Interaction saved:', interactionData.type);
    } catch (error) {
        context.log.error('Error tracking interaction:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                success: false,
                error: 'Failed to track interaction'
            }
        };
    }
};
