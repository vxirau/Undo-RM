import fs from "fs";
import path from "path";
import { showToast, Toast, open } from "@raycast/api";
import { TrashFile } from "./trash";

export const revealOriginalPath = async (file: TrashFile) => {
  try {
    const originalDir = path.dirname(file.originalPath);
    if (fs.existsSync(originalDir)) {
      await showToast({
        style: Toast.Style.Animated,
        title: "Opening Original Directory",
      });
      await open(originalDir);
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Original Directory Not Found",
        message: `The original directory for ${file.originalName} does not exist.`,
      });
    }
  } catch (error) {
    console.error("Error revealing original path:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Reveal Failed",
      message: `Could not reveal the original path for ${file.originalName}.`,
    });
  }
};

export const revealTrashedPath = async (file: TrashFile) => {
  try {
    const trashedDir = path.dirname(file.trashedPath);
    if (fs.existsSync(trashedDir)) {
      await showToast({
        style: Toast.Style.Animated,
        title: "Opening Trashed Directory",
      });
      await open(trashedDir);
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "Trashed Directory Not Found",
        message: `The directory for ${file.originalName} is missing from the trash.`,
      });
    }
  } catch (error) {
    console.error("Error revealing trashed path:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Reveal Failed",
      message: `Could not reveal the trashed directory for ${file.originalName}.`,
    });
  }
};
