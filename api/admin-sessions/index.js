module.exports = async function (context, req) {
    context.log('Admin sessions request received');

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
        const sessions = context.bindings.sessions || [];

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                total: sessions.length,
                sessions: sessions
            }
        };

        context.log(`Returned ${sessions.length} sessions`);
    } catch (error) {
        context.log.error('Error fetching sessions:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                error: 'Failed to fetch sessions'
            }
        };
    }
};
