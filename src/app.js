var express = require('express');
require('dotenv').config();
const http = require("http");
const path = require("path");
const Routes = require("./routes/index.js");
const connectDB = require("./config/database.js");
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const app = express();
Routes(app);
const server = http.createServer(app);
app.use(express.json());
app.use(bodyParser.json()) 
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser());






connectDB();
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;