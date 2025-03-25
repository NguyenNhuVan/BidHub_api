const userRoute = require('./userRoutes');
const categoryRoute = require('./userRoutes');

module.exports = (app) => {
    app.use("/accounts", userRoute);
    app.use("/category", categoryRoute);
   
}