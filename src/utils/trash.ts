import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { environment, ActionPanel, Action, Icon, showToast, Toast, confirmAlert } from "@raycast/api";



// Define the trash directory and metadata file path
export const TRASH_DIR = `${process.env.HOME}/.rm_trash`;
export const TRASH_META = path.join(TRASH_DIR, ".trashinfo");
export const IGNORED_FILES = [".trashinfo", ".DS_Store", ".trashinfo.tmp"];

// Type definitions for better type safety
export interface TrashFile {
  originalName: string;
  trashedName: string;
  trashedPath: string;
  originalPath: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
}

// Function to empty the trash folder
export function emptyTrash(setTrashFiles: (files: TrashFile[]) => void) {
  // Confirm the action
  confirmAlert({
    title: "Empty Trash",
    message: "Are you sure you want to permanently delete all files in the trash?",
    primaryAction: {
      title: "Yes, Empty Trash",
      onAction: () => {
        try {
          // Read all files in the trash directory
          const files = fs.readdirSync(TRASH_DIR);
          
          // Loop through and delete each file
          for (const file of files) {
            const filePath = path.join(TRASH_DIR, file);
            if (fs.statSync(filePath).isDirectory()) {
              fs.rmSync(filePath, { recursive: true, force: true }); // Updated to fs.rmSync
            } else {
              fs.unlinkSync(filePath);
            }
          }

          // Clear the trash files state
          setTrashFiles([]);

          // Show success toast
          showToast({
            style: Toast.Style.Success,
            title: "Trash Emptied",
            message: "All files have been permanently deleted.",
          });
        } catch (error) {
          console.error("Error emptying trash:", error);
          // Show error toast if there's a problem
          showToast({
            style: Toast.Style.Failure,
            title: "Failed to Empty Trash",
            message: "An error occurred while emptying the trash.",
          });
        }
      },
    },
  });
}

export function getTrashFiles(): TrashFile[] {
  try {
    if (!fs.existsSync(TRASH_META)) {
      return [];
    }
    const metaContent = fs.readFileSync(TRASH_META, "utf-8");
    const lines = metaContent.split("\n").filter(line => line.trim() !== '');

    const mapping: { [trashedName: string]: string } = {};

    lines.forEach(line => {
      const [trashedFilePath, originalPath] = line.split("|");
      if (trashedFilePath && originalPath) {
        const trashedName = path.basename(trashedFilePath);
        mapping[trashedName] = originalPath;
      }
    });

    const files = fs.readdirSync(TRASH_DIR);
    const filteredFiles = files
      .filter(file => !IGNORED_FILES.includes(file))
      .map(file => {
        const trashedPath = path.join(TRASH_DIR, file);
        const stats = fs.statSync(trashedPath);
        const originalPath = mapping[file] || "Unknown";
        const originalName = originalPath !== "Unknown" ? path.basename(originalPath) : file;

        return {
          originalName,
          trashedName: file,
          trashedPath,
          originalPath,
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
        };
      });

      return filteredFiles.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
  } catch (error) {
    console.error("Error reading trash directory or metadata:", error);
    return [];
  }
}

export function isPDFFile(filename: string): boolean {
  return path.extname(filename).toLowerCase() === ".pdf";
}

export function convertPDFToImage(pdfPath: string): string | null {
  try {
    const outputImage = path.join(environment.supportPath, `${path.basename(pdfPath)}.png`);
    execSync(`sips -s format png ${pdfPath}[0] --out ${outputImage}`); // Convert first page to image
    return outputImage;
  } catch (error) {
    console.error("Error converting PDF to image:", error);
    return null;
  }
}

// Helper function to determine if a file is an image
export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg"].includes(ext);
}

// Helper function to convert a file path to a file URI
export function toFileURI(filePath: string): string {
  return `file://${encodeURI(filePath)}`;
}


// Function to determine if the file is a text or code file
export function isTextOrCodeFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return [".txt", ".md", ".js", ".c", ".cpp", ".py", ".java", ".html", ".css", ".ts", ".tsx", ".json", ".sh"].includes(ext);
}

// Function to read file content safely
export function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error("Error reading file content:", error);
    return "Could not read file content.";
  }
}