const userRoute = require('./userRoutes');
const roleRoute = require('./roleRoutes');
const categoryRoute = require('./categoryRoutes');
const productRoute = require('./productRoutes');
const auctionSessionRoute = require('./AuctionSessionRoutes');
const fileRoutes = require('./fileRoute');
const bidRoutes = require('./bidRoute');
const notificationRoutes = require('./notificationRoutes');
module.exports = (app) => {
    app.use("/accounts", userRoute);
    app.use("/category",categoryRoute);
    app.use("/role",roleRoute);
    app.use("/product",productRoute);
    app.use("/auction",auctionSessionRoute);
    app.use("/bid",bidRoutes);
    app.use("/notification",notificationRoutes);
    app.use("/api",fileRoutes);
};
