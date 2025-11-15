#!/usr/bin/env node
/**
 * Copy shared code for Supabase Edge Functions
 *
 * This script:
 * 1. Copies shared code from src/shared/ to supabase/functions/_shared/
 * 2. Ensures all imports work correctly (Deno handles TypeScript natively)
 * 3. Ready for deployment without additional bundling
 *
 * Note: We copy files directly because:
 * - Deno natively supports TypeScript, so no bundling needed
 * - Relative imports work correctly when files are copied
 * - Simpler and more reliable than bundling
 * - No external dependencies required (just Node.js file system)
 */

// No external dependencies needed - just file system operations
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const SHARED_DIR = path.join(PROJECT_ROOT, "src", "shared");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "supabase", "functions", "_shared");

// Find all TypeScript files in a directory recursively
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function bundleSharedCode() {
  console.log("📦 Copying shared code for Edge Functions...\n");

  // Check if shared directory exists
  if (!fs.existsSync(SHARED_DIR)) {
    console.error(`❌ Shared directory not found: ${SHARED_DIR}`);
    process.exit(1);
  }

  // Ensure output directory exists
  ensureDir(OUTPUT_DIR);

  // Find all TypeScript files
  const sharedFiles = findTsFiles(SHARED_DIR);

  if (sharedFiles.length === 0) {
    console.log("⚠️  No TypeScript files found in src/shared/");
    return;
  }

  console.log(`Found ${sharedFiles.length} file(s) to copy:\n`);

  // Copy each file
  for (const file of sharedFiles) {
    const relativePath = path.relative(SHARED_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, relativePath);
    const outputDir = path.dirname(outputPath);

    ensureDir(outputDir);

    console.log(`  📄 Copying: ${relativePath}`);

    try {
      // Copy the file directly - Deno can handle TypeScript natively
      // This ensures all imports work correctly since they're relative
      const fileContent = fs.readFileSync(file, "utf-8");

      // Write the file to the output location
      fs.writeFileSync(outputPath, fileContent, "utf-8");

      const relativeOutput = path.relative(PROJECT_ROOT, outputPath);
      console.log(`  ✅ Copied to: ${relativeOutput}`);
    } catch (error) {
      console.error(`  ❌ Failed to copy ${relativePath}`);
      if (error.stdout) {
        console.error(error.stdout.toString());
      }
      if (error.stderr) {
        console.error(error.stderr.toString());
      }
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log("\n✨ Shared code copied successfully!");
  console.log(
    `   Output directory: ${path.relative(PROJECT_ROOT, OUTPUT_DIR)}`
  );
  console.log("\n💡 Next steps:");
  console.log("   1. Edge Functions can now import from '../_shared/...'");
  console.log("   2. Deploy with: supabase functions deploy <function-name>");
  console.log(
    "\n⚠️  Note: Always run 'npm run bundle:shared' before deploying Edge Functions!"
  );
}

// Run the script
try {
  bundleSharedCode();
} catch (error) {
  console.error("❌ Error copying shared code:", error);
  process.exit(1);
}
