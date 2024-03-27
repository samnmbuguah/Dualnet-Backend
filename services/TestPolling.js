const http = require('http');
const StreamPrices = require('./StreamPrices');
const io = require('socket.io-client');

let chai;
let expect;

describe('StreamPrices', function() {
    this.timeout(5000); // Set timeout to 5 seconds for all hooks and tests in this suite

    let server;
    let clientSocket;

    before(async () => {
        chai = await import('chai');
        expect = chai.expect;
    });

    beforeEach((done) => {
        // Setup
        server = http.createServer().listen(3042);
        StreamPrices(server);
        clientSocket = io.connect('http://localhost:3042');
        clientSocket.on('connect', done);
    });

    afterEach((done) => {
        // Cleanup
        if(clientSocket.connected) {
            clientSocket.disconnect();
        }
        server.close(done);
    });


    it('should emit topScans', (done) => {
        clientSocket.on('topScans', (topScans) => {
            expect(topScans).to.be.an('array');
            done();
        });
    });

    it('should update scans on updateScans event', (done) => {
        clientSocket.on('topScans', (topScans) => {
            expect(topScans).to.be.an('array');
            done();
        });

        clientSocket.emit('updateScans');
    });
});