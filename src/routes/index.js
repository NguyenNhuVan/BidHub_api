const userRoute = require('./userRoutes');
const roleRoute = require('./roleRoutes');
const categoryRoute = require('./categoryRoutes');
const productRoute = require('./productRoutes');
const auctionSessionRoute = require('./AuctionSessionRoutes');
module.exports = (app) => {
    app.use("/accounts", userRoute);
    app.use("/category",categoryRoute);
    app.use("/role",roleRoute);
    app.use("/product",productRoute);
    app.use("/auction",auctionSessionRoute);
};
