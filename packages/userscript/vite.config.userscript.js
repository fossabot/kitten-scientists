import { defineConfig } from "vite";
import { metablock } from "vite-plugin-userscript";
import manifest from "./package.json" assert { type: "json" };

const isDevBuild = Boolean(process.env.DEV_BUILD);
const isNightlyBuild = Boolean(process.env.NIGHTLY_BUILD);

function getDateString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

const filename = [
  "kitten-scientists",
  isDevBuild ? "-dev" : `-${manifest.version}`,
  isNightlyBuild ? `-${getDateString()}` : "",
  process.env.GITHUB_SHA ? `-${String(process.env.GITHUB_SHA).substring(0, 7)}` : "",
  ".user.js",
].join("");

export default defineConfig({
  plugins: [
    metablock({
      override: {
        version: manifest.version,
        description: manifest.description,
        homepage: manifest.homepage,
        supportURL: manifest.bugs.url,
      },
    }),
  ],
  build: {
    lib: {
      entry: "source/index.ts",
      name: "kitten-scientists",
    },
    minify: isDevBuild ? false : "esbuild",
    outDir: "output",
    rollupOptions: {
      output: {
        extend: true,
        format: "umd",
        entryFileNames: filename,
      },
    },
  },
});
