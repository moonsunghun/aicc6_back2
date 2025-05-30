const router = require("express").Router();
const { postTask, postAccount, postCreateAccount, postLogin } = require("../controllers/postController");
const { postKakaoLogin, postNaverLogin } = require('../controllers/postController');


router.post("/post_task", postTask);
router.post("/post_account", postAccount);
router.post("/post_create_account", postCreateAccount);
router.post("/post_login", postLogin);
router.post('/post_kakao_login', postKakaoLogin);
router.post('/post_naver_login', postNaverLogin);

module.exports = router;

