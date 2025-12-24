const express = require("express");
const cors = require("cors");
const ytdl = require("@distube/ytdl-core");
const fs = require("fs");
const { exec } = require("child_process");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

/**
 * Download audio from YouTube video
 */
function downloadAudio(url) {
  return new Promise((resolve, reject) => {
    const outputFile = "audio.mp3";

    ytdl(url, { filter: "audioonly", quality: "highestaudio" })
      .pipe(fs.createWriteStream(outputFile))
      .on("finish", () => resolve(outputFile))
      .on("error", (err) => reject(err));
  });
}

/**
 * Transcribe audio using Whisper (local)
 */
function transcribeAudio(filePath) {
  return new Promise((resolve, reject) => {
    const command = `whisper ${filePath} --model tiny --language en --output_format txt`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error.message);
      } else {
        resolve(stdout);
      }
    });
  });
}

/**
 * API: Transcribe YouTube video
 */
app.post("/api/transcribe", async (req, res) => {
  const youtubeUrl =
    req.body.youtubeUrl ||
    req.body.url ||
    req.body.videoUrl ||
    req.body.link;

  if (!youtubeUrl) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  try {
    console.log("Downloading audio...");
    const audioFile = await downloadAudio(youtubeUrl);

    console.log("Transcribing audio...");
    const transcript = await transcribeAudio(audioFile);

    res.json({
      success: true,
      transcript: transcript
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.toString()
    });
  }
});

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
