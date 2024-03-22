const WebSocket = require('ws');

let wss;

function onScansUpdated(server, topScans) {
    if (!wss) {
        wss = new WebSocket.Server({ server }, () => {
            console.log('ScansServer is listening on the same port as the HTTP server');
        });

        wss.on('connection', ws => {
            console.log('Client connected');

            // Send topScans to the client right after connection
            const data = JSON.stringify(topScans);
            ws.send(data, error => {
                if (error) {
                    console.error('Failed to send message to client:', error);
                }
            });

            ws.on('message', message => {
                console.log('received: %s', message);
                ws.send(message); // Echo back the message
            });

            ws.on('error', error => {
                console.error('Error from client:', error);
            });

            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });

        process.on('SIGINT', () => {
            console.log("Caught interrupt signal, closing websockets");

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    try {
                        client.close();
                    } catch (error) {
                        console.error('Failed to close client:', error);
                    }
                }
            });

            process.exit();
        });
    }

    const data = JSON.stringify(topScans);

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(data);
            } catch (error) {
                console.error('Failed to send message to client:', error);
            }
        }
    });
}

module.exports = onScansUpdated;