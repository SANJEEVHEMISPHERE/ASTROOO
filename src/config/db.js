const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Clean up legacy firebaseUid_1 index from users collection
        try {
            const usersCol = mongoose.connection.collection("users");
            const userIndexes = await usersCol.indexes();
            if (userIndexes.some(idx => idx.name === "firebaseUid_1")) {
                await usersCol.dropIndex("firebaseUid_1");
                console.log("Successfully dropped legacy firebaseUid_1 index");
            }
        } catch (err) {}

        // Clean up legacy unique user_1 index from astrologers collection
        try {
            const astroCol = mongoose.connection.collection("astrologers");
            const astroIndexes = await astroCol.indexes();
            if (astroIndexes.some(idx => idx.name === "user_1")) {
                await astroCol.dropIndex("user_1");
                console.log("Successfully dropped legacy user_1 index from astrologers");
            }
        } catch (err) {}

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;