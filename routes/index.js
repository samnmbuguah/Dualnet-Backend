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
const { getCurrencyInfo } = require("../controllers/MTAPI");

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

module.exports = router;