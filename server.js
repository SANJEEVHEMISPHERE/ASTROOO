const dns = require("dns");
try {
    dns.setDefaultResultOrder("ipv4first");
} catch (e) {}

require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`🚀 Server Running on Port ${PORT}`);
        });

        connectDB().catch(err => {
            console.error("MongoDB connection warning:", err.message);
        });

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

startServer();