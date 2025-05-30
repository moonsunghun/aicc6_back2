const database = require("../database/database");
const { v4: uuid4 } = require("uuid"); 
const axios = require('axios');
require('dotenv').config();  

// 카카오 설정
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI;
 
// Task 관련 컨트롤러
exports.postTask = async (req, res) => {
  const _id = uuid4();
  const { title, description, date, isCompleted, isImportant, userId } = req.body;

  try {
    await database.query(
      "INSERT INTO tasks (_id, title, description, date, isCompleted, isImportant, userId) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [_id, title, description, date, isCompleted, isImportant, userId]
    );
    return res.status(201).json({ msg: "Task Created Successfully" });
  } catch (error) {
    console.error("Error in postTask:", error);
    return res.status(500).json({ msg: "Post Task Fail", error: error.message });
  } 
}; 

// Account 관련 컨트롤러
exports.postAccount = async (req, res) => {
  const { id, pwd, user_nm, acc_type, acc_key } = req.body;

  try {
    const existingAccount = await database.query(
      "SELECT * FROM account WHERE id = $1",
      [id]
    );

    if (existingAccount.rows.length > 0) {
      // 계정이 이미 존재하면 업데이트
      await database.query(
        "UPDATE account SET last_login_date = $1 WHERE id = $2",
        [ "NOW()", id]
      );
      return res.status(200).json({ msg: "Account updated successfully" });
    }

    // 새 계정 생성
    await database.query(
      "INSERT INTO account (id, pwd, user_nm, acc_type, acc_key, last_login_date) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, pwd, user_nm,acc_type, acc_key , "NOW()"]
    );

    return res.status(201).json({ msg: "Account created successfully" });
  } catch (error) {
    console.error("Error in postAccount:", error);
    return res.status(500).json({ msg: "Account creation failed", error: error.message });
  }
}; 

// Account 관련 컨트롤러
exports.postCreateAccount = async (req, res) => {
  const { id, pwd, user_nm, acc_type } = req.body;

  try {
    const existingAccount = await database.query(
      "SELECT * FROM account WHERE id = $1",
      [id]
    );

    if (existingAccount.rows.length > 0) {
      // 계정이 존재하면 해당 계정 정보 반환 
      return res.status(200).json({
        success: false,
        msg: '계정이 존재합니다.',
        data: existingAccount.rows[0]
      });
    }

    // 계정 생성
    const insertAccountQuery = `
      INSERT INTO account (id, pwd, user_nm, acc_type, acc_key, last_login_date )
      VALUES ($1, $2, $3, $4, $5, $6 )
      RETURNING *
    `;
    const insertResult = await database.query(insertAccountQuery, [id, pwd, user_nm, acc_type, id, "NOW()"]);
 
    res.status(201).json({
      success: true,
      msg: '계정이 성공적으로 생성되었습니다.',
      data: insertResult.rows[0]
    });
  } catch (error) { 
    console.error('계정 생성 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      msg: '계정 생성 중 오류가 발생했습니다.',
      data: null
    });
  } finally { 
  }
};

// Account 관련 컨트롤러
exports.postLogin = async (req, res) => {
  const { id, pwd } = req.body;

  try {
    const existingAccount = await database.query(
      "SELECT * FROM account WHERE id = $1 and pwd = $2",
      [id, pwd]
    );

    if (existingAccount.rows.length > 0) { 
      return res.status(200).json({
        success: true,
        msg: 'Account updated successfully.',
        data: existingAccount.rows[0]
      }); 
    }
    else
    {
      return res.status(200).json({
        success: false,
        msg: '아이디 또는 비밀번호가 잘못 되었습니다',
        data: null
      });  
    } 
  } catch (error) {
    console.error("Error in postAccount:", error);
    return res.status(500).json({ msg: "Account creation failed", error: error.message });
  }
}; 

