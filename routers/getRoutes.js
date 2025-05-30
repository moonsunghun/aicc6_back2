const router = require("express").Router();
const { getTasks } = require("../controllers/getTasks");

// :userId는 파라미터로 받아오는 값이다.
router.get("/get_task/:userId", getTasks);

module.exports = router; 
 
