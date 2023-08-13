let express = require("express");
let { open } = require("sqlite");
let sqlite3 = require("sqlite3");
let bcrypt = require("bcrypt");
let path = require("path");
let app = express();

app.use(express.json());
let dbPath = path.join(__dirname, "userData.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  let requestBody = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  let { username, name, password, gender, location } = requestBody;
  let userCheck = `select * from user where username = '${username}';`;
  let usersList = await db.get(userCheck);
  let ggg = [];
  console.log(usersList === undefined);
  if (usersList === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      let createUser = `
     insert into user 
     (username, name, password, gender, location) 
     values 
     ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
      let creator = await db.run(createUser);
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  let requestBody = request.body;
  let { username, password } = requestBody;
  let userCheck = `select * from user where username = '${username}';`;
  let usersList = await db.get(userCheck);

  console.log(usersList === undefined);
  if (usersList !== undefined) {
    let passwordCheck = `select * from user where password = '${password}' and username = '${username}'`;
    let passwordChecker = await db.get(passwordCheck);
    let compared = await bcrypt.compare(password, usersList.password);
    if (compared === false) {
      response.status = 400;
      response.send("Invalid password");
    } else {
      response.send("Login success!");
    }
  } else {
    response.status = 400;
    response.send("Invalid user");
  }
});

app.post("/change-password", async (request, response) => {
  let requestBody = request.body;
  let { username, oldPassword, newPassword } = requestBody;
  let userCheck = `select * from user where username = '${username}';`;
  let usersList = await db.get(userCheck);

  console.log(await bcrypt.compare(oldPassword, usersList.password));
  if (await bcrypt.compare(oldPassword, usersList.password)) {
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      let updateQuery = `update user set password='${hashedPassword}' where username='${username}';`;
      let updated = await db.run(updateQuery);
      response.send("Password updated");
    }
  } else {
    response.status = 400;
    response.send("Invalid current password");
  }
});

module.exports = app;
