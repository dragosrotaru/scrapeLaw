import fs from "node:fs";

/**
 * Reads a JSON file from the filesystem
 * @param path
 */
export function readJSON(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

export function loadCorpusFiles(path: string): { id: string, data: string }[] {
  const files = fs.readdirSync(path);
  return files.map(file => {
    return {
      id: file.split(".")[0],
      data: fs.readFileSync(`${path}/${file}`, "utf-8")
    };
  });
}

/**
 * Writes a JSON file to the filesystem
 * @param path
 * @param data
 */
export function writeJSON(path: string, data: any) {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

export async function askQuestion(query: string): Promise<string> {
    const buf = new Uint8Array(1024);
    // @ts-ignore
    await Deno.stdout.write(new TextEncoder().encode(query));
    // @ts-ignore
    const n = await Deno.stdin.read(buf);
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
  }
  