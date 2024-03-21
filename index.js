const db = require("./config/Database.js");
require('./config/Dbsync.js');
const express = require('express');
const path = require("path");
const app = express();
const server = require('http').createServer(app); // Create server with Express app
const cron = require('node-cron');
const populateTables = require('./jobs/PopulateTables.js');
const cors = require('cors');
const io = require('socket.io')(server,{ // Pass server to Socket.IO
    cors: {
        origin: "*",
    }
});
const dotenv = require("dotenv");
const router = require("./routes/index.js");

dotenv.config();
const PORT =process.env.PORT || 3042;
const { fileURLToPath } = require('url');
const { getAccountsByUserid } = require('./controllers/Users.js')
const {init, getAccountInfo, getAgentInfo, getAccountIdsByPageNum } = require('./controllers/MTAPI.js'); 
const generatePdfCronJob = require('./jobs/generatePDF.js');

try {
    db.authenticate();
} catch (error) {
    console.error(error);
}

(async () => {
    await populateTables();
})();

app.use(express.json());
app.use('/api', router);
app.use('/pdfs', express.static(path.join(__dirname, '..', 'pdfs')));
generatePdfCronJob();

require('./services/StreamPrices.js')(io);


// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../FrontendDualnet/build')))

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../FrontendDualnet/build', 'index.html'));
});

cron.schedule('0 * * * *', populateTables);
server.listen(PORT, ()=> console.log(`Server running at port ${PORT}`)); // Start server 




// //realtime send data via socket.io
// io.on('connect', (client) => {
// 	let myInterval1;
//     let myInterval2;
//     let isloading1 = 0;
//     let isloading2 = 0;

//     client.on('oneInfo', async(userid, currency='') => {

//         clearInterval(myInterval1);

//         let accInfo = await getAccountsByUserid(userid);
//         myInterval1 = setInterval(async() => {
//             if(isloading1 == 0){
//                 isloading1 = 1;
//                 const arr_info = await getAccountInfo(accInfo, currency);
                
//                 isloading1 = 0;
//                 if(arr_info.length > 0) {
//                     client.emit('update-information', JSON.stringify(arr_info));
//                 }
//             }
//         }, 1500);
//     });

//     client.on('allInfo', async(page, currency='') => {
        
//         clearInterval(myInterval2);

//         let accs_obj = getAccountIdsByPageNum(page);
//         myInterval2 = setInterval(async() => {
//             if(isloading2 == 0){
//                 isloading2 = 1;
//                 const agent_info = await getAgentInfo(accs_obj);
//                 isloading2 = 0;
//                 client.emit('update-users-information', JSON.stringify(agent_info));
//             }
//         }, 1500);
//     });

//     client.on('disconnect', () => {
//         clearInterval(myInterval1);
//         clearInterval(myInterval2);
//     });
// });
