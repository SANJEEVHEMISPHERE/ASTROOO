const { initializeApp, cert } = require("firebase-admin/app");

const serviceAccount = require("../../kalpjyotish-bd41d-firebase-adminsdk-fbsvc-fbc896c183.json");

initializeApp({
    credential: cert(serviceAccount),
});

module.exports = require("firebase-admin");