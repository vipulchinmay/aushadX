const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Enable CORS with specific origins (Optional: Replace "*" with frontend URL)
app.use(cors({ origin: "*" }));
app.use(express.json());

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    // Create the directory if it doesn't exist
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

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: String, required: true },
  gender: { type: String, required: true },
  blood_group: { type: String, required: true },
  medical_conditions: String,
  health_insurance: String,
  date_of_birth: { type: String, required: true },
  photo: { type: String }, // Store the path to the photo
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Save or Update Profile (Uses _id instead of name)
app.post("/profile", upload.single("photo"), async (req, res) => {
  try {
    const { _id, name, age, gender, blood_group, medical_conditions, health_insurance, date_of_birth } = req.body;

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

    let user;
    if (_id) {
      // Update Existing User
      user = await User.findByIdAndUpdate(
        _id,
        userData,
        { new: true }
      );
    } else {
      // Create New User
      userData.created_at = new Date();
      user = new User(userData);
      await user.save();
    }

    res.json({ success: true, message: "Profile saved successfully!", user });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Fetch Profile by ID
app.get("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Fetch All Profiles (Optional)
app.get("/profiles", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Delete Profile
app.delete("/profile/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Delete associated photo if it exists
    if (user.photo) {
      const photoPath = path.join(__dirname, user.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Profile deleted successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

const PORT = 6000;
app.listen(PORT, () => console.log(`🚀 Server running on http://172.16.30.163:${PORT}`));