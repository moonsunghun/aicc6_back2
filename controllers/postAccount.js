// const database = require("../database/database");

// exports.postAccount = async (req, res) => {
//   const { email, name, picture, sub } = req.body;

//   try {
//     // 먼저 해당 이메일로 계정이 이미 존재하는지 확인
//     const existingAccount = await database.query(
//       "SELECT * FROM accounts WHERE email = $1",
//       [email]
//     );

//     if (existingAccount.rows.length > 0) {
//       // 계정이 이미 존재하면 업데이트
//       await database.query(
//         "UPDATE accounts SET name = $1, picture = $2, sub = $3 WHERE email = $4",
//         [name, picture, sub, email]
//       );
//       return res.status(200).json({ msg: "Account updated successfully" });
//     }

//     // 새 계정 생성
//     await database.query(
//       "INSERT INTO accounts (email, name, picture, sub) VALUES ($1, $2, $3, $4)",
//       [email, name, picture, sub]
//     );

//     return res.status(201).json({ msg: "Account created successfully" });
//   } catch (error) {
//     console.error("Error in postAccount:", error);
//     return res.status(500).json({ msg: "Account creation failed", error: error.message });
//   }
// }; 