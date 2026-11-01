import fs from "fs";

const DATA_DIR = "data";

export const writeFile = (path: string, data: any, type: "json" | "html" = "json") => {
    const dir = path.split("/").slice(0, -1).join("/");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (type === "json") {
        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    } else if (type === "html") {
        fs.writeFileSync(path, data);
    }
}

export const readFile = (path: string, type: "json" | "html" = "json") => {
    if (type === "json") {
        return JSON.parse(fs.readFileSync(path, "utf8"));
    } else if (type === "html") {
        return fs.readFileSync(path, "utf8");
    }
}

export const saveProfile = (region: string, id: string, profile: any, type: "json" | "html" = "json") => {
    writeFile(`${DATA_DIR}/${region}/profiles/${id}.${type}`, profile, type);
}

export const saveIndex = (region: string, index: any, type: "json" | "html" = "json") => {
    writeFile(`${DATA_DIR}/${region}/index.${type}`, index, type);
}

export const saveFilteredIndex = (region: string, index: any, type: "json" | "html" = "json") => {
    writeFile(`${DATA_DIR}/${region}/index-filtered.${type}`, index, type);
}

export const profileExists = (region: string, id: string, type: "json" | "html" = "json") => {
    return fs.existsSync(`${DATA_DIR}/${region}/profiles/${id}.${type}`);
}

export const readIndex = (region: string) => {
    return readFile(`${DATA_DIR}/${region}/index.json`, "json");
}