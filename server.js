const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname, { extensions: ["html"] }));

const ensureDataFile = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(MESSAGES_FILE).catch(async () => {
      await fs.writeFile(MESSAGES_FILE, "[]", "utf8");
    });
  } catch (error) {
    console.error("Failed to initialize data store:", error);
  }
};

ensureDataFile();

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({
      ok: false,
      error: "Name, email, and message are required.",
    });
  }

  const entry = {
    id: Date.now().toString(),
    name,
    email,
    phone: phone || "",
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    await ensureDataFile();
    const raw = await fs.readFile(MESSAGES_FILE, "utf8").catch(() => "[]");
    const clean = raw.replace(/^\uFEFF/, "").trim();
    let list;
    try {
      list = JSON.parse(clean || "[]");
    } catch {
      list = [];
    }
    if (!Array.isArray(list)) list = [];
    list.push(entry);
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(list, null, 2), "utf8");
    return res.json({ ok: true });
  } catch (error) {
    console.error("Failed to save message:", error);
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
