const express = require("express");
const { 
    getUsersForAdmin,
    getUsers,
    Register,
    Login,
    Logout ,
    UpdateUser,
    getMetaAccountsByUserid,
    deleteUser,
    generatePdfsForUsertype4Users,
    adminCommissionCalculation,
    updateAdminTempAssets
} = require("../controllers/Users.js");
const { verifyToken, verifyAdminToken } = require("../middleware/VerifyToken.js");
const { refreshToken } = require("../controllers/RefreshToken.js");
const { getCurrencyInfo } = require("../controllers/MTAPI.js");
const trade = require("../services/trade.js");
const setLeverage = require("../services/setLeverage.js");
const sellSpotAndLongFutures = require("../services/closeTrades.js");

const router = express.Router();

router.post('/login', Login);
router.post('/register', Register);
router.get('/users', verifyToken, getUsers);
router.post('/metaaccounts', verifyToken, getMetaAccountsByUserid);       
router.get('/token', refreshToken);
router.delete('/user/logout', Logout);

//admin functions
router.get('/users_detail', verifyAdminToken, getUsersForAdmin);
router.post('/user/update', verifyAdminToken, UpdateUser);
router.delete('/user/delete', verifyAdminToken, deleteUser);
// PDF generation route
router.get('/generate-pdf/', verifyToken, generatePdfsForUsertype4Users); //for testing PDFs on Postman
router.get('/admin-commission/:user_id', verifyToken, adminCommissionCalculation);
// router.get('/admin-temp-assets/', verifyToken, updateAdminTempAssets)

router.post('/set-leverage', verifyToken, setLeverage);
router.post('/trade',verifyToken, async (req, res) => {
    const { pair, amount, lastPrice, quantoMultiplier, takerFeeRate } = req.body;
    
     try {
        await trade(pair, amount, lastPrice, quantoMultiplier, takerFeeRate);
        res.status(200).json('Trade executed successfully');
    } catch (error) {
        console.error('Error in trade:', error.response ? error.response.data : error);
        res.status(500).json('Error executing trade');
    }
});

router.post('/close-trade',verifyToken, async (req, res) => {
    const { pair } = req.body;
    try {
        await sellSpotAndLongFutures(pair);
        res.status(200).json({message:'Trade closed successfully', status:200});
    } catch (error) {
        console.error('Error in closing trade:', error.response ? error.response.data : error);
        res.status(500).json({message:'Error closing trade',status:500});
    }
});

// router.post('/get-balances', verifyToken, getBalances)
router.post('/get-balances', verifyToken, async (req, res) => {
    const { secretKey } = req.body;
    console.log(secretKey); 
    try {
        res.status(200).json({message:'Recieved balances',balances:{secretKey}, status:200});
    } catch (error) {
        console.error('Error in recieving balances:', error.response ? error.response.data : error);
        res.status(500).json({message:'Error recieving balances',status:500});
    }
});


module.exports = router;