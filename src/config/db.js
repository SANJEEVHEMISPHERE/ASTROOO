const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Clean up legacy non-sparse email_1 and tuloId_1 indexes from users collection
        try {
            const usersCol = mongoose.connection.collection("users");
            const userIndexes = await usersCol.indexes();

            const emailIdx = userIndexes.find(idx => idx.name === "email_1");
            if (emailIdx && !emailIdx.sparse) {
                await usersCol.dropIndex("email_1");
                console.log("Successfully dropped legacy non-sparse email_1 index");
            }

            const tuloIdx = userIndexes.find(idx => idx.name === "tuloId_1");
            if (tuloIdx && !tuloIdx.sparse) {
                await usersCol.dropIndex("tuloId_1");
                console.log("Successfully dropped legacy non-sparse tuloId_1 index");
            }

            // Sync User indexes
            const User = require("../models/user.model");
            await User.syncIndexes();
            console.log("User model indexes synced successfully");
        } catch (err) {
            console.warn("Index sync warning:", err.message);
        }

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;