import fs from "fs";
import path from "path";

import task from "./task";

function readFilesSync(dir: string) {
  const files: { filepath: string; name: string; ext: string }[] = [];

  fs.readdirSync(dir).forEach((filename) => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();

    if (isFile) files.push({ filepath, name, ext });
  });

  files.sort((a, b) => {
    // natural sort alphanumeric strings
    // https://stackoverflow.com/a/38641281
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  return files;
}

void (async () => {
  const proxies = fs
    .readFileSync("proxies.txt", "utf-8")
    .split(/\r?\n/)
    .filter(Boolean);

  const files = readFilesSync("./accounts");

  await Promise.all(
    files.map((file, index) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
      const content = JSON.parse(
        fs.readFileSync(file.filepath, "utf-8")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;

      return task(
        file.name + file.ext,
        content,
        proxies[index] !== "none" ? proxies[index] : undefined
      );
    })
  );
})();
