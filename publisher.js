var appd = require('appdynamics');

appd.profile({
    controllerHostName: 'XXX',
    controllerPort: 8044,
    controllerSslEnabled: false,
    accountName: 'customer1',
    accountAccessKey: 'XXX',
    applicationName: 'Node-Rabbit',
    tierName: 'nodejs-Publisher',
    debug: true,
    nodeName: "Node-Publisher"
    //      libagent: true
});

var amqp = require('amqplib/callback_api');

var channel = {};
var q = 'hello';
//var msg = 'Hello World!';

amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue(q, {
            durable: false
        });
        channel = ch;
    });
});

function SendMessage(msg, qHeaders) {
    channel.sendToQueue(q, new Buffer(JSON.stringify(msg)), qHeaders);
    console.log(" [x] Sent %s", JSON.stringify(msg));
}

var express = require('express');
var app = express();

app.get('/publish', function(req, res) {
    var txn = appd.getTransaction(req);
    var exitCall = null;
    var correlationHeader = null;

    if (txn) {
        exitCall = txn.startExitCall({
            exitType: "EXIT_RABBITMQ",
            label: "Rabbit Mqs",
            backendName: "RMQs",
            identifyingProperties: {
                "Host": "localhost",
                "Port": "5672",
            }
        });

        correlationHeader = txn.createCorrelationInfo(exitCall);

    } else {
        console.log("got config");
    }

    var message = {
        someKey: "Some Value",
    };

    qHeaders = {
        contentType: 'application/json',
        headers: {
            "singularityheader": correlationHeader,
        }
    }
    SendMessage(message, qHeaders);
    if (exitCall) {
        txn.endExitCall(exitCall);
    }
    res.send('Sent');
})

var server = app.listen(4444, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
})