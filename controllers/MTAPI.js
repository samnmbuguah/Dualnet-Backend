// const fs = require('fs');
// const path = require('path');
// const MetaApi = require('metaapi.cloud-sdk').default;
// const { getAllAccountIds, getAccountsByUserid } = require('./Users');

// let accountConnections = {};
// let connections = {};
// let isdeploying = 0;

// exports.init = async(type, accountIds, api_token='') =>{
//     if(type === 'all') {
//         console.log('init-all-------------');

//         let allIds = await getAllAccountIds();
//         let create_connection = [];
//         for(let i = 0; i < allIds.length; i++){
//             let arrIds = allIds[i];
//             if(!create_connection.includes(arrIds.reward) && (arrIds.reward !== '' || arrIds.reward !== null)){
//                 create_connection.push(arrIds.reward);
//                 await getSynObj(arrIds.reward, arrIds.api_token);
//             }
//             if(!create_connection.includes(arrIds.hedge) && (arrIds.hedge !== '' || arrIds.hedge !== null)){
//                 create_connection.push(arrIds.hedge);
//                 await getSynObj(arrIds.hedge, arrIds.api_token);
//             }
//         }
//     }else if(type === 'one' && api_token != ''){
//         if(isdeploying)
//             return;
//         if(accountIds[0] !== '' && accountIds[0] !== null && accountIds[0].length==36){
//             isdeploying = 1;
//             await getSynObj(accountIds[0], api_token);
//             isdeploying = 0;
//         }
//         if(accountIds[1] !== '' && accountIds[1] !== null && accountIds[1].length==36){
//             isdeploying = 1;
//             await getSynObj(accountIds[1], api_token);
//             isdeploying = 0;
//         }
//     }
// }

// const getSynObj = async(accountId, token) => {

//     const api = new MetaApi(token);
//     try {
//         const account = await api.metatraderAccountApi.getAccount(accountId);
//         const initialState = account.state;
//         const deployedStates = ['DEPLOYING', 'DEPLOYED'];

//         if(!deployedStates.includes(initialState)) {
//             // wait until account is deployed and connected to broker
//             console.log('Deploying account');
//             await account.deploy();
//         }
//         await account.waitConnected();
//         // connect to MetaApi API
//         let connection = account.getStreamingConnection();
//         await connection.connect();
//         await connection.waitSynchronized();
        
//         accountConnections[accountId] = connection.terminalState;
//         connections[accountId] = connection;
//         console.log('connected:', accountConnections[accountId].connected);
//     } catch (error) {
//         console.log('getSynObj' + error);
//     }
// }

// //get client account information
// exports.getAccountInfo = async(accInfo, currency='') => {
//     let arrInfo = [null, null];
    
//     try{
//         if(!accountConnections[accInfo[0]] || !accountConnections[accInfo[1]]){
//             await this.init('one', accInfo, accInfo[2]);
//         }
//         if(accountConnections[accInfo[0]]){
//             arrInfo[0] = await accountConnections[accInfo[0]].accountInformation;
//             let orders = await accountConnections[accInfo[0]].positions;
//             arrInfo[0].sumlot = sum(orders, 'volume');
//             arrInfo[0].orders = [];
//             arrInfo[0].trades = orders.length;
//         }
//         if(accountConnections[accInfo[1]]){
//             arrInfo[1] = await accountConnections[accInfo[1]].accountInformation;
//             let orders = await accountConnections[accInfo[1]].positions;
//             arrInfo[1].sumlot = sum(orders, 'volume');
//             arrInfo[1].orders = [];
//             arrInfo[1].trades = orders.length;
//         }

//         return arrInfo;
//     }catch(e){
//         console.log(e);
//         return arrInfo;
//     }
    
// }



// exports.getAccountIdsByPageNum = async(page) =>{
//     let ids = {};
//     let allIds = await getAllAccountIds();
//     for (let i = 0; i < allIds.length; i++) {
//         let id = allIds[i].id;
//         ids[id] = [
//             allIds[i].reward,
//             allIds[i].hedge,
//             allIds[i].api_token,
//         ];
//     }
//     return ids;
// }

// exports.getAgentInfo = async(usersInfo, type = 0) => {
//     let arr_clientInfo = {};
//     await usersInfo.then(async(data)=>{
//         for (let k in data) {
//             // if (userids.hasOwnProperty(k)) {
//                 arr_clientInfo[k] = await this.getAccountInfo(data[k], '');
//             // }
//         }
//     });
//     return arr_clientInfo;
// }

// // get Currencies data
// exports.getCurrencyInfo = async(req, res) => {
//     try{
//         const {ac_id, currency} = req.query;
//         if(!accountConnections[ac_id])
//             return res.json(null);

