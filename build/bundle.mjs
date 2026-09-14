import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * TypeScript mənbəni Apps Script-in gözlədiyi tək `.gs` faylına yığır.
 *
 * Apps Script modul sistemi bilmir və yalnız QLOBAL funksiyaları görür —
 * ona görə paket IIFE kimi yığılır, sonra giriş nöqtələri qlobal funksiya
 * kimi açılır. Bu bağlayıcı olmasa redaktorun «İşə sal» siyahısı boş qalır.
 */

const OUT_DIR = "dist";
const OUT_FILE = path.join(OUT_DIR, "Code.gs");
const GLOBAL = "Mohur";

/**
 * Apps Script-də qlobal görünməli funksiyalar.
 *
 * `setup` parametrsizdir: redaktorun «İşə sal» siyahısından əl ilə çağırılır.
 * `onStatusEdit` isə tetikleyici hadisəsini alır.
 */
const ENTRY_POINTS = [
  { name: "onStatusEdit", params: "e" },
  { name: "setup", params: "" },
  { name: "buildTemplates", params: "" },
];

const manifest = {
  timeZone: "Asia/Baku",
  dependencies: {},
  exceptionLogging: "STACKDRIVER",
  runtimeVersion: "V8",
};

await mkdir(OUT_DIR, { recursive: true });

await build({
  entryPoints: ["src/gs/main.ts"],
  bundle: true,
  format: "iife",
  globalName: GLOBAL,
  target: "es2019",
  charset: "utf8",
  outfile: OUT_FILE,
  logLevel: "info",
});

const bundled = await readFile(OUT_FILE, "utf8");

const shims = ENTRY_POINTS.map(
  ({ name, params }) =>
    `function ${name}(${params}) {\n  return ${GLOBAL}.${name}(${params});\n}`,
).join("\n\n");

await writeFile(
  OUT_FILE,
  `${bundled}\n// --- Apps Script qlobal giriş nöqtələri ---\n\n${shims}\n`,
  "utf8",
);

await writeFile(
  path.join(OUT_DIR, "appsscript.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(`hazır: ${OUT_FILE} (+ appsscript.json)`);
