const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    console.log('\n=== INCOMING REQUEST ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.originalUrl);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Headers:', {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'authorization': req.headers['authorization'] ? 'Bearer [hidden]' : 'none'
    });

    // Lưu hàm end gốc
    const originalEnd = res.end;
    
    // Override hàm end để log response
    res.end = function (chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        console.log('\n=== OUTGOING RESPONSE ===');
        console.log('Time:', new Date().toISOString());
        console.log('Duration:', responseTime + 'ms');
        console.log('Status:', res.statusCode);
        console.log('Headers:', res.getHeaders());
        
        if (chunk) {
            let body;
            try {
                body = JSON.parse(chunk.toString());
            } catch (e) {
                body = chunk.toString();
            }
            console.log('Body:', body);
        }
        
        console.log('=== END RESPONSE ===\n');
        
        // Gọi hàm end gốc
        originalEnd.apply(res, arguments);
    };

    next();
};

const errorLogger = (err, req, res, next) => {
    console.error('\n=== ERROR OCCURRED ===');
    console.error('Time:', new Date().toISOString());
    console.error('Method:', req.method);
    console.error('URL:', req.originalUrl);
    console.error('Error:', {
        name: err.name,
        message: err.message,
        code: err.code,
        stack: err.stack
    });
    console.error('=== END ERROR ===\n');
    
    next(err);
};

module.exports = {
    requestLogger,
    errorLogger
}; 