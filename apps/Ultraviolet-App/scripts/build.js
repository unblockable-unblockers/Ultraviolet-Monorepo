import { build } from "esbuild";
import { fileURLToPath } from "url";
import { relative } from 'path';
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { exec as pkgBuild } from "@yao-pkg/pkg";

// after this module is npm or pnpm installed, we don't use these and instead just want the symlinks/files in node_modules
// import { publicPath } from "ultraviolet-static";
// import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
// import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
// import { baremuxPath } from "@mercuryworkshop/bare-mux";

const isDevelopment = process.argv.includes('--dev');

// clear out the dist folder
if (existsSync('dist')) {
  await rm('dist', {recursive: true});
}
await mkdir('dist', {recursive: true});

const appCWDURL = new URL("..", import.meta.url);
const srcPathURL = new URL("src", appCWDURL);
const srcPath = fileURLToPath(srcPathURL);

// modules in node_modules for ease of bundling
const modulePublicPathURL = new URL("node_modules/ultraviolet-static/public", appCWDURL);
const moduleUvPathURL = new URL("node_modules/@titaniumnetwork-dev/ultraviolet/dist", appCWDURL);
const moduleEpoxyPathURL = new URL("node_modules/@mercuryworkshop/epoxy-transport/dist", appCWDURL);
const moduleBaremuxPathURL = new URL("node_modules/@mercuryworkshop/bare-mux/dist", appCWDURL);

// now we need path versions of those URLS
const modulePublicPath = fileURLToPath(modulePublicPathURL);
const moduleUvPath = fileURLToPath(moduleUvPathURL);
const moduleEpoxyPath = fileURLToPath(moduleEpoxyPathURL);
const moduleBaremuxPath = fileURLToPath(moduleBaremuxPathURL);

// relative paths to entrypoint
const relativePublicPath = relative(srcPath, modulePublicPath);
const relativeUvPath = relative(srcPath, moduleUvPath);
const relativeEpoxyPath = relative(srcPath, moduleEpoxyPath);
const relativeBaremuxPath = relative(srcPath, moduleBaremuxPath);

// the way that these static files are loaded inside of modules really freaks out esbuild and pkg, so its easier to inject them at build time
await build({
  sourcemap: isDevelopment,
  minify: !isDevelopment,
  define: {
    "process.env.OVERRIDE_PUBLIC_PATH": JSON.stringify(relativePublicPath),
    "process.env.OVERRIDE_UV_PATH": JSON.stringify(relativeUvPath),
    "process.env.OVERRIDE_EPOXY_PATH": JSON.stringify(relativeEpoxyPath),
    "process.env.OVERRIDE_BAREMUX_PATH": JSON.stringify(relativeBaremuxPath),
  },
  bundle: true,
  logLevel: 'info',
  entryPoints: ['src/index.js'],
  platform: 'node',
  target: ['node16'],
  outfile: 'dist/bundle.js',
});

// next: pkg
const pkgArguments = [
  'dist/bundle.js',
  '--config',
  'pkg-config.json',
];

if (!isDevelopment) {
  pkgArguments.push(
    '--compress',
    'Brotli'
  );
} else {
  pkgArguments.push(
    '--debug'
  );
}

await pkgBuild(pkgArguments);

// finally, do executable packing

// now chmod the final executable and we are done
