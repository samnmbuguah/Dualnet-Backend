const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3002'); 

ws.on('open', function open() {
    console.log('connected');
    ws.send(Date.now());
});

ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('message', function incoming(data) {
    try {
        const topScans = JSON.parse(data);
        console.log(topScans);
    } catch (error) {
        console.error('Error parsing data:', error);
    }
});