const database = require("../database/database");

exports.getTasks = async(req,res)=>{
    const userId = req.params.userId;

    try
    {
      const result = await database.query("SELECT * FROM tasks WHERE userId = $1 order by created_at desc",[userId]);
      return res.status(200).json(result.rows);

    }
    catch(error) 
    {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({error:"Internal server error"});
    }
}

 

