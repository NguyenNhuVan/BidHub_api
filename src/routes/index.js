const userRoutes = require('./userRoutes');


module.exports = (app) => {
    app.use("/accounts", userRoutes);
   
}