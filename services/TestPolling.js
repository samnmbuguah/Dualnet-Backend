const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3042');

ws.on('open', function open() {
    console.log('connected');
    ws.send(Date.now().toString()); // send the current timestamp to the server
});

ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('message', function incoming(data) {
    const roundTripTime = Date.now() - parseInt(data);
    console.log(`Round-trip time: ${roundTripTime} ms`);
});