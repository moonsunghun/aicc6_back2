const database = require("../database/database");

exports.deleteTask = async(req,res)=>{
    const {itemId} = req.params;

    try{
        await database.query("DELETE FROM tasks WHERE _id = $1",[itemId]);
        return res.status(200).json({msg:"Delete Task Success"});
    }
    catch(error){
        return res.status(500).json({error:"Delete Task Fail"});
    }
} 

