const userRoute = require('./userRoutes');
const roleRoute = require('./roleRoutes');

module.exports = (app) => {
    app.use("/accounts", userRoute);
    app.use("/role",roleRoute);
};
