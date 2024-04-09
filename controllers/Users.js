const bcrypt = require( "bcryptjs");
const jwt = require( "jsonwebtoken");
const { Op, Sequelize } = require( "sequelize");
const Users = require( "../models/UserModel.js");
const UserPDFs = require( "../models/UserPDFsModel.js");
const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const db = require('../config/Database.js');
const generatePdfForUser = require("../utils/helpers.js");

exports.getUsers = async(req, res) => {
    try {
        console.log("getusers");
        const users = await getUserList();
        res.json(users);
    } catch (error) {
        console.log(error);
    }
}

exports.getUsersForAdmin = async (req, res) => {
    try {
        const usersData = await getUserList(1);
        res.json(usersData);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



   
exports.Register = async(req, res) => {
    const { username, password,email } = req.body;
    console.log("reques",req.body);
    const salt = await bcrypt.genSalt();
    const hashPassword = password; //await bcrypt.hash(password, salt);
    try {
        await Users.create({
            username: username,
            password: hashPassword,
            email: email,
            usertype: 1,
            user_roles: 'super_admin'
        });
        res.json({msg: "Registered!"});
    } catch (error) {
        console.log(error);
        res.status(400).json({msg:"Invalid Information!"});
    }
}

exports.Login = async(req, res) => {
    try{
        const {email, password} = req.body;
        console.log("Login",req.body)
        const user = await Users.findAll({
            where:{
                // [Op.or]: [
                //     { 
                        email: email 
                    // },
                    // { email: username }
                // ]
            }
        });
        if(user.length == 0) return res.status(404).json({msg: "Not register!"});
        // const match = await bcrypt.compare(req.body.password, user[0].password);
        if(password !== user[0].password) return res.status(400).json({msg: "Wrong Password"});

        const userId = user[0].id;
        const name = user[0].username;
        const usertype = user[0].usertype;
        const accessToken = jwt.sign({userId, name, usertype}, process.env.ACCESS_TOKEN_SECRET,{
            expiresIn: '1d'
        });
        console.log(accessToken, 'access token');
        const refreshToken = jwt.sign({userId, name}, process.env.REFRESH_TOKEN_SECRET,{
            expiresIn: '7d'
        });
        await Users.update({refresh_token: refreshToken},{
            where:{
                id: userId
            }
        });
        console.log("Updated",accessToken);
        res.cookie('refreshToken', refreshToken,{
            httpOnly: true,
            maxAge: 1* 60 * 60 * 1000
        });
        if(usertype == 0 || usertype == 1 || usertype == 3 || usertype == 4){
            res.json([{ accessToken },user[0]]);
        }
        else return res.status(400).json({msg: "Email tidak ditemukan."});
    } catch (error) {
        console.log(error)
        res.status(404).json({msg:"Email tidak ditemukan..."});
    }
}

exports.UpdateUser = async(req,res)  =>{
    let data = req.body;
    const isAdminUser = data.user_roles === 'admin' || data.user_roles === 'super_admin';

    try {
        if(data.Admin_id && data.user_roles === 'client') {
            const adminUser = await Users.findOne({ where: { id: data.Admin_id } });
            if (adminUser) {
                await Users.update(
                  {
                    id: data.id,
                    username: data.username,
                    password: data.password,
                    email:data.email,
                    account_no: data.account_no,
                    api_key: data.api_key,
                    api_secret: data.api_secret,
                    wallet: data.wallet,
                    investment: data.investment,
                    usertype: data.usertype,
                    begin_date: data.begin_date,
                    fee: data.fee,
                    Net_client_share_in_percent: data.Net_client_share_in_percent,
                    profit_now: data.profit_now,
                    user_roles: data.user_roles,
                    Admin_id: data.Admin_id,
                  },
                  {
                    where: {
                      id: data.id,
                    },
                  }
                );
                //update admin temp_assets
                updateAdminTempAssets();
            }else {
                return res.status(404).json({ msg: "Admin user not found" });
            }
        }
        else {
            await Users.update({
                id: data.id,
                username: data.username,
                password: data.password,
                email: data.email,
                account_no: data.account_no,
                api_key: data.api_key,
                api_secret: data.api_secret,
                wallet: data.wallet,
                investment: data.investment,
                usertype: data.usertype,
                begin_date: data.begin_date,
                fee: data.fee, 
                Net_client_share_in_percent: data.Net_client_share_in_percent,
                profit_now: data.profit_now,
                user_roles: data.user_roles,
                Admin_id: data.Admin_id,
            },{
                where:{
                    id: data.id
                }
            });
        }

        let users = await getUserList(1);
        res.json(users);
    } catch (error) {
        res.status(404).json({msg:"update failure"});
    }
}  

exports.Logout = async(req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken) return res.sendStatus(204);

    const user = await Users.findAll({
        where:{
            refresh_token: refreshToken
        }
    });
    if(!user[0]) return res.sendStatus(204);
    const userId = user[0].id;

    await Users.update({refresh_token: null},{
        where:{
            id: userId
        }
    });
    res.clearCookie('refreshToken');
    return res.sendStatus(200);
}

exports.deleteUser = async(req, res) => {
    try{
        const userid = req.body.id;
        const result = await Users.destroy({
            where:{
                id: userid
            }
        });
        let users = await getUserList(1);
        res.json(users);
    }catch(e){
        console.log(e);
        res.status(404).json({msg:"delete failure"});
    }
}

exports.getAccountsByUserid = async(id) => {
    try {
        const accountIds = await Users.findAll(
            {
                attributes:['reward','hedge', 'api_token','Admin_id'],
                where:{
                    id: id
                },
            },
        );
        var arrInfo = [];
        arrInfo[0] = accountIds[0].reward;
        arrInfo[1] = accountIds[0].hedge;
        arrInfo[2] = accountIds[0].api_token;
        
        return arrInfo
    } catch (error) {
        console.log('getAccountsByUserid ='+ error);
        return [];
    }
}
exports.getMetaAccountsByUserid = async(req,res) => {
    try {
        const id  = req.body.params.id;
        const accountIds = await Users.findAll(
            {
                attributes:['username', 'account_no'],
                where:{
                    id: id
                },
            },
        );
        
        var arrInfo = [];
        arrInfo[0] = accountIds[0].username;
        arrInfo[1] = accountIds[0].account_no;
        
        res.json({arrInfo: arrInfo}) ;
    } catch (error) {
        console.log('function getMetaAccountsByUserid error---'+ error);
    }
}

// get all accountIds
exports.getAllAccountIds = async() => {
    try {
        const allAccountsIds = await Users.findAll(
            {
                attributes:['id', 'reward','hedge', 'api_token']
            },
        );
        return allAccountsIds;
    } catch (error) {
        console.log(error);
        return [];
    }
}

const getUserList = async(type=0) => {
    if (type==1) {
        const users = await Users.findAndCountAll(
            {
                attributes:[
                    'id',
                    'username',
                    'email',
                    'password',
                    'account_no',
                    'api_key',
                    'api_secret',
                    'wallet',
                    'usertype',
                    'investment',
                    'begin_date',
                    'fee',
                    'Net_client_share_in_percent',
                    'profit_now',
                    'Admin_id',
                    'user_roles',
                ],
                order: [
                    [db.cast(db.col('account_no'), 'INTEGER'), 'ASC'],
                ],
            }
        );
        
        return users
    }
    const users = await Users.findAndCountAll(
        {
            attributes:[
                'id',
                'username',
                    'account_no',
                    'wallet',
                    'usertype',
                    'investment',
                    'begin_date',
                    'api_key',
                    'api_secret',
                    'fee',
                    'Net_client_share_in_percent',
                    'profit_now',
                    'Admin_id',
                    'user_roles',
            ],         
            order: [
                [db.cast(db.col('account_no'), 'INTEGER'), 'ASC'],
            ],
        }
    );
    return users
}
exports.generatePdfsForUsertype4Users = async (req, res) => {
  try {
    const usertype4Users = await Users.findAll({
      where: { usertype: 4 },
      attributes: ["id"],
    });
    // Create a folder if it doesn't exist
    const folderPath = "pdfs";
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    // Generate PDFs for each user
    const pdfFilePaths = await Promise.all(
      usertype4Users.map(async (user) => {
        const userId = user.id;
        let pdfFilePath;
        for(let i = 0; i<1 ; i++) {
        pdfFilePath = await generatePdfForUser(userId);
        }
        return pdfFilePath;
      })
    );
    if (res) {
        res.status(200).json({ message: pdfFilePaths });
      } else {
        console.log("Response file paths.",pdfFilePaths);
      }
  } catch (error) {
    console.error("Error generating PDFs for usertype 4 users:", error);
    throw error;
  }
};



async function getUsersByAdminId(adminId) {
    try {
      // Find all users where Admin_id matches the provided adminId
      const users = await Users.findAll({
        where: {
          Admin_id: adminId,
        },
      });
  
      // Also fetch the admin user's data
      const adminUser = await Users.findOne({
        where: {
          id: adminId,
        },
      });
  
      return { adminUser, associatedUsers: users };
    } catch (error) {
      // Handle any errors, e.g., by logging or throwing an exception
      throw error;
    }
}
  
exports.adminCommissionCalculation = async (req,res) => {
        const { user_id } = req.params;
    try {
        let admin_id = user_id;
        const admin = Users.findOne({
            where: {
                id: admin_id,
            },
        });

        const clientUsers = await Users.findAll({
            where: {
                Admin_id: admin_id, // Corrected here
            },
        });

        let totalAdminCommission = 0;

        for (const client of clientUsers) {
            const netClientSharePercent = client.Net_client_share_in_percent;
            // Calculate commission as a percentage of profit
            const commissionPercentage = 100 - netClientSharePercent;
            const adminCommission = (commissionPercentage / 100) * client.profit_now;

            totalAdminCommission += adminCommission;
        }

        if (res) {
                res.status(200).json({ totalAdminCommission:totalAdminCommission });
            } else {
                console.log("not a admin",totalAdminCommission);
            }
        return totalAdminCommission;
    } catch (error) {
        console.error("Error calculating admin commission:", error.message);
        throw error;
    }
};

// exports.updateAdminTempAssets=async (req,res)=> {
async function updateAdminTempAssets() {
    try {
        // Step 1: Retrieve admin and super_admin users
        const adminUsers = await Users.findAll({
            where: {
                user_roles: {
                    [Op.or]: ["admin", "super_admin"],
                },
            },
        });
        // Step 2 & 3: Calculate sum of profits and investments, then update temp_assets
        for (const adminUser of adminUsers) {
            const result = await Users.findAll({
                where: {
                    Admin_id: adminUser.id,
                },
                attributes: [
                    [
                        Sequelize.literal("(SUM(profit_now) + SUM(investment) - SUM(fee))"),
                        "total_temp_assets",
                    ],
                ],
                raw: true,
            });
            const totalTempAssets = result[0].total_temp_assets || 0;
            // Update temp_assets for the admin user
            await adminUser.update({
                temp_assets: totalTempAssets,
            });
        }

        console.log("Temp_assets updated successfully for admin users.");
    } catch (error) {
        console.error("Error updating temp_assets for admin users:", error);
    }
}