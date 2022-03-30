require("valyrian.js/register");
const { inline } = require("valyrian.js/plugins/node");
const fs = require("fs");

async function build() {
  console.log("Building index...");
  let { raw, map } = await inline("./app/index.tsx", {
    compact: false,
    noValidate: true
  });

  fs.writeFileSync("./www/js/index.js", raw);
  fs.writeFileSync("./www/js/index.js.map", map);
  console.log("Index built successfully");
}

build();
