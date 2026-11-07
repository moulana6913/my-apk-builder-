
import express from "express";
import multer from "multer";
import cors from "cors";
import path from "node:path";
import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { v4 as uuid } from "uuid";
import { fileURLToPath } from "node:url";
import { createAndroidProject } from "./webview-project.js";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");
const WORK = path.join(ROOT, "work");

await fs.mkdir(WORK, { recursive: true });
await fs.mkdir(path.join(WORK, "uploads"), { recursive: true });

// CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
app.use(express.static(PUBLIC));

// File Upload
const upload = multer({
  dest: path.join(WORK, "uploads"),
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1
  }
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "MY APK BUILDER",
    version: "1.0.0"
  });
});

// APK Build
app.post(
  "/api/build",
  upload.single("projectFile"),
  async (req, res) => {

    const uploaded = req.file;

    if (!uploaded) {
      return res.status(400).json({
        error: "HTML அல்லது ZIP கோப்பைத் தேர்வு செய்யவும்."
      });
    }

    const name = String(
      req.body.appName || "MyWebApp"
    ).trim().slice(0, 40);

    const safeName =
      name.replace(/[^a-zA-Z0-9 _-]/g, "").trim()
      || "MyWebApp";

    const id = uuid();

    const jobDir = path.join(WORK, id);
    const sourceDir = path.join(jobDir, "site");
    const projectDir = path.join(jobDir, "android");

    try {

      await fs.mkdir(sourceDir, { recursive: true });

      const ext = path.extname(
        uploaded.originalname
      ).toLowerCase();

      // HTML File
      if (ext === ".html" || ext === ".htm") {

        await fs.copyFile(
          uploaded.path,
          path.join(sourceDir, "index.html")
        );

      }

      // ZIP File
      else if (ext === ".zip") {

        const { stdout } = await execFileAsync(
          "unzip",
          ["-Z1", uploaded.path]
        );

        const entries = stdout
          .split(/\r?\n/)
          .filter(Boolean);

        if (
          entries.length > 500 ||
          entries.some(e =>
            path.isAbsolute(e) ||
            e.split(/[\\/]/).includes("..")
          )
        ) {
          throw new Error(
            "ZIP கோப்பில் பாதுகாப்பற்ற அல்லது அதிகமான files உள்ளன."
          );
        }

        await execFileAsync(
          "unzip",
          ["-q", uploaded.path, "-d", sourceDir]
        );

        const index = await findIndexHtml(sourceDir);

        if (!index) {
          throw new Error(
            "ZIP-ல் index.html கிடைக்கவில்லை."
          );
        }

        if (index !== path.join(sourceDir, "index.html")) {

          const tempDir = path.join(jobDir, "temp");

          await fs.mkdir(tempDir, { recursive: true });

          await fs.cp(
            path.dirname(index),
            tempDir,
            { recursive: true }
          );

          await fs.rm(sourceDir, {
            recursive: true,
            force: true
          });

          await fs.rename(tempDir, sourceDir);
        }

      }

      else {
        throw new Error(
          "HTML அல்லது ZIP கோப்புகள் மட்டுமே ஆதரிக்கப்படும்."
        );
      }

      // Remove uploaded temporary file
      await fs.unlink(uploaded.path).catch(() => {});

      // Create Android Project
      const packageName =
        "com.myapkbuilder.app" +
        id.replaceAll("-", "").slice(0, 8);

      await createAndroidProject({
        projectDir,
        sourceDir,
        appName: safeName,
        packageName
      });

      // Gradle Build
      const gradle = process.env.GRADLE_BIN || "gradle";

      await execFileAsync(
        gradle,
        ["--no-daemon", "assembleDebug"],
        {
          cwd: projectDir,
          timeout: 10 * 60 * 1000,
          maxBuffer: 10 * 1024 * 1024,
          env: process.env
        }
      );

      // APK Location
      const apk = path.join(
        projectDir,
        "app",
        "build",
        "outputs",
        "apk",
        "debug",
        "app-debug.apk"
      );

      await fs.access(apk);

      res.download(
        apk,
        safeName.replace(/\s+/g, "_") + ".apk"
      );

    } catch (err) {

      console.error("APK BUILD ERROR:", err);

      if (!res.headersSent) {
        res.status(500).json({
          error: err.message || "APK Build தோல்வியடைந்தது."
        });
      }

    } finally {

      await fs.unlink(uploaded.path).catch(() => {});

      // Temporary project cleanup
      setTimeout(() => {
        fs.rm(jobDir, {
          recursive: true,
          force: true
        }).catch(() => {});
      }, 60000);

    }
  }
);

// Find index.html inside ZIP
async function findIndexHtml(dir) {

  const items = await fs.readdir(
    dir,
    { withFileTypes: true }
  );

  for (const item of items) {

    const p = path.join(dir, item.name);

    if (
      item.isFile() &&
      item.name.toLowerCase() === "index.html"
    ) {
      return p;
    }

    if (item.isDirectory()) {

      const found = await findIndexHtml(p);

      if (found) return found;
    }
  }

  return null;
}

// Start Server
app.listen(PORT, () => {
  console.log(
    `MY APK BUILDER running on port ${PORT}`
  );
});
