import express from "express";
import { createServer } from "node:http";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux";
import { join } from "node:path";
import { hostname } from "node:os";
import wisp from "wisp-server-node"

// injection point
const usablePublicPath = process.env.OVERRIDE_PUBLIC_PATH ?? publicPath;
const usableUvPath = process.env.OVERRIDE_UV_PATH ?? uvPath;
const usableEpoxyPath = process.env.OVERRIDE_EPOXY_PATH ?? epoxyPath;
const usableBaremuxPath = process.env.OVERRIDE_BAREMUX_PATH ?? baremuxPath;

const app = express();
// Load our publicPath first and prioritize it over UV.
app.use(express.static(usablePublicPath));
// Load vendor files last.
// The vendor's uv.config.js won't conflict with our uv.config.js inside the publicPath directory.
app.use("/uv/", express.static(usableUvPath));
app.use("/epoxy/", express.static(usableEpoxyPath));
app.use("/baremux/", express.static(usableBaremuxPath));

// Error for everything else
app.use((req, res) => {
  res.status(404);
  res.sendFile(join(usablePublicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  app(req, res);
});
server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/"))
    wisp.routeRequest(req, socket, head);
  else
    socket.end();
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

server.on("listening", () => {
  const address = server.address();

  // by default we are listening on 0.0.0.0 (every interface)
  // we just need to list a few
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(`\thttp://${hostname()}:${address.port}`);
  console.log(
    `\thttp://${address.family === "IPv6" ? `[${address.address}]` : address.address
    }:${address.port}`
  );
});

// https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  process.exit(0);
}

server.listen({
  port,
});
