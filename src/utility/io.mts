import fs from "node:fs";
import { JSONType } from "./types.mts";

/**
 * Reads a JSON file from the filesystem
 * @param path
 */
export function readJSONFile(path: string): JSONType {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

/**
 * Reads all the files in a directory as text files
 * @param path 
 * @returns 
 */
export function readTextFilesDir(path: string): { id: string, data: string }[] {
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
export function writeJSONFile(path: string, data: JSONType) {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

/**
 * Fetch JSON Data
 * @param url 
 * @returns 
 */
export async function fetchJSON(url: string, config?: RequestInit): Promise<JSONType> {
  const response = await fetch(url, config);
  return response.json();
}

export async function fetchSaveJSON(path: string, url: string, config?: RequestInit): Promise<void> {
  const data = await fetchJSON(url, config);
  writeJSONFile(path, data);
  return data;
}

/**
 * Asks the terminal user a question 
 * @param query 
 * @returns 
 */
export async function promptUser(query: string): Promise<string> {
    const buf = new Uint8Array(1024);
    // @ts-ignore
    await Deno.stdout.write(new TextEncoder().encode(query));
    // @ts-ignore
    const n = await Deno.stdin.read(buf);
    return new TextDecoder().decode(buf.subarray(0, n)).trim();
  }
  