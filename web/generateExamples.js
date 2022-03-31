const fs = require("fs");
const path = require("path/posix");

const examplesPath = path.resolve(__dirname, "../examples");
const examples = fs
  .readdirSync(examplesPath)
  .filter((file) => !fs.statSync(path.resolve(examplesPath, file)).isDirectory() && file.endsWith(".hgs"));

const names = examples.map((file) =>
  file
    .slice(0, file.length - 4)
    .split("_")
    .map((s) => `${s[0].toUpperCase()}${s.slice(1)}`)
    .join(" ")
);

const sources = examples.map((file) => {
  const p = path.resolve(examplesPath, file);
  return fs.readFileSync(p, "utf-8");
});

const examplesMap = {};
names.forEach((n, i) => {
  examplesMap[n] = sources[i];
});

const outputPath = path.resolve(__dirname, "src/examples.ts");
const output = `
const examplesMap: { [index: string]: string } = ${JSON.stringify(examplesMap)};
export default examplesMap;`;

fs.writeFileSync(outputPath, output);
