const logger = require('./logger.js');

function registerErrorHandlers() {
    process.on('uncaughtException', (err) => {
        logger.error('💥 Uncaught Exception Intercepted:', err.stack || err.message || err);
    });

    process.on('unhandledRejection', (reason, promise) => {
        logger.error('⚠️ Unhandled Promise Rejection at:', promise);
        logger.error('Reason:', reason.stack || reason);
    });

    process.on('warning', (warning) => {
        logger.warn(`⚠️ Process Warning (${warning.name}):`, warning.message);
    });

    logger.success('🛡️ Global Production Error Handlers Online!');
}

module.exports = { registerErrorHandlers };
