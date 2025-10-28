import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

// === Base Upload Directory ===
const uploadDir = "/app/uploads"; // mounted host folder
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// === Multer Storage ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB per file
});

// === Serve Frontend ===
app.use(express.static(path.join(process.cwd(), "web")));

// === Serve Uploaded Files ===
app.use("/uploads", express.static(uploadDir));

/**
 * 🟢 MULTIPLE FILE UPLOAD ENDPOINT
 * Use field name "files" in your frontend form:
 * <input type="file" name="files" multiple />
 */
app.post("/upload", upload.array("files", 20), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).json({ message: "No files uploaded" });

  const uploadedFiles = req.files.map((file) => ({
    filename: file.filename,
    path: `${uploadDir}/${file.filename}`,
    url: `/uploads/${file.filename}`,
  }));

  res.json({
    message: `Successfully uploaded ${req.files.length} file(s)!`,
    files: uploadedFiles,
  });
});

// === List Uploaded Files ===
app.get("/list-uploads", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err)
      return res.status(500).json({ message: "Cannot read uploads folder" });

    const fileList = files.map((f) => ({
      name: f,
      url: `/uploads/${f}`,
    }));
    res.json(fileList);
  });
});

// === Simple HTML Page to View Uploads ===
app.get("/uploads-page", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.send("Cannot read uploads folder");

    const fileLinks = files
      .map((f) => `<li><a href="/uploads/${f}" target="_blank">${f}</a></li>`)
      .join("\n");

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Uploaded Files</title></head>
        <body>
          <h1>Uploaded Files</h1>
          <ul>${fileLinks}</ul>
          <a href="/">Go Back to Upload Form</a>
        </body>
      </html>
    `);
  });
});

// === Fallback to index.html ===
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "web/index.html"));
});
// app.get('/:path(*)', (req, res) => {
//   res.sendFile(path.join(process.cwd(), "web/index.html"));
// });

app.get("/get", (req, res) => {
  res.send("hello world");
});

// === Start Server ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
