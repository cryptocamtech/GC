
genesysCloudConfig = {
	dev: {
		env: "mypurecloud.com.au",
		clientId: "dd8b27dc-8fac-47e7-bd10-392b594cbb80",
		secret: "qQMo0KVwZouPC3nWU66tAcW0Sts-t36kwiMfEpOkro8",
        botConnectorIntegrationId: 'b4f82130-eed4-43d2-b807-b6c0ddc59f0d',
        subDomain: 'camster-bot',
		port: 3030
	},
	qa: {
		env: "mypurecloud.com",
		clientId: "",
		secret: "",
        botConnectorIntegrationId: '',
        subDomain: '',
		port: 3030
	},
	prod: {
		env: "mypurecloud.com.au",
		clientId: "",
		secret: "",
        botConnectorIntegrationId: '',
        subDomain: '',
		port: 3030
	},
	general: {
	}
},
loggerConfig = {
	pathName: "/var/log/ChatBotExample",
	fileName: "script.log",
	maxLogFiles: 30,
	maxFileSize: "20m",
	logFormat: "text",
	fileLogLevel: "debug",
	consoleLogLevel: "debug"
}

module.exports = {
    genesysCloudConfig,
    loggerConfig
}