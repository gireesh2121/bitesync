import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse json bodies
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google Sheets Apps Script proxy endpoint
  app.get("/api/sheets-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    const action = req.query.action as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
      const urlObj = new URL(targetUrl);
      if (action) {
        urlObj.searchParams.set("action", action);
      }
      
      // Forward other query params
      for (const [key, val] of Object.entries(req.query)) {
        if (key !== "url" && key !== "action") {
          urlObj.searchParams.set(key, val as string);
        }
      }

      const response = await fetch(urlObj.toString(), {
        method: "GET",
        redirect: "follow"
      });

      if (!response.ok) {
        throw new Error(`Google Sheets Web App responded with status ${response.status}`);
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        const lowerText = text.toLowerCase().trim();
        if (lowerText.startsWith("<") || lowerText.includes("<!doctype") || lowerText.includes("<html")) {
          return res.status(502).json({
            error: "The Google Sheets Web App returned an HTML page instead of JSON. This usually means either the Web App URL is invalid, or the Apps Script is prompting for a Google Account login. Please ensure you followed the step-by-step setup: 1) Deploy as a Web App, 2) Set 'Execute as' to 'Me (your email)', 3) Set 'Who has access' to 'Anyone' (so customers can submit orders), and 4) Authorize all required Google permissions during deployment."
          });
        }
        res.status(502).json({ error: "Invalid JSON response from Google Sheets. Response body: " + text.slice(0, 200) });
      }
    } catch (error: any) {
      console.error("Sheets proxy GET error:", error);
      res.status(502).json({ error: error.message || "Failed to fetch from Google Sheets" });
    }
  });

  app.post("/api/sheets-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch {
        const lowerText = text.toLowerCase().trim();
        if (lowerText.startsWith("<") || lowerText.includes("<!doctype") || lowerText.includes("<html")) {
          return res.status(502).json({
            error: "The Google Sheets Web App returned an HTML page during write. Please make sure the Apps Script is published with 'Who has access' set to 'Anyone'."
          });
        }
        res.status(502).json({ error: "Invalid JSON response from Google Sheets on write. Response body: " + text.slice(0, 200) });
      }
    } catch (error: any) {
      console.error("Sheets proxy POST error:", error);
      res.status(502).json({ error: error.message || "Failed to post to Google Sheets" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
