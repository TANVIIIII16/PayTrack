const config = require('../config');

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = config.nodeEnv === 'production' ? logLevels.INFO : logLevels.DEBUG;

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  };

  return JSON.stringify(logEntry);
};

const logger = {
  error: (message, meta = {}) => {
    if (currentLevel >= logLevels.ERROR) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },

  warn: (message, meta = {}) => {
    if (currentLevel >= logLevels.WARN) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },

  info: (message, meta = {}) => {
    if (currentLevel >= logLevels.INFO) {
      console.info(formatMessage('INFO', message, meta));
    }
  },

  debug: (message, meta = {}) => {
    if (currentLevel >= logLevels.DEBUG) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  }
};

module.exports = logger;
