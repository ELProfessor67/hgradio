import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./utils/dbConnect.js";
import userAuthRoutes from "./routes/user/auth.route.js"
import userRoutes from "./routes/user/user.route.js"
import adminAuthRoutes from "./routes/admin/auth.route.js"
import userContactRoutes from "./routes/public/contact.route.js";
import SponsorRoutes from "./routes/public/sponsor.route.js";
import publicAlbumRoutes from "./routes/public/album.route.js";
import commentRoutes from "./routes/comment/comment.route.js";
const app = express();
dotenv.config();


dbConnect();
const corsOptions = {
  origin: ["http://localhost:3000", "https://radio-station-ten.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Server is running",
  });
});

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/user/auth", userAuthRoutes);
app.use("/api/user/", userRoutes);

// New Added
app.use("/api/contact", userContactRoutes);
app.use("/api/sponsor", SponsorRoutes);

app.use("/api/public/album", publicAlbumRoutes)
app.use("/api/comment", commentRoutes)

const PORT = process.env.PORT || 7501;

// if (process.env.NODE_ENV !== "production") {
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// }

export default app;
