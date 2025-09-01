const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app.js");

const port = process.env.PORT || 5000;

async function dbConnect() {
  while (true) {
    try {
      await mongoose.connect(process.env.MONGO_CONN_STR);

      app.listen(port, () => {
        console.log("app server listening on port: ", port);
      });
      break;
    } catch (error) {
      console.log("db connection error");
    }
  }
}

dbConnect()

/*
1. pull in environment variables with dotenv
2. connect to the mongodb server with mongoose
3. inport the express app.js
4. listen on the given port number with express
*/