//         var datetime = new Date();
//         console.log(datetime.toISOString().slice(0,10));
//         let filename = datetime.toISOString().slice(0,10) + '.json'
//         let dir = path.resolve(__dirname, '../currencydata', filename); 
//         console.log(dir);
//         let price = accountConnections[ac_id].price(currency);
//         await fs.exists(dir, async(exists)=> { 
//             if (exists) { 
//                 console.log('currency file existed--')
//                 const data = require( `../currencydata/${filename}`)
//                 let obj = data.find(x => x.symbol === currency)
//                 return res.json({info: obj, price: price});
//             }else{
//                 let currencyInfos = accountConnections[ac_id].specifications;
//                 if(currencyInfos != null) {
//                     saveToFile(dir, currencyInfos);
//                 }
//                 let info = accountConnections[ac_id].specification(currency);
//                 return res.json({info: info, price: price});
//             }
//         });
        
//     }catch(e){
//         console.log('metaapi/getCurrencyInfo', e);
//         return res.json(null);
//     }
// }

// exports.openOrders = async(obj) => {
//     console.log('openOrders =', obj)
//     try{
//         const d = new Date();
//         let day = d.getDay();
//         let time = d.getTime();
        
//         const {type, lotsize, currency, rewardID, hedgeID} = obj;
//         if(type == 'both'){
//             if(connections[rewardID] && connections[hedgeID]){
//                 const result1 =  connections[rewardID].createMarketSellOrder(currency, lotsize, 0, 0, {comment: `${time}`, clientId: `TE_${currency}_7h`});
//                 const result2 = await connections[hedgeID].createMarketBuyOrder(currency, lotsize, 0, 0, {comment: `${time}`, clientId: `TE_${currency}_7h`});
//                 await setTimeout(() => {
//                     console.log(result1, result2);
//                 }, 2000);
//                 if(result2.stringCode == 'ERR_MARKET_CLOSED' )
//                     return 0;
//                 return 1;
//             } else  {
//                 console.log('failed to open trade, updeployed account', obj);
//                 return 0;
//             }
//         }else if(type == 'reward'){
//             if(connections[rewardID]){
//                 const result1 =  await connections[rewardID].createMarketSellOrder(currency, lotsize, 0, 0, {comment: '1-26', clientId: `TE_${currency}_7hyINWqAlE`});
//                 console.log(result1);
//                 if(result1.stringCode == 'ERR_MARKET_CLOSED' )
//                     return 0;
//                 return 1;
//             } else  {
//                 console.log('failed to open trade, updeployed account', obj);
//                 return 0;
//             }
//         }else if(type == 'hedge'){
//             if(connections[hedgeID]){
//                 const result2 = await connections[hedgeID].createMarketSellOrder(currency, lotsize, 0, 0, {comment: '1-26', clientId: `TE_${currency}_7hyINWqAlE`});
//                 console.log(result2);
//                 if(result2.stringCode == 'ERR_MARKET_CLOSED' )
//                     return 0;
//                 return 1;
//             } else  {
//                 console.log('failed to open trade, updeployed account', obj);
//                 return 0;
//             }
//         }
//     }catch(e){
//         console.log(e);
//         return 0;
//     }
    
// }

// exports.closeOrders = async(obj) => {
//     try{
//         const d = new Date();
//         let day = d.getDay();

//         const {pos_id1, pos_id2, accountId, accountId2} = obj;
//         if(connections[accountId] && connections[accountId2]){
//             const result1 =  connections[accountId].closePosition(pos_id1);
//             const result2 =  await connections[accountId2].closePosition(pos_id2);
//             await setTimeout(() => {
//                 console.log(result1, result2);
//             }, 2000);
//             return 1;
//         } else {
//             console.log('failed to close trade, updeployed account', obj);
//             return 0;
//         }
//     }catch(e){
//         console.log(e);
//         return 0;
//     }
// }

// exports.closeGroupOrders = async(obj) => {
//     console.log('closeGroupOrders--', obj);
//     try{
//         const d = new Date();
//         let day = d.getDay();
        
//         const {pos_ids1, pos_ids2, accountId, accountId2} = obj;
//         if(connections[accountId] && connections[accountId2]){
//             let result1, result2;
//             if(pos_ids1 && pos_ids1.length>0){
//                 pos_ids1.forEach(element => {
//                     result1 =  connections[accountId].closePosition(element);
//                 });
//             }
//             if(pos_ids2 && pos_ids2.length>0){
//                 pos_ids2.forEach(element2 => {
//                     result2 =  connections[accountId2].closePosition(element2);
//                 });
//             }
//             await setTimeout(() => {
//                 console.log(result1, result2);
//                 return 1;
//             }, 3000);
//         } else {
//             console.log('failed to close trade, updeployed account', obj);
//             return 0;
//         }
//     }catch(e){
//         console.log(e);
//         return 0;
//     }
// }

// const saveToFile = (dir, content) =>{
//     try {
//         if(content === '') return;
//         fs.writeFile(dir, JSON.stringify(content),  function (err) {
//             if (err) throw err;
//             console.log('Saved!');
//           });
//     } catch (err) {
//         console.log(err);
//     }
// }

// // sum property value of objects in Object array
// const sum = (items, prop)=> { 
//     return items.reduce((a, b) => a + b[prop], 0);
// }


