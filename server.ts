import express from "express";
import path from "path";
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8080";

// Proxy /api to Spring Boot backend
app.use(createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathFilter: '/api',
}));

// Increase limit for image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // In development, we fallback to proxying or instructions
  console.log("Development mode: serving as proxy only. For UI dev, run 'npm run dev' or 'vite'.");
  app.get("/", (req, res) => {
    res.send("Frontend proxy is running. Use Vite dev server for UI.");
  });
}

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[Creator Stage] Frontend rodando em: http://0.0.0.0:${PORT}`);
  console.log(`[Creator Stage] Proxying /api to ${BACKEND_URL}`);
});
