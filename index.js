import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

app.use(express.json({ limit: "4gb" }));
app.use(express.urlencoded({ limit: "4gb", extended: true }));

const uploadDir = "/app/uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 },
});

app.use(express.static(path.join(process.cwd(), "web")));

app.use("/uploads", express.static(uploadDir));

app.post("/upload", upload.array("files", 50), (req, res) => {
  if (!req.files || req.files.length === 0)
    return res.status(400).send("No files uploaded");

  const uploadedFiles = req.files.map((file) => ({
    filename: file.filename,
    path: `${uploadDir}/${file.filename}`,
    url: `/uploads/${file.filename}`,
  }));

  const fileListHtml = uploadedFiles
    .map(
      (file) => `
        <div class="file-card">
          <div class="file-icon">📄</div>
          <div class="file-name">${file.filename}</div>
          <a href="${file.url}" target="_blank" class="download-btn">Download</a>
        </div>
      `
    )
    .join("");

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Upload Successful</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #74ebd5, #ACB6E5);
          text-align: center;
          padding: 40px;
        }
        h1 { color: #333; text-shadow: 1px 1px 2px #fff; }
        .file-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }
        .file-card {
          background: white;
          padding: 15px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        .file-icon { font-size: 40px; }
        .file-name { margin: 8px 0; color: #333; font-weight: 500; }
        .download-btn {
          display: inline-block;
          background: #4a90e2;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 13px;
        }
        .download-btn:hover { background: #357ABD; }
        a.view-btn {
          display: inline-block;
          margin-top: 30px;
          color: #4a90e2;
          font-weight: bold;
          text-decoration: none;
        }
        a.view-btn:hover { text-decoration: underline; }
      </style>
      <script>
        // Optional: auto redirect to /uploads-page after 3 seconds
        setTimeout(() => {
          window.location.href = "/uploads-page";
        }, 3000);
      </script>
    </head>
    <body>
      <h1>✅ Files Uploaded Successfully!</h1>
      <div class="file-list">${fileListHtml}</div>
      <a href="/uploads-page" class="view-btn">📂 View All Uploaded Files</a>
    </body>
    </html>
  `);
});

app.get("/list-uploads", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err)
      return res.status(500).json({ message: "Cannot read uploads folder" });
    const fileList = files.map((f) => ({ name: f, url: `/uploads/${f}` }));
    res.json(fileList);
  });
});

app.get("/uploads-page", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.send("Cannot read uploads folder");

    const fileCards = files
      .map((f) => {
        let icon = "📄";
        if (f.endsWith(".mp3")) icon = "🎵";
        else if (f.endsWith(".mp4")) icon = "📹";
        else if (
          f.endsWith(".png") ||
          f.endsWith(".jpg") ||
          f.endsWith(".jpeg")
        )
          icon = "🖼️";
        else if (f.endsWith(".exe")) icon = "💻";
        else if (f.endsWith(".msi")) icon = "⚙️";
        else if (f.endsWith(".zip") || f.endsWith(".rar")) icon = "🗜️";

        return `
          <div class="file-card">
            <div class="file-icon">${icon}</div>
            <div class="file-name">${f}</div>
            <a href="/uploads/${f}" target="_blank" class="download-btn">Download</a>
          </div>
        `;
      })
      .join("\n");

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Uploaded Files - Media Server</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #74ebd5, #ACB6E5); margin:0; padding:20px; }
          h1 { text-align:center; color:#333; text-shadow:1px 1px 2px #fff; margin-bottom:30px; }
          .container { max-width:1000px; margin:0 auto; }
          .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:20px; }
          .file-card { background:white; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.15); padding:15px; text-align:center; transition: transform 0.2s ease; }
          .file-card:hover { transform:translateY(-5px); }
          .file-icon { font-size:50px; color:#4a90e2; margin-bottom:10px; }
          .file-name { font-size:14px; color:#333; word-break:break-word; margin-bottom:8px; }
          .download-btn { display:inline-block; background-color:#4a90e2; color:white; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:13px; transition: background-color 0.3s; }
          .download-btn:hover { background-color:#357ABD; }
          a.back-btn { display:block; text-align:center; margin:30px auto 10px; color:#4a90e2; text-decoration:none; font-weight:bold; }
          a.back-btn:hover { text-decoration:underline; }
          footer { text-align:center; font-size:13px; color:#333; opacity:0.8; margin-top:40px; }
        </style>
      </head>
      <body>
        <h1>Uploaded Files</h1>
        <div class="container"><div class="grid">${fileCards}</div></div>
        <a class="back-btn" href="/">⬅ Back to Upload Form</a>
        <footer>© 2025 Media Server | Rankraze</footer>
      </body>
      </html>
    `);
  });
});

app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(process.cwd(), "web/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);
