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
import dns from "node:dns";

/*
  Some Node 22 builds on Windows misread the system resolver and report 127.0.0.1,
  where nothing is listening — so the SRV lookup a mongodb+srv:// URI depends on
  fails with querySrv ECONNREFUSED. Node 20 reports the real router address and
  works fine.

  Only override when the detected config is unusable, so a machine with a working
  resolver (including a genuine local DNS server that answers) is left alone.
*/
const resolvers = dns.getServers();
const resolverIsUnusable =
  resolvers.length === 0 ||
  resolvers.every((s) => s === "127.0.0.1" || s === "::1" || s === "0.0.0.0");

if (resolverIsUnusable) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  console.log("DNS resolver looked unusable; falling back to public DNS");
}

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
