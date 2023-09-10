const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(4000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  let userData = await database.get(checkTheUsername);
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await database.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  let { username, password } = request.body;
  let selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  let hashedpassword = await bcrypt.hash(password, 10);
  let dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    let isPasswordMatched = await bcrypt.compare(
      hashedpassword,
      dbUser.password
    );
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const query = `select * from user where password=${oldPassword}`;
  const dbresult = await database.get(query);
  const paswdcompare = await bcrypt.compare(oldPassword, dbresult.password);
  if (dbresult === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    if (paswdcompare === false) {
      response.status(400);
      response.send("Invalid current password");
    } else {
      const paswdlen = newPassword.length;
      if (paswdlen < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const newhash = await bcrypt.hash(newPassword, 10);
        const query1 = `update user set password=${newhash} where username=${username}`;
        const dbrslt = await database.run(query1);
        response.status(200);
        response.send("Password updated");
      }
    }
  }
});
module.exports = app;
