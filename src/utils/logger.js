// Production Logging Module for Cherry Bot Ultimate

const COLORS = {
    reset: '\x1b[0m',
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m',    // Yellow
    error: '\x1b[31m',   // Red
    debug: '\x1b[35m'    // Magenta
};

function getTimestamp() {
    return new Date().toISOString();
}

const logger = {
    info(msg, meta = '') {
        console.log(`${COLORS.info}[${getTimestamp()}] [INFO] ${msg}${COLORS.reset}`, meta);
    },
    success(msg, meta = '') {
        console.log(`${COLORS.success}[${getTimestamp()}] [SUCCESS] ${msg}${COLORS.reset}`, meta);
    },
    warn(msg, meta = '') {
        console.warn(`${COLORS.warn}[${getTimestamp()}] [WARN] ${msg}${COLORS.reset}`, meta);
    },
    error(msg, err = '') {
        console.error(`${COLORS.error}[${getTimestamp()}] [ERROR] ${msg}${COLORS.reset}`, err);
    },
    debug(msg, meta = '') {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`${COLORS.debug}[${getTimestamp()}] [DEBUG] ${msg}${COLORS.reset}`, meta);
        }
    }
};

module.exports = logger;
