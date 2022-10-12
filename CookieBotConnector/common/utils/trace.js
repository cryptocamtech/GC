// #region Require Statements
// Node Packages
const fs = require('fs'); // Supports filesystem actions
const path = require('path');
const moment = require('moment');
const winston = require('winston'); // For advanced logging options and log to file
// Solution Files
let loggerConfig = require('../../config').loggerConfig

// #endregion Require Statements

// region Module Constants
const traceLabelModule = path.parse(__filename).name;
const fileSizeSuffixMap = {
    k: 1024,
    m: 1024000,
    g: 1024000000,
};
const logFileSizeSuffix = loggerConfig.maxFileSize ? loggerConfig.maxFileSize.slice(-1): 'm';
const maxLogFileSize = loggerConfig.maxFileSize ? (loggerConfig.maxFileSize.slice(0, -1) * fileSizeSuffixMap[logFileSizeSuffix]):(20 * fileSizeSuffixMap[logFileSizeSuffix]);
const logPathName = loggerConfig.pathName ? loggerConfig.pathName: 'c:/Logs/MineSuper';
const logFileName = loggerConfig.fileName ? `${logPathName}/${loggerConfig.fileName}`: `${logPathName}/MineSuper.log`;
const tsFormat = () => moment().format('YYYY-MM-DD HH:mm:ss.SSS z');
// endregion Module Constants

const logger = new winston.createLogger({
    transports: [
        new winston.transports.Console({
            level:loggerConfig.consoleLogLevel ? loggerConfig.consoleLogLevel : 'info',
            timestamp: tsFormat,
            colorize: true,
        }),
        new winston.transports.File({
            filename: logFileName,
            level: loggerConfig.fileLogLevel? loggerConfig.fileLogLevel: 'info',
            maxsize: maxLogFileSize,
            maxFiles: loggerConfig.maxLogFiles ? loggerConfig.maxLogFiles: 10,
            tailable: true,
            timestamp: tsFormat,
        }),
    ],
});

if (loggerConfig.logFormat === 'text') {
    logger.format = winston.format.combine(
        winston.format.timestamp({
            format: tsFormat
        }),
        winston.format.printf((info) => {
            return `${info.timestamp} ${info.level} [${info.label}] ${info.message}`
        })
    );
}

class Trace {
    constructor() {
        try {
            let _label = 'default';
            const logMessage = (level, message, variables) => {
                let finalMessage = message;
                if (Array.isArray(variables)) {
                    variables.forEach(variable => {
                        let finalVariable = variable;
                        if (typeof variable === 'object') {
                            finalVariable = JSON.stringify(variable, null, 2);
                        }
                        finalMessage += ` ${finalVariable}`;
                    });
                }
                logger[level](finalMessage, { label: _label });
            };
            this.label = (label) => {
                try {
                    if (label) {
                        _label = label;
                    }
                    return _label;
                } catch (error) {
                    console.error(`Error encountered processing trace label. Error message: ${error.stack}`);
                    return undefined;
                }
            };
            this.log = {
                error: (message, ...variables) => { logMessage('error', message, variables); },
                warn: (message, ...variables) => { logMessage('warn', message, variables); },
                info: (message, ...variables) => { logMessage('info', message, variables); },
                verbose: (message, ...variables) => { logMessage('verbose', message, variables); },
                debug: (message, ...variables) => { logMessage('debug', message, variables); },
                silly: (message, ...variables) => { logMessage('silly', message, variables); },
            };
        } catch (error) {
            console.error(`Error encountered instantiating Trace class. Error message: ${error.stack}`);
        }
    }
}

const reloadConfigFile = () => {
    const trace = new Trace();
    trace.label(`${traceLabelModule}.reloadConfigFile`);
    const configFile = '../../config.js'; 
    try {
        trace.log.info(`Reloading config file '${configFile}'`);
        delete require.cache[require.resolve(configFile)];
        config = require(configFile); // eslint-disable-line global-require,import/no-dynamic-require,max-len
        loggerConfig = config.loggerConfig
        logger.transports.forEach(transport => {
            if(transport.name === 'console'){
                transport.level = loggerConfig.consoleLogLevel;    
            } else if (transport.name === 'file'){
                transport.level = loggerConfig.fileLogLevel;    
            }
        });
    } catch (error) {
        trace.log.error(`Error encountered reloading settings file '${settingsFile}. Error message: ${error}`);
    }
};

module.exports = {
    Trace
};