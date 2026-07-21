const express = require("express");

const router = express.Router();

const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/create",
    paymentController.createPayment
);

router.get(
    "/all",
    paymentController.getAllPayments
);

router.get(
    "/:id",
    paymentController.getPaymentById
);

router.put(
    "/update/:id",
    paymentController.updatePayment
);

router.delete(
    "/delete/:id",
    authMiddleware,
    paymentController.deletePayment
);

module.exports = router;