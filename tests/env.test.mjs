import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

test("Environment Configuration Tests", async (t) => {
  await t.test("should have .env.example file present", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    const exists = fs.existsSync(envExamplePath);
    assert.strictEqual(exists, true, ".env.example is missing from the project root");
  });

  await t.test("should contain required environment keys in .env.example", () => {
    const envExamplePath = path.join(process.cwd(), ".env.example");
    const content = fs.readFileSync(envExamplePath, "utf8");
    
    const requiredKeys = [
      "MONGODB_URI",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "FIREBASE_PROJECT_ID",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "NEXT_PUBLIC_FIREBASE_API_KEY"
    ];

    for (const key of requiredKeys) {
      assert.ok(content.includes(key), `Missing required environment variable key: ${key}`);
    }
  });
});
