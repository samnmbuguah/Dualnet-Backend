const cron = require('node-cron');
const populateTables = require('./jobs/PopulateTables.js');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require("path");
const cors = require('cors');
const io = require('socket.io')(http,{
                cors: {
                    origin: 'http://localhost:3000',
                }
            });
const dotenv = require("dotenv");
const db = require("./config/Database.js");
const router = require("./routes/index.js");

dotenv.config();
const PORT = process.env.PORT || 3001;
const { fileURLToPath } = require('url');
const { getAccountsByUserid } = require('./controllers/Users.js')
const {init, getAccountInfo, getAgentInfo, getAccountIdsByPageNum } = require('./controllers/MTAPI.js'); 
const generatePdfCronJob = require('./jobs/generatePDF.js');

try {
    db.authenticate();
} catch (error) {
    console.error(error);
}
require('./config/Dbsync.js');

// Have Node serve the files for our built React app
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.resolve(__dirname, '../Frontend/build')));  //production mode
app.use(cors({credentials: true, origin: 'http://localhost:3000'}));    //develope mode
app.use(express.json());
app.use('/api', router);
app.use('/pdfs', express.static(path.join(__dirname, '..', 'pdfs')));
generatePdfCronJob();
//realtime send data via socket.io
io.on('connect', (client) => {
	let myInterval1;
    let myInterval2;
    let isloading1 = 0;
    let isloading2 = 0;

    client.on('oneInfo', async(userid, currency='') => {

        clearInterval(myInterval1);

        let accInfo = await getAccountsByUserid(userid);
        myInterval1 = setInterval(async() => {
            if(isloading1 == 0){
                isloading1 = 1;
                const arr_info = await getAccountInfo(accInfo, currency);
                
                isloading1 = 0;
                if(arr_info.length > 0) {
                    client.emit('update-information', JSON.stringify(arr_info));
                }
            }
        }, 1500);
    });

    client.on('allInfo', async(page, currency='') => {
        
        clearInterval(myInterval2);

        let accs_obj = getAccountIdsByPageNum(page);
        myInterval2 = setInterval(async() => {
            if(isloading2 == 0){
                isloading2 = 1;
                const agent_info = await getAgentInfo(accs_obj);
                isloading2 = 0;
                client.emit('update-users-information', JSON.stringify(agent_info));
            }
        }, 1500);
    });

    client.on('disconnect', () => {
        clearInterval(myInterval1);
        clearInterval(myInterval2);
    });
});


(async () => {
    await populateTables();

})();
require('./services/StreamPrices.js');


cron.schedule('0 * * * *', populateTables);

// All other GET requests not handled before will return our React app
// app.get('*', (req, res) => {                                                     //production mode                    
//     res.sendFile(path.resolve(__dirname, '../Frontend/build', 'index.html'));    //production mode            
// });                                                                              //production mode

http.listen(PORT, ()=> console.log(`Server running at port ${PORT}`));
