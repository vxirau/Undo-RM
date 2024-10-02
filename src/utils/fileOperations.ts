import fs from "fs";
import path from "path";
import { showToast, Toast } from "@raycast/api";
import { TrashFile, TRASH_META } from "./trash";

// Function to recover a file to its original location
export const recoverFile = (file: TrashFile, setTrashFiles: Function) => {
    try {
      const { trashedPath, originalPath, originalName, isDirectory } = file;

      if (originalPath === "Unknown") {
        showToast({
          style: Toast.Style.Failure,
          title: "Recovery Failed",
          message: `Original path for ${originalName} is unknown.`,
        });
        return;
      }

      // Ensure the original directory exists
      const originalDir = path.dirname(originalPath);
      if (!fs.existsSync(originalDir)) {
        fs.mkdirSync(originalDir, { recursive: true });
      }

      // Check if the file already exists at the original location
      if (fs.existsSync(originalPath)) {
        // Handle conflict: Append '_restored' to the filename
        const ext = path.extname(originalPath);
        const baseName = path.basename(originalPath, ext);
        const newOriginalPath = path.join(originalDir, `${baseName}_restored${ext}`);
        fs.renameSync(trashedPath, newOriginalPath);

        // Update metadata
        updateTrashMeta(file.trashedPath, newOriginalPath);

        // Update state
        setTrashFiles((prevFiles: any[]) => prevFiles.filter(f => f.trashedName !== file.trashedName));

        // Show success toast
        showToast({
          style: Toast.Style.Success,
          title: "File Recovered",
          message: `${originalName} has been recovered to ${newOriginalPath}.`,
        });
      } else {
        // Move the file back to the original location
        fs.renameSync(trashedPath, originalPath);

        // Update metadata
        updateTrashMeta(file.trashedPath, originalPath);

        // Update state
        setTrashFiles((prevFiles: any[]) => prevFiles.filter(f => f.trashedName !== file.trashedName));

        // Show success toast
        showToast({
          style: Toast.Style.Success,
          title: "File Recovered",
          message: `${originalName} has been recovered to ${originalPath}.`,
        });
      }
    } catch (error) {
      console.error("Error recovering file:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "Recovery Failed",
        message: `Could not recover ${file.originalName}.`,
      });
    }
  
};

// Function to update the .trashinfo metadata file after recovery or deletion
export const updateTrashMeta = (trashedPath: string, newPath: string) => {
  // ... Update metadata logic as in your original code ...
};

// Function to delete a file permanently and update metadata
export const deleteFilePermanently = (file: TrashFile, setTrashFiles: Function) => {
  // ... Delete file logic as in your original code ...
};