exports.postKakaoLogin = async (req, res) => {
  const { code } = req.body; // 프론트에서 전송한 인가 코드

  if (!code) {
    return res.status(400).json({
      success: false,
      msg: 'Authorization code missing',
      data: null
    });
  }

  try {
    // 1. 인가 코드로 Access Token 요청
    const tokenResponse = await axios({
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code: code,
      }).toString(),
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Access Token으로 사용자 정보 요청
    const userResponse = await axios({
      method: 'GET',
      url: 'https://kapi.kakao.com/v2/user/me',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
    });

    const kakaoUser = userResponse.data;
    const kakaoId = String(kakaoUser.id); // 카카오 ID는 숫자로 오므로 문자열로 변환
    // const nickname = kakaoUser.properties.nickname; // 닉네임 사용 안 함
    // const email = kakaoUser.kakao_account.email; // 이메일 사용 안 함

    // 3. 데이터베이스에서 계정 확인 또는 생성
    const checkAccountQuery = 'SELECT * FROM account WHERE id = $1';
    const checkResult = await database.query(checkAccountQuery, [kakaoId]);

    let accountData;
    let statusCode;
    let message;

    if (checkResult.rows.length > 0) {
      // 계정이 존재하면 해당 계정 정보 반환
      accountData = checkResult.rows[0];
      statusCode = 200; // OK
      message = '계정이 존재합니다.';
      // 필요하다면 last_login_date 업데이트 등 추가 로직
       await database.query(
        "UPDATE account SET last_login_date = NOW() WHERE id = $1",
        [kakaoId]
      );

    } else {
      // 계정이 없으면 새로 생성
      const insertAccountQuery = `
        INSERT INTO account (id, user_nm, acc_type, acc_key , pwd, last_login_date)
        VALUES ($1, $2, $3, $4 , '', NOW())
        RETURNING *
      `;
       // user_nm과 acc_key에 카카오 고유 ID 사용 (필요에 따라 nickname 사용 가능)
      const insertResult = await database.query(insertAccountQuery, [kakaoId, kakaoId, 'kakao', kakaoId]);
      accountData = insertResult.rows[0];
      statusCode = 201; // Created
      message = '계정이 생성되었습니다.';
    }

    res.status(statusCode).json({
      success: true,
      msg: message,
      data: accountData // accountData 반환
    });

  } catch (error) {
    console.error('카카오 로그인 처리 중 오류 발생:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      msg: '카카오 로그인 처리 중 오류가 발생했습니다.',
      data: null,
      error: error.response?.data || error.message // 에러 상세 정보 포함
    });
  }
}; 
 
exports.postNaverLogin = async (req, res) => {
  const { code, state } = req.body; // 프론트에서 전송한 인가 코드와 state

  if (!code || !state) {
    return res.status(400).json({ success: false, msg: 'Authorization code or state missing.' });
  }

  try {
    // 1. 인가 코드로 Access Token 요청
    const tokenResponse = await axios({
      method: 'POST',
      url: 'https://nid.naver.com/oauth2.0/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        redirect_uri: process.env.NAVER_REDIRECT_URI, // 백엔드에서 사용하는 Redirect URI (환경변수로 관리)
        code: code,
        state: state,
      }).toString(),
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Access Token으로 사용자 정보 요청
    const userResponse = await axios({
      method: 'GET',
      url: 'https://openapi.naver.com/v1/nid/me',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json;charset=utf-8'
      },
    });

    const naverUser = userResponse.data.response; // 네이버 사용자 정보는 response 객체 안에 있음 

    // 3. 데이터베이스에서 계정 확인 또는 생성
    const acc_key = String(naverUser.id); // 네이버 고유 ID는 숫자로 올 수 있으므로 문자열로 변환
    const user_nm = naverUser.name || 'Naver User'; // 닉네임 사용 또는 기본값
    //const email = naverUser.email || null; // 이메일 (필요시 사용)

    const checkAccountQuery = 'SELECT * FROM account WHERE acc_key = $1 AND acc_type = $2';
    const checkResult = await database.query(checkAccountQuery, [acc_key, 'naver']);

    let accountData;
    let statusCode;
    let message;
 
    if (checkResult.rows.length > 0) {
      // 계정이 존재하면 해당 계정 정보 반환
      accountData = checkResult.rows[0];
      statusCode = 200; // OK
      message = '계정이 존재합니다.';
      // 필요하다면 last_login_date 업데이트 등 추가 로직
       await database.query(
        "UPDATE account SET last_login_date = NOW() WHERE id = $1",
        [acc_key]
      );

    } else {
      // 계정이 없으면 새로 생성
      const insertAccountQuery = `
        INSERT INTO account (id, user_nm, acc_type, acc_key , pwd, last_login_date)
        VALUES ($1, $2, $3, $4, '', NOW())
        RETURNING *
      `; 
      const insertResult = await database.query(insertAccountQuery, [acc_key, user_nm, 'naver', acc_key]);
      accountData = insertResult.rows[0];
      statusCode = 201; // Created
      message = '계정이 생성되었습니다.';
    }

    res.status(statusCode).json({
      success: true,
      msg: message,
      data: accountData // accountData 반환
    });

  } catch (error) {
    console.error('네이버 로그인 처리 중 오류 발생:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      msg: '네이버 로그인 처리 중 오류가 발생했습니다.',
      data: null,
      error: error.response?.data || error.message // 에러 상세 정보 포함
    });
  }
};