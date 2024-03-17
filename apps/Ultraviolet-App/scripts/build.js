import { build } from "esbuild";
import { fileURLToPath } from "url";
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux";

const dirname = fileURLToPath(new URL("..", import.meta.url));

// the way that these static files are loaded inside of modules really freaks out esbuild and pkg, so its easier to inject them at build time
await build({
  sourcemap: true,
  minify: true,
  define: {
    "process.env.OVERRIDE_PUBLIC_PATH": JSON.stringify(publicPath),
    "process.env.OVERRIDE_UV_PATH": JSON.stringify(uvPath),
    "process.env.OVERRIDE_EPOXY_PATH": JSON.stringify(epoxyPath),
    "process.env.OVERRIDE_BAREMUX_PATH": JSON.stringify(baremuxPath),
  },
  bundle: true,
  logLevel: 'info',
  entryPoints: ['src/index.js'],
  platform: 'node',
  target: ['node16'],
  outfile: 'dist/bundle.js',
});
