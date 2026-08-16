import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
// Bind to all local interfaces so tablets on the same private LAN can open the preview.
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.argv[2] || process.env.PORT || 8767);
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".mp3", "audio/mpeg"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".vtt", "text/vtt; charset=utf-8"]
]);

function resolveFile(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, `http://${host}:${port}`).pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, relative);
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  if (resolved !== path.resolve(root) && !resolved.startsWith(rootPrefix)) return null;
  return resolved;
}

function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(header || "").trim());
  if (!match) return null;
  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;

  if (start === null && end !== null) {
    start = Math.max(0, size - end);
    end = size - 1;
  } else {
    start = start ?? 0;
    end = end ?? size - 1;
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const file = resolveFile(request.url || "/");
  if (!file) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(file).toLowerCase();
    const contentType = mimeTypes.get(extension) || "application/octet-stream";
    const baseHeaders = {
      "Accept-Ranges": "bytes",
      "Cache-Control": extension === ".mp4" ? "no-cache" : "no-store",
      "Content-Type": contentType
    };
    const rangeHeader = request.headers.range;

    if (rangeHeader) {
      const range = parseRange(rangeHeader, stat.size);
      if (!range) {
        response.writeHead(416, { ...baseHeaders, "Content-Range": `bytes */${stat.size}` });
        response.end();
        return;
      }
      const length = range.end - range.start + 1;
      response.writeHead(206, {
        ...baseHeaders,
        "Content-Length": length,
        "Content-Range": `bytes ${range.start}-${range.end}/${stat.size}`
      });
      if (request.method === "HEAD") response.end();
      else fs.createReadStream(file, { start: range.start, end: range.end }).pipe(response);
      return;
    }

    response.writeHead(200, { ...baseHeaders, "Content-Length": stat.size });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(file).pipe(response);
  });
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}/index.html`);
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
