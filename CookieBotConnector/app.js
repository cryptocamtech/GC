const {
    Command
} = require('commander');
const program = new Command();
const platformClient = require('purecloud-platform-client-v2');
const traceModule = require('./common/utils/trace')
const pjson = require('./package.json');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const localtunnel = require('localtunnel');
const trace = new traceModule.Trace();

let conversationsApi = new platformClient.ConversationsApi();

let runMode="Development";
let config = {};
var botSessions = [];

// Initialize express and define a port

// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json());

/************************************
 * getBotSession()
 * 
 * Store bot sessions in an array
 * until all slots are filled
 ************************************/
function getBotSession(botContext) {

    // Find existing bot session
    var existingSession = botSessions.find(session => session.botSessionId === botContext.botSessionId);

    if ( existingSession === undefined ) {
        // Create a new bot session if one was not found
        trace.log.info("Creating new bot session for: " + botContext.botSessionId);

        var newSession = {
            botSessionId: botContext.botSessionId,
            conversationId: botContext.conversationId,
            intent: "OrderCookie",
            currentSlot: 0,
            slots: [
                {
                    name: "CookieType",
                    value: "",
                    question: "What type of cookie would you like to order?"
                },
                {
                    name: "NumOfCookies",
                    value: 0,
                    question: "How many cookies would you like to order?"
                }
            ]
        }

        // See if an APIKey parameter was passed in
        if (botContext.parameters.APIKey !== undefined) {
            trace.log.debug("Parameter APIKey value is " + botContext.parameters.APIKey);
        }

        // See if the GetGenesysConversation parameter exists and if we should call that API
        if (botContext.parameters.GetGenesysConversation !== undefined &&
             botContext.parameters.GetGenesysConversation.toLowerCase() === "true") {
            // Get Genesys Conversation from Platform API
            conversationsApi.getConversation(botContext.genesysConversationId)
            .then((data) => {
                trace.log.debug(`getConversation success! data: ${JSON.stringify(data, null, 2)}`);
            })
            .catch((err) => {
                trace.log.error('There was a failure calling getConversation');
                trace.log.error(err);
            });
        }

        botSessions.push(newSession);
        existingSession = newSession;
    } else {
        trace.log.debug("Using existing bot session for: " + botContext.botSessionId);
    }

    return existingSession;
}

app.post("/postUtterance", (req, res) => {
    // Do a little logging up front to see what we received
    trace.log.debug("Request Received for postUtterance:");
    trace.log.debug(JSON.stringify(req.headers))
    trace.log.debug(JSON.stringify(req.body));

    // verify message secret
    const signature = req.headers['mycustomheader'];
    const secretToken = '123-456';

    //if (signature === secretToken) {

        // Get the bot session to use for this conversation
        var botContext = req.body;
        var botSession = getBotSession(botContext);
        trace.log.debug("botSession: " + JSON.stringify(botSession) + "\n");

        // If this is a /postUtterance callback from a MOREDATA slot response
        // then store the slot value that Genesys gave us
        if (botSession.currentSlot > 0) {
            trace.log.debug("Saving value [" + botContext.inputMessage.text + "] to slot " + (botSession.currentSlot) + "\n");
            botSession.slots[botSession.currentSlot - 1 ].value = botContext.inputMessage.text;
        }

        // Format our reply based on the next slot to be filled, if any
        var postUtteranceReply = {
            "replymessages":
            [
                {
                    "type":"Text",
                    "text": (botSession.currentSlot < botSession.slots.length) ? botSession.slots[botSession.currentSlot].question : ""
                }
            ],
            "intent" : botSession.intent, 
            "confidence" : 0.9, 
            "botState": (botSession.currentSlot < botSession.slots.length) ? "MOREDATA" : "COMPLETE", 
            "slotValues": {
                "CookieType" : botSession.slots[0].value,
                "NumOfCookies" : botSession.slots[1].value
            },
            "parameters" : {
                "OutputParam1": botSession.currentSlot.toString()
            }
        };

        trace.log.debug("Replying to postUtterance: " + JSON.stringify(postUtteranceReply) + "\n");
        res.write(JSON.stringify(postUtteranceReply));
        res.status(200).end()

        // Increment for the next slot
        botSession.currentSlot++;

        // If all slots have been filled then we are done
        // so cleanup the session from the botSessions array
        if ( botSession.currentSlot > botSession.slots.length ) {
            trace.log.debug("Deleting bot session: " + botSession.botSessionId);
            var removeIndex = botSessions.findIndex(session => session.botSessionId === botSession.botSessionId);
            if ( removeIndex >= 0 ) {
                trace.log.debug("Removing botSession object at index " + removeIndex);
                botSessions.splice(removeIndex, 1);
            }
        }

    /*} else {
        res.status(400).end()
    }*/
});

