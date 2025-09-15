// import mongoose from "mongoose";

// const dbConnect = async () => {
//   try {
//     await mongoose
//       .connect(process.env.MONGODB_URI, {
//         dbName: "ScandiFans",
//       })
//       .then(() => {
//         console.log("Mongodb connected successfully");
//       })
//       .catch((err) => {
//         console.log(`Mongodb connection error: ${err}`);
//       });
//   } catch (error) {
//     console.log(`Failed to connect db`);
//   }
// };

// export default dbConnect;

import mongoose from "mongoose";

let isConnected = false;

const dbConnect = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI

    console.log(uri)
    

  try {
    const db = await mongoose.connect(
      uri,
      {
        dbName: "Radio-Station",
        serverSelectionTimeoutMS: 10000,
      }
    );

    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw new Error("Failed to connect to database");
  }
};

export default dbConnect;
