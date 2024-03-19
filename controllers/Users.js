const bcrypt = require( "bcrypt");
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
            usertype: 1
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
                    api_token: adminUser.api_token,
                    reward: adminUser.reward,
                    reward_stopout: adminUser.reward_stopout,
                    hedge: adminUser.hedge,
                    hedge_stopout: adminUser.hedge_stopout,
                    wallet: data.wallet,
                    investment: data.investment,
                    usertype: data.usertype,
                    begin_date: data.begin_date,
                    fee: data.fee,
                    usdt_account_number: data.usdt_account_number,
                    Net_client_share_in_percent: data.Net_client_share_in_percent,
                    Total_assets_today: data.Total_assets_today,
                    profit_now: data.profit_now,
                    Share_of_main_account_in_percent: data.Share_of_main_account_in_percent,
                    user_roles: data.user_roles,
                    Admin_id: data.Admin_id,
                    temp_assets:data.temp_assets,
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
                id              :data.id,
                username        :data.username,
                password        :data.password,
                email           :data.email,
                account_no      :data.account_no,
                api_token       :data.api_token,
                reward          :data.reward,
                reward_stopout  :data.reward_stopout,
                hedge           :data.hedge,
                hedge_stopout   :data.hedge_stopout,
                wallet          :data.wallet,
                investment      :data.investment,
                usertype        :data.usertype,
                begin_date      :data.begin_date,
                fee             :data.fee, 
                usdt_account_number     :data.usdt_account_number,
                Net_client_share_in_percent    :data.Net_client_share_in_percent,
                Total_assets_today  :data.Total_assets_today,
                profit_now      :data.profit_now,
                Share_of_main_account_in_percent:data.Share_of_main_account_in_percent,
                user_roles      :data.user_roles,
                Admin_id         :data.Admin_id,
                flash_main_assets :data.flash_main_assets,
                flash_client_profit :data.flash_client_profit,
                temp_assets      :data.temp_assets,

            },{
                where:{
                    id: data.id
                }
            });
            if(isAdminUser) {
                await updateAssociatedUsersWithAdminValues(data.id);
                  //update admin temp_assets
                updateAdminTempAssets(); 
            }
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

// get 2 metaaccountIds of user
exports.getMetaAccountsByUserid = async(req,res) => {
    try {

        const id  = req.body.params.id;
        const accountIds = await Users.findAll(
            {
                attributes:['reward','hedge'],
                where:{
                    id: id
                },
            },
        );
        
        var arrInfo = [];
        var arrStopout = [];
        arrInfo[0] = accountIds[0].reward;
        arrInfo[1] = accountIds[0].hedge;
        arrStopout[0] = accountIds[0].reward_stopout_level;
        arrStopout[1] = accountIds[0].hedge_stopout_level;
        
        res.json({arrInfo: arrInfo, arrStopout: arrStopout}) ;
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
    // let offset = (Number(req.query.page) - 1) * Number(req.query.limit);
    if (type==1) {
        const users = await Users.findAndCountAll(
            {
                attributes:[
                    'id',
                    'username',
                    'email',
                    'password',
                    'account_no',
                    'api_token',
                    'reward',
                    'reward_stopout',
                    'hedge',
                    'hedge_stopout',
                    'wallet',
                    'usertype',
                    'investment',
                    'begin_date',
                    'fee',
                    'usdt_account_number',
                    'Net_client_share_in_percent',
                    'Total_assets_today',
                    'profit_now',
                    'Share_of_main_account_in_percent',
                    'Admin_id',
                    'user_roles',
                    'flash_main_assets',
                    'flash_client_profit',
                    'temp_assets'

                ],
                order: [
                    [db.cast(db.col('account_no'), 'SIGNED'), 'ASC'],
                ],
                // offset: offset, limit: Number(req.query.limit)
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
                'reward_stopout',
                'hedge_stopout',
                'wallet',
                'usertype',
                'investment',
                'begin_date',
                'fee',
                'usdt_account_number',
                'Net_client_share_in_percent',
                'Total_assets_today',
                'profit_now',
                'Share_of_main_account_in_percent',
                'Admin_id',
                'user_roles',
                'flash_main_assets',
                'flash_client_profit',
                'temp_assets'

            ],         
            order: [
                [db.cast(db.col('account_no'), 'SIGNED'), 'ASC'],
                // To sort in descending order, use ['account_no', 'DESC']
            ],
            // offset: offset, limit: Number(req.query.limit)
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
  

async function updateAssociatedUsersWithAdminValues(adminId) {
  try {
    // Get the admin user and associated users
    const { adminUser, associatedUsers } = await getUsersByAdminId(adminId);

    // Create an object with the fields to be updated
    const updateFields = {
      api_token: adminUser.api_token,
      reward: adminUser.reward,
      reward_stopout: adminUser.reward_stopout,
      hedge: adminUser.hedge,
      hedge_stopout: adminUser.hedge_stopout,
    };

    // Update each associated user with the values from the admin user
    for (const user of associatedUsers) {
      await Users.update(updateFields, {
        where: {
          id: user.id,
        },
      });
    }
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
      id: admin_id,
    });

    const clientUsers = await Users.findAll({
      where: {
        admin_id: admin_id,
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