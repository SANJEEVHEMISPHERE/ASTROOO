const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");

        // Clean up legacy firebaseUid_1 index from MongoDB collection if present
        try {
            const collection = mongoose.connection.collection("users");
            const indexes = await collection.indexes();
            if (indexes.some(idx => idx.name === "firebaseUid_1")) {
                await collection.dropIndex("firebaseUid_1");
                console.log("Successfully dropped legacy firebaseUid_1 index");
            }
        } catch (err) {
            // Ignore if collection is empty or index already dropped
        }
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

module.exports = connectDB;