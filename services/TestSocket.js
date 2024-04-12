const io = require('socket.io-client');

// Connect to the server
const socket = io.connect('http://localhost:3042');

socket.on('connect', () => {
    console.log('Connected to the server');
    socket.emit('join', 18);
    // // Emit the 'updateScans' event every 30 seconds
    // setInterval(() => {
    //     console.log('Sending updateScans event to the server');
    //     socket.emit('updateScans');
    // }, 10000); // 30000 milliseconds = 30 seconds
});

// Listen for the 'topScans' event to receive the top scans from the server
socket.on('topScans', (data) => {
    console.log('Received topScans from the server:', data);
});

// Listen for the 'botData' event to receive the bot data from the server
socket.on('botData', (data) => {
    console.log('Received botData from the server:', data);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected from the server. Reason:', reason);
});

socket.on('error', (error) => {
    console.error('Received error from the server:', error);
});