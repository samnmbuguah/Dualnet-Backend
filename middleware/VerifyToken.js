const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.status(401).json({msg: "Unauthorized"});
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) return res.status(403).json({msg: "Permission denied"});
        req.username = decoded.username;
        next();
    })
}

exports.verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(token == null) return res.status(401).json({msg: "Unauthorized"});
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err || decoded.usertype != 1) return res.status(403).json({msg: err?"expired token":"Permission denied"});
        req.username = decoded.username;
        next();
    })
}