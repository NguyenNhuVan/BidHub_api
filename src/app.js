var express = require('express');
require('dotenv').config();
const http = require("http");
const path = require("path");
const connectDB = require("./config/database.js");

var app = express();
const server = http.createServer(app);
app.use(express.json());
const Routes = require("./routes/index.js");

Routes(app);

connectDB();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;