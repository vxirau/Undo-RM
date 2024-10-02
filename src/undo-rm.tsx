import { useState, useEffect } from "react";
import { ActionPanel, List, Action, Icon } from "@raycast/api";
import path from "path";

// Import modules and utilities
import { TrashFile, getTrashFiles, isImageFile, toFileURI, isTextOrCodeFile, readFileContent, isPDFFile, convertPDFToImage } from "./utils/trash"; 
import { recoverFile, deleteFilePermanently } from "./utils/fileOperations";
import { revealOriginalPath, revealTrashedPath } from "./utils/actions";

const ASSET_PATH = "/path/to/your/project/assets/";
const PLACEHOLDERS = {
  docx: `${ASSET_PATH}docx.png`,
  ppt: `${ASSET_PATH}ppt.png`,
  xlsx: `${ASSET_PATH}xlsx.png`,
  pdf: `${ASSET_PATH}pdf.png`,
  folder: `${ASSET_PATH}folder.png`,
  csv: `${ASSET_PATH}csv.png`,
  music: `${ASSET_PATH}music.png`,
  archive: `${ASSET_PATH}archive.png`,
  diskImage: `${ASSET_PATH}disk_image.png`,
  executable: `${ASSET_PATH}executable.png`,
  empty: `${ASSET_PATH}empty.png`,
  unknown: `${ASSET_PATH}unknown.png`,
};

function getPlaceholder(fileName: string, isDirectory: boolean): string {
  if (isDirectory) return PLACEHOLDERS.folder;

  const ext = path.extname(fileName).toLowerCase();

  if ([".docx", ".doc"].includes(ext)) return PLACEHOLDERS.docx;
  if ([".ppt", ".pptx"].includes(ext)) return PLACEHOLDERS.ppt;
  if ([".xls", ".xlsx"].includes(ext)) return PLACEHOLDERS.xlsx;
  if ([".txt",].includes(ext)) return PLACEHOLDERS.empty;
  if (ext === ".pdf") return PLACEHOLDERS.pdf;
  if (ext === ".csv") return PLACEHOLDERS.csv;
  if ([".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a"].includes(ext)) return PLACEHOLDERS.music;
  if ([".zip", ".tar", ".rar", ".7z", ".gz", ".bz2"].includes(ext)) return PLACEHOLDERS.archive;
  if ([".dmg", ".iso", ".bin"].includes(ext)) return PLACEHOLDERS.diskImage;
  if ([".exe", ".sh", ".bat", ".app"].includes(ext)) return PLACEHOLDERS.executable;

  // Default to unknown placeholder
  return PLACEHOLDERS.unknown;
}

function shortenFileName(fileName: string, maxLength: number): string {
  if (fileName.length <= maxLength) return fileName;
  return `${fileName.substring(0, maxLength)}...`;
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  // Convert the size to the most appropriate unit
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // Round to 2 decimal places, but omit ".00"
  return size % 1 === 0 ? `${size.toFixed(0)} ${units[unitIndex]}` : `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Main command component
export default function Command() {
  // State to hold trash files
  const [trashFiles, setTrashFiles] = useState<TrashFile[]>([]);

  // Load trash files on component mount
  useEffect(() => {
    const loadTrashFiles = () => {
      const files = getTrashFiles();
      setTrashFiles(files);
    };
    loadTrashFiles();
  }, []);

  // Render the Raycast UI
  return (
    <List isShowingDetail>
      {trashFiles.length > 0 ? (
        trashFiles.map((file) => (
          <List.Item
            key={file.trashedName}
            title={shortenFileName(file.originalName, 30)}
            icon={file.isDirectory ? Icon.Folder : Icon.Document}
            detail={
              <List.Item.Detail
              markdown={
                isImageFile(file.originalName)
                  ? `<img src="${toFileURI(file.trashedPath)}" alt="Image Preview" width="150" height="150" />`
                  : isTextOrCodeFile(file.originalName) && file.size > 0 ?
                  `### ${file.originalName}\n\n\`\`\`${path.extname(file.originalName).slice(1)}\n${readFileContent(file.trashedPath)}\n\`\`\``
                  : `<img src="${getPlaceholder(file.originalName, file.isDirectory)}" alt="File Placeholder" width="150" height="150" />`
              }
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label
                      title="Name"
                      text={file.originalName}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Size"
                      text={formatFileSize(file.size)}
                      icon={Icon.Info}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Modified"
                      text={file.mtime.toLocaleString()}
                      icon={Icon.Calendar}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Original Path"
                      text={file.originalPath}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Trashed Path"
                      text={file.trashedPath}
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
            actions={
              
              <ActionPanel>
                <Action
                  title="Recover File"
                  onAction={() => recoverFile(file, setTrashFiles)}
                  icon={Icon.ArrowClockwise}
                />
                <Action.Open
                  title="Open File"
                  target={file.trashedPath}
                  icon={Icon.Document}
                />
                <Action
                  title="Reveal Original Path"
                  onAction={() => revealOriginalPath(file)}
                  icon={Icon.Sidebar}
                />
                <Action
                  title="Reveal Trashed Path"
                  onAction={() => revealTrashedPath(file)}
                  icon={Icon.Sidebar}
                />
                <ActionPanel.Section>
                  <Action
                    title="Delete Permanently"
                    style={Action.Style.Destructive}
                    onAction={() => deleteFilePermanently(file, setTrashFiles)}
                    icon={Icon.Trash}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      ) : (
        <List.Item title="No files in trash" icon={Icon.Trash} />
      )}
    </List>
  );
}
