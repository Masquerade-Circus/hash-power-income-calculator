require("dotenv").config();
require("valyrian.js/register");
const { default: v } = require("valyrian.js/lib");
const nodePlugin = require("valyrian.js/plugins/node");
const fs = require("fs");
const { Html } = require("./app/html");

v.use(nodePlugin);

async function build() {
  console.log("Building index...");
  let { raw, map } = await nodePlugin.inline("./app/index.tsx", {
    compact: false,
    noValidate: true
  });

  fs.writeFileSync("./www/js/index.js", raw);
  fs.writeFileSync("./www/js/index.js.map", map);
  console.log("Index built successfully");

  console.log("Building app...");
  let { raw: css } = await nodePlugin.inline("./www/css/index.css");
  let { raw: js } = await nodePlugin.inline("./app/index.tsx", {
    noValidate: true,
    compact: true
  });
  let html = nodePlugin.render(Html({ css, js }));
  fs.writeFileSync("./www/app.html", html);
  console.log("App built successfully");
}

build();
