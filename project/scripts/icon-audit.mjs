import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "resources/js");
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ICON_PATTERN = /\b(?:mdi|bx)-[a-z0-9-]+/gi;
const strictMode = process.argv.includes("--strict");

const shouldSkip = (entryName) => (
    entryName === "node_modules"
    || entryName === "public"
    || entryName === "vendor"
    || entryName === ".git"
);

const scanFile = (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    const findings = [];

    lines.forEach((line, index) => {
        const matches = line.match(ICON_PATTERN);
        if (!matches) {
            return;
        }

        findings.push({
            line: index + 1,
            matches: Array.from(new Set(matches.map((m) => m.toLowerCase()))),
        });
    });

    return findings;
};

const walk = (dirPath, results) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
        if (shouldSkip(entry.name)) {
            return;
        }

        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, results);
            return;
        }

        const ext = path.extname(entry.name);
        if (!FILE_EXTENSIONS.has(ext)) {
            return;
        }

        const findings = scanFile(fullPath);
        if (findings.length > 0) {
            results.push({
                file: path.relative(ROOT, fullPath),
                findings,
            });
        }
    });
};

if (!fs.existsSync(TARGET_DIR)) {
    console.error(`Directory not found: ${TARGET_DIR}`);
    process.exit(1);
}

const results = [];
walk(TARGET_DIR, results);

let totalMatches = 0;
results.forEach((result) => {
    result.findings.forEach((item) => {
        totalMatches += item.matches.length;
    });
});

if (results.length === 0) {
    console.log("Icon audit result: clean (no mdi-/bx- usage found in resources/js).");
    process.exit(0);
}

console.log(`Icon audit result: found ${totalMatches} legacy icon token(s) in ${results.length} file(s).`);
results.forEach((result) => {
    console.log(`- ${result.file}`);
    result.findings.forEach((item) => {
        console.log(`  L${item.line}: ${item.matches.join(", ")}`);
    });
});

if (strictMode) {
    process.exit(1);
}
