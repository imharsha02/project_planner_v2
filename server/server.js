import express from "express";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are not set."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
const allowedOrigins = ["http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow the methods you use
  credentials: true, // If you're sending cookies or authorization headers
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 200
};

app.use(cors(corsOptions)); // Use the configured cors middleware

// GET endpoint to fetch all users
app.get("/backend/users", async (_, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data || []);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST endpoint to create a new user
app.post("/backend/users", upload.single("profilePic"), async (req, res) => {
  const { username, email, password } = req.body;
  const profilePicFile = req.file;

  if (!username || !email || !password || !profilePicFile) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check for existing username
    const { data: existingUsername } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .single();

    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check for existing email
    const { data: existingEmail } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const bucketName = "profile-pic";
    const fileExtension = profilePicFile.originalname.split(".").pop();
    const filePath = `${uuidv4()}.${fileExtension}`;

    // Upload the profile picture to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, profilePicFile.buffer, {
        contentType: profilePicFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return res.status(500).json({
        error: `Failed to upload profile picture: ${uploadError.message}`,
      });
    }

    // Get the public URL of the uploaded image
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      return res
        .status(500)
        .json({ error: "Failed to get public URL for uploaded file." });
    }

    const profilePicUrl = publicUrlData.publicUrl;
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password: hashedPassword,
          profilePic: profilePicUrl,
        },
      ])
      .select();

    if (error) {
      // Clean up uploaded file if user creation fails
      await supabase.storage.from(bucketName).remove([filePath]);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Error processing registration:", err);
    return res.status(500).json({ error: "Error processing registration" });
  }
});

// Root route handler
// Corrected from pp.get to app.get
app.get("/", (_, res) => {
  res.send("API is running. Available endpoints: /api/data");
});

// PUT endpoint to update user data by ID
app.put("/api/data/:id", upload.single("profilePic"), async (req, res) => {
  const userId = req.params.id; // ID of the user to be updated
  const { username, email: newEmail } = req.body; // New username and email
  const profilePicFile = req.file; // New profile picture file

  if (!userId) {
    return res.status(400).json({ error: "User ID is required for update" });
  }

  try {
    // First, fetch the existing user to get their current data, including current username, email and profilePic URL
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("id, username, email, profilePic")
      .eq("id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        // Supabase error code for "no rows found"
        return res.status(404).json({ error: "User not found." });
      }
      console.error("Error fetching existing user:", fetchError);
      return res
        .status(500)
        .json({ error: "Internal server error during user fetch." });
    }

    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const updateData = {};

    // Update username if provided and different from current
    if (username && username !== existingUser.username) {
      // Check for existing username if it's being changed
      const { data: existingUsername, error: usernameCheckError } =
        await supabase
          .from("users")
          .select("username")
          .eq("username", username)
          .single();

      if (usernameCheckError && usernameCheckError.code !== "PGRST116") {
        console.error(
          "Error checking for existing username:",
          usernameCheckError
        );
        return res
          .status(500)
          .json({ error: "Error checking for existing username." });
      }
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      updateData.username = username;
    }

    // Update email if provided and different from current
    if (newEmail && newEmail !== existingUser.email) {
      // Check for existing email if it's being changed
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from("users")
        .select("email")
        .eq("email", newEmail)
        .single();

      if (emailCheckError && emailCheckError.code !== "PGRST116") {
        console.error("Error checking for existing email:", emailCheckError);
        return res
          .status(500)
          .json({ error: "Error checking for existing email." });
      }
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }
      updateData.email = newEmail;
    }

    // Handle profile picture update
    if (profilePicFile) {
      const bucketName = "profile-pic";
      const fileExtension = profilePicFile.originalname.split(".").pop();
      const filePath = `${uuidv4()}.${fileExtension}`; // New unique file path

      // Upload the new profile picture to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, profilePicFile.buffer, {
          contentType: profilePicFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase Storage upload error:", uploadError);
        return res.status(500).json({
          error: `Failed to upload new profile picture: ${uploadError.message}`,
        });
      }

      // Get the public URL of the newly uploaded image
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        // If public URL can't be generated, attempt to remove the uploaded file
        await supabase.storage.from(bucketName).remove([filePath]);
        return res
          .status(500)
          .json({ error: "Failed to get public URL for new profile picture." });
      }
      updateData.profilePic = publicUrlData.publicUrl;

      // Optionally, delete the old profile picture from storage if it exists
      if (existingUser.profilePic) {
        try {
          // Extract filename from URL (e.g., https://example.com/bucket/filename.jpg -> filename.jpg)
          const oldFilePath = existingUser.profilePic.split("/").pop();
          // Ensure it's a valid filename, not just an empty string or base URL
          if (oldFilePath && oldFilePath.includes(".")) {
            await supabase.storage.from(bucketName).remove([oldFilePath]);
          }
        } catch (deleteError) {
          console.warn(
            `Could not delete old profile picture '${existingUser.profilePic}': ${deleteError.message}`
          );
          // Don't block the update if old picture deletion fails
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(200)
        .json({ message: "No changes provided to update." });
    }

    // Perform the update in the 'users' table using the user ID
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId) // Use the user ID to identify the user
      .select();

    if (error) {
      // If the update fails, and a new profile pic was uploaded, try to clean it up
      if (profilePicFile && updateData.profilePic) {
        try {
          const newFilePathToDelete = updateData.profilePic.split("/").pop();
          await supabase.storage.from(bucketName).remove([newFilePathToDelete]);
        } catch (cleanupError) {
          console.warn(
            `Failed to clean up newly uploaded profile pic after update error: ${cleanupError.message}`
          );
        }
      }
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      // This case should ideally not happen if existingUser was found, but good for robustness
      return res
        .status(404)
        .json({ error: "User not found or no changes applied." });
    }

    return res.status(200).json(data[0]); // Return the updated user data
  } catch (err) {
    console.error("Error processing user update:", err);
    return res.status(500).json({ error: "Error processing user update" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
