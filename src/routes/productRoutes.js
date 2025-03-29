const express = require("express");
const router = express.Router();
const productController = require('../controllers/productController');


router.post("/addProduct", productController.addProduct);

module.exports = router;