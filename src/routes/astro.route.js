const express = require("express");

const router = express.Router();

const astroController = require("../controllers/astro.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
    "/create",
    astroController.createAstrologer
);
router.get(
    "/all",
    astroController.getAllAstrologers
);

router.get(
    "/:id",
    astroController.getAstrologerById
);

router.put(
    "/update/:id",
    authMiddleware,
    astroController.updateAstrologer
);

router.delete(
    "/delete/:id",
    authMiddleware,
    astroController.deleteAstrologer
);

module.exports = router;