import { useState, useEffect } from "react";
import { ActionPanel, List, Action, Icon } from "@raycast/api";
import { TrashFile, getTrashFiles, isImageFile, toFileURI } from "../utils/trash";
import { recoverFile, deleteFilePermanently } from "../utils/fileOperations";
import { revealOriginalPath, revealTrashedPath } from "../utils/actions";

export default function Command() {
  const [trashFiles, setTrashFiles] = useState<TrashFile[]>([]);

  useEffect(() => {
    const loadTrashFiles = () => {
      const files = getTrashFiles();
      setTrashFiles(files);
    };
    loadTrashFiles();
  }, []);

  return (
    <List isShowingDetail>
      {trashFiles.length > 0 ? (
        trashFiles.map((file) => (
          <List.Item
            key={file.trashedName}
            title={file.originalName}
            icon={file.isDirectory ? Icon.Folder : Icon.Document}
            detail={
              <List.Item.Detail
                markdown={
                  isImageFile(file.originalName)
                    ? `![Preview](${toFileURI(file.trashedPath)})`
                    : `### ${file.originalName}\n\nNo preview available.`
                }
                metadata={
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label
                      title="Original Path"
                      text={file.originalPath}
                      icon={Icon.AppWindowSidebarLeft}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Trashed Path"
                      text={file.trashedPath}
                      icon={Icon.AppWindowSidebarLeft}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Size"
                      text={`${(file.size / 1024).toFixed(2)} KB`}
                      icon={Icon.Info}
                    />
                    <List.Item.Detail.Metadata.Label
                      title="Modified"
                      text={file.mtime.toLocaleString()}
                      icon={Icon.Calendar}
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
