import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

const app = express();
const saltRounds = 10;
env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT
});

db.connect();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  try {
    if(email != "" && password != "") {
      const checkEmail = await db.query("SELECT email FROM users WHERE email = $1", [email]);
      if(checkEmail.rows.length == 0) {
        res.send("NOK");
      } else {
        const checkPassword = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        //Comparing hashed password with user input password
        bcrypt.compare(password, checkPassword.rows[0].password, (err, result) => {
          if(err) {
            throw new Error(err);
          } else {
            if(result) {
              return res.json(checkPassword.rows[0].id);
            } else {
              return res.send("NOK password");
            }
          }
        });
      }
    } else {
      res.send("NOK");
    }
  } catch (error) {
    console.log(error);
  }
});

app.post('/register', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  try {
    if(email != "" && password != "") {
      const checkEmail = await db.query("SELECT email FROM users WHERE email = $1", [email]);

      if(checkEmail.rows.length == 0) {
        //Password Hashing
        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if(err) {
            console.error("Error hashing password: ", err);
          } else {
            await db.query("INSERT INTO users (email, password) VALUES ($1, $2)", [email, hash]);
          }
        });

        res.send("OK");
      } else {
        res.send("NOK");
      }
    } else {
      res.send("NOK");
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(5000, () => console.log('API is running on http://localhost:5000'));
