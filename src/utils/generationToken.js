const jwt = require("jsonwebtoken");

const generateAccessToken = (_id) => {
    try {
        const accessToken = jwt.sign({ _id }, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
        console.log(`Access token created for user ID: ${_id}`);
        return accessToken; // 1 hours
    } catch (error) {
        console.error("Error generating access token:", error);
        throw new Error("Unable to generate access token");
    }
};

const generateRefreshToken = (_id) => {
    console.log("REFRESH_TOKEN:", process.env.REFRESH_TOKEN);

    try {
        if (!process.env.REFRESH_TOKEN) {
          throw new Error("REFRESH_TOKEN is not defined");
        }
    
        const refreshToken = jwt.sign({ _id }, process.env.REFRESH_TOKEN, { expiresIn: "30d" }); // 30 ngày
        console.log(`Refresh token created for user ID: ${_id}`);
        return refreshToken;
      } catch (error) {
        console.error("Error generating refresh token:", error);
        throw new Error("Unable to generate refresh token");
      }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
};