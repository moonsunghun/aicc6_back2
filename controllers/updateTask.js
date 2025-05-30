const database = require('../database/database');

exports.updateCompletedTask = async(req,res)=>{
    const {isCompleted, itemId} = req.body;

    console.log(isCompleted,itemId);


    try{
        await database.query("UPDATE tasks SET isCompleted = $1 WHERE _id = $2",[isCompleted,itemId]);
        return res.status(200).json({msg:"Update Complete Status Success"});
    }
    catch(error){ 
        return res.status(500).json({error:"Update Complete Status"});
    }
}

exports.updateTask = async(req,res)=>{ 
    const { title, description, date, isCompleted, isImportant, _id } =
    req.body;

    
    try{
        await database.query("UPDATE tasks SET title = $1, description = $2, date = $3, isCompleted = $4, isImportant = $5 WHERE _id = $6",[title,description,date,isCompleted,isImportant,_id]);
        return res.status(200).json({msg:"Update Complete Status Success"});
    }
    catch(error){ 
        return res.status(500).json({error:"Update Task Fail Status"});
    }
}
