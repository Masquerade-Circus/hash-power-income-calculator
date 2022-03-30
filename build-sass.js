/* eslint-disable @typescript-eslint/no-var-requires */
let fs = require("fs");
let sass = require("sass");

console.log("Compiling scss source start");
let { css: scssCss } = sass.renderSync({
  file: "./app/scss/index.scss",
  outFile: "./www/css/index.css",
  // includePaths: ["scss/", "node_modules"],
  precision: 4,
  sourceMap: true,
  sourceMapEmbed: true,
  sourceMapContents: true,
  outputStyle: "expanded"
});

fs.writeFileSync("./www/css/index.css", scssCss.toString(), "utf-8");
console.log("Compiling scss source success");
