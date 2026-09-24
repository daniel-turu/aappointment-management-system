"use server";

import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { auth } from "@/lib/auth";

/**
 * Saves an uploaded file locally inside public/uploads directory.
 * @param {FormData} formData - FormData containing a 'file' field.
 * @returns {Promise<{success?: boolean, url?: string, error?: string}>}
 */
export async function uploadLocalFile(formData) {
  try {
    const session = await auth();
    if (!session) {
      return { error: "Unauthorized" };
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return { error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = path.extname(file.name) || ".png";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${fileExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    return {
      success: true,
      url: `/uploads/${filename}`,
      filename,
      originalName: file.name
    };
  } catch (error) {
    console.error("Server action local upload error:", error);
    return { error: "Failed to save file locally." };
  }
}
