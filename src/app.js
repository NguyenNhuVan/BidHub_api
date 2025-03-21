var express = require('express');
require('dotenv').config();
const http = require("http");
const path = require("path");
const Routes = require("./routes/index.js");
const connectDB = require("./config/database.js");
const cookieParser = require('cookie-parser');


var app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());


Routes(app);




connectDB();
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;