/**
 * Load up config
 * @param {*} options 
 */
 function reload(options) {
    const conf = require('./config');

    config = {
        ...conf.loggerConfig,
        ...conf.genesysCloudConfig.general,
        ...conf.genesysCloudConfig.dev
    }

    // load the configuration based on mode (defaults to dev)
    if (options.Qa) {
        runMode="QA"
        config = {
            ...conf.loggerConfig,
            ...conf.genesysCloudConfig.general,
            ...conf.genesysCloudConfig.qa
        }
    }

    if (options.Prod) {
        runMode="Production"
        config = {
            ...conf.loggerConfig,
            ...conf.genesysCloudConfig.general,
            ...conf.genesysCloudConfig.prod
        }
    }
}

const runProgram = async () => {

    // process command line arguments
    program
        .option('-dev', 'runs in development mode (default)')
        .option('-qa', 'runs in QA test mode')
        .option('-prod', 'runs in production mode');

    program.parse(process.argv);
    const options = program.opts(); 
    reload(options);

    // initialize the logging subsystem
    trace.label(path.parse(__filename).name);

    trace.log.info('**********************************************************************************');
    trace.log.info(`Starting application: ${pjson.name}, Version: ${pjson.version}, PID: ${process.pid}`)
    trace.log.info(`Node Version: ${process.version}`)
    trace.log.info(`Configuration run mode: ${runMode}`)

    // get the client-credentials GCloud token for the configured reqion
    if (!config.env) {
        trace.log.error(`No region configured for the selected configuration stage`);
        return;
    }

    if (!config.clientId || !config.secret) {
        trace.log.error(`No client or secret configured for the selected configuration stage`);
        return;
    }

    trace.log.info('**********************************************************************************');
    trace.log.debug(`Retrieving the GC token...`)
    platformClient.ApiClient.instance.setEnvironment(config.env);
    try {

        const tokenResponse = await platformClient.ApiClient.instance.loginClientCredentialsGrant(config.clientId, config.secret)
        if (!tokenResponse || !tokenResponse.accessToken) {
            const message = `Unable to obtain Genesys Cloud Client-Credentials OAuth token for Client Id: ${config.cientId}`
            trace.log.error(message)
            return
        }

        // set the purecloud token for the customer/region
        trace.log.debug(`GC token: ${tokenResponse.accessToken}`)
        platformClient.ApiClient.instance.setAccessToken(tokenResponse.accessToken);
    }
    catch (error) {
        if (error.message)
            error = error.message;
        const message = `app: An error occurred: ${error}`;
        trace.log.error(message);
        return;
    }

    // set up our server to take external requests
    app.use(cors());
    app.use(express.json());

    app.listen(config.port, () => {
        trace.log.info(`Server running on port ${config.port}, ${config.subDomain}`);

        (async () => {
            const tunnel = await localtunnel({ 
                port: config.port, 
                subdomain: config.subDomain
            });

            // the assigned public url for your tunnel
            // i.e. https://abcdefgjhij.localtunnel.me
            trace.log.info(`Server listening on external URL ${tunnel.url}`);

            tunnel.on('close', () => {
                // tunnels are closed
            });
        })();
    });
}

// bootstrap the operation
runProgram();