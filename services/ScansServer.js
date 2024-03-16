const WebSocket = require('ws');

// Create a WebSocket server
const wss = new WebSocket.Server({ port: 3002 });

// This function will be called whenever scans are updated
function onScansUpdated(topScans) {
    // Convert the topScans object to a string
    const data = JSON.stringify(topScans);

    // Send the data to all connected clients
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Listen for connections
wss.on('connection', function connection(ws) {
    console.log('Client connected');

    // When a message is received from a client, log it to the console
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
});

// Export the onScansUpdated function so it can be used in other files
module.exports = onScansUpdated;