module.exports = async function (context, req) {
    context.log('Admin interactions request received');

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
        const interactions = context.bindings.interactions || [];

        context.res = {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                total: interactions.length,
                interactions: interactions
            }
        };

        context.log(`Returned ${interactions.length} interactions`);
    } catch (error) {
        context.log.error('Error fetching interactions:', error);
        
        context.res = {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: {
                error: 'Failed to fetch interactions'
            }
        };
    }
};
