const http = require('http');
const socketIo = require('socket.io');

let io;

function onScansUpdated(server, topScans) {
    if (!io) {
        io = socketIo(server);

        io.on('connection', socket => {
            console.log('Client connected');
            socket.on('buttonClicked', async () => {
                const topScans = await Scans.findAll({
                    where: {
                        percentageDifference: {
                            [Op.gt]: 0 // filters out records with negative percentageDifference
                        }
                    },
                    order: [['percentageDifference', 'DESC']], // sorts by percentageDifference from highest to lowest
                    limit: 5 // gets the first 5 records
                });
                console.log('Top scans updated:');
                const data = JSON.stringify(topScans);
                console.dir(JSON.parse(data), { depth: null, colors: true }); 
                socket.emit('message', data);
            });

            const data = JSON.stringify(topScans);
            console.dir(JSON.parse(data), { depth: null, colors: true }); 
            socket.emit('message', data);

            socket.on('message', message => {
                console.log('received: %s', message);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });

            socket.on('error', error => {
                console.error('Socket error:', error); 
            });
        });

        io.on('error', error => {
            console.error('Server error:', error); 
        });

        process.on('SIGINT', () => {
            console.log("Caught interrupt signal, closing sockets");

            io.sockets.sockets.forEach(socket => {
                try {
                    socket.disconnect();
                } catch (error) {
                    console.error('Failed to disconnect socket:', error);
                }
            });

            process.exit();
        });
    }

    const data = JSON.stringify(topScans);
    console.dir(JSON.parse(data), { depth: null, colors: true }); 

    io.sockets.sockets.forEach(socket => {
        try {
            socket.emit('message', data);
        } catch (error) {
            console.error('Failed to send message to client:', error);
        }
    });
}

module.exports = onScansUpdated;