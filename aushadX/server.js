const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Enable CORS with specific origins
app.use(cors({ origin: "*" }));
app.use(express.json());

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "photo") {
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
      }
    } else {
      cb(null, true);
    }
  },
});

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/profile", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Define User Schema with name index for efficient querying
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true }, // Added unique and index
  age: { type: String, required: true },
  gender: { type: String, required: true },
  blood_group: { type: String, required: true },
  medical_conditions: String,
  health_insurance: String,
  date_of_birth: { type: String, required: true },
  photo: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Save or Update Profile (Uses name instead of _id)
app.post("/profile", upload.single("photo"), async (req, res) => {
  try {
    const { name, age, gender, blood_group, medical_conditions, health_insurance, date_of_birth } = req.body;

    // Basic Validation
    if (!name || !age || !gender || !blood_group || !date_of_birth) {
      return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    // Prepare user data
    const userData = {
      name,
      age,
      gender,
      blood_group,
      medical_conditions,
      health_insurance,
      date_of_birth,
      updated_at: new Date(),
    };

    // Add photo path if a photo was uploaded
    if (req.file) {
      userData.photo = `/uploads/${req.file.filename}`;
    }

    // Update or Create User based on name
    const user = await User.findOneAndUpdate(
      { name: name },
      userData,
      { new: true, upsert: true }
    );

    res.json({ success: true, message: "Profile saved successfully!", user });
  } catch (err) {
    console.error("Error:", err);
    if (err.code === 11000) { // MongoDB duplicate key error
      res.status(400).json({ success: false, message: "Profile name already exists!" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});

// Fetch Profile by Name
app.get("/profile/name/:name", async (req, res) => {
  try {
    const user = await User.findOne({ name: decodeURIComponent(req.params.name) });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Fetch All Profiles
app.get("/profiles", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Delete Profile by Name
app.delete("/profile/name/:name", async (req, res) => {
  try {
    const user = await User.findOne({ name: decodeURIComponent(req.params.name) });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Delete associated photo if it exists
    if (user.photo) {
      const photoPath = path.join(__dirname, user.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await User.findOneAndDelete({ name: decodeURIComponent(req.params.name) });
    res.json({ success: true, message: "Profile deleted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

const PORT = 6000;
app.listen(PORT, () => console.log(`🚀 Server running on http://172.16.30.163:${PORT}`));