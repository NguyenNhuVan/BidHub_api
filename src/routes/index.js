const userRoute = require('./userRoutes');
const roleRoute = require('./roleRoutes');
const categoryRoute = require('./categoryRoutes');

module.exports = (app) => {
    app.use("/accounts", userRoute);
    app.use("/category",categoryRoute);
    app.use("/role",roleRoute);
    app.use("/product",roleRoute);
};
