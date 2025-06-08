import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

// Load environment variables from .env file
const result = dotenv.config();
console.log("Dotenv config result:", result);

// Debug: Log all environment variables
console.log("All environment variables:", process.env);

// Debug: Log specific Supabase variables
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const port = 4000;
const app = express();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables:", {
    supabaseUrl: supabaseUrl ? "exists" : "missing",
    supabaseKey: supabaseKey ? "exists" : "missing",
  });
  throw new Error("Missing Supabase credentials. Please check your .env file.");
}

// Debug: Log the values we're using to create the client
console.log("Creating Supabase client with:", {
  url: supabaseUrl,
  key: supabaseKey ? "Key exists" : "Key missing",
});

const supabase = createClient(supabaseUrl, supabaseKey);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// GET endpoint
app.get("/backend/users", (req, res) => {
  res.send("Hello World!");
});

// POST endpoint for user registration
app.post("/backend/users", upload.single("profilePic"), async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const profilePic = req.file;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Hash the password on the backend
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload profile picture to Supabase storage
    let profilePicUrl = null;
    if (profilePic) {
      const fileBuffer = fs.readFileSync(profilePic.path);
      const { error: uploadError } = await supabase.storage
        .from("profile-pic")
        .upload(profilePic.filename, fileBuffer, {
          contentType: profilePic.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(
          "Failed to upload profile picture: " + uploadError.message
        );
      }

      // Get public URL for the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("profile-pic")
        .getPublicUrl(profilePic.filename);

      profilePicUrl = publicUrl;

      // Clean up local file
      fs.unlinkSync(profilePic.path);
    }

    // Insert user data into Supabase
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          profilePic: profilePicUrl,
        },
      ])
      .select()
      .single();

    if (userError) {
      throw new Error("Failed to create user: " + userError.message);
    }

    res.status(201).json({
      success: true,
      data: {
        username: userData.username,
        email: userData.email,
        profilePic: userData.profilePic,
      },
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle multer errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File size too large. Maximum size is 5MB",
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || "Failed to register user",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
