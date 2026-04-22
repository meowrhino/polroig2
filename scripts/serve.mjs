import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webp": "image/webp",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon"
};

function resolve(reqPath) {
  // strip query
  let p = decodeURIComponent(reqPath.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  const abs = path.normalize(path.join(ROOT, p));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

http.createServer((req, res) => {
  let file = resolve(req.url);
  if (!file) { res.writeHead(400); return res.end(); }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      // try as directory index
      const idx = path.join(file, "index.html");
      fs.stat(idx, (e2, s2) => {
        if (e2 || !s2.isFile()) {
          const f404 = path.join(ROOT, "404.html");
          fs.readFile(f404, (e3, data) => {
            res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
            res.end(data || "not found");
          });
          return;
        }
        stream(idx, res);
      });
      return;
    }
    stream(file, res);
  });
}).listen(PORT, () => {
  console.log(`▶  http://localhost:${PORT}`);
});

function stream(file, res) {
  const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  fs.createReadStream(file).pipe(res);
}
