# Undo RM

Undo RM is a powerful command-line utility designed to protect you from accidental file deletions. By safely moving files to a hidden trash directory rather than permanently deleting them, Undo RM replaces the traditional `rm` command, ensuring that you can easily recover deleted files whenever needed.

## Why Use Undo RM?

Accidentally deleting files with `rm` can lead to data loss and frustration. Undo RM offers an alternative: instead of permanently removing files, it moves them to a trash directory where they can be recovered. With Undo RM, your system will handle file deletions more safely, allowing you to undo deletions with ease.

## Features

- **Safe Deletion with `trash` Command**: Delete files and directories safely by moving them to a trash folder instead of removing them permanently.
- **Recovery with `recover` Command**: Easily restore deleted files from the trash directory, even if there are multiple versions of the same file.
- **Conflict Handling**: When recovering files, choose to either keep both versions, replace the existing file, or cancel the recovery process.
- **Full Compatibility with `rm`**: Alias the `rm` command to `trash` so that all deletions use the safe method by default.
- **Optional Force Delete**: Use `--delete` to bypass the trash system and remove files permanently when necessary.

## Installation

### Installing the Raycast Extension

This utility is available as a Raycast extension, making it easy to install and use directly from your Raycast command bar. You have two options to get started:

1. **Manual Installation**:
   - Clone or download the extension, and navigate to its directory in your terminal.
   - Run the following commands to install the dependencies and start the development server:
     ```bash
     npm install && npm run dev
     ```
   - The extension will now be available in your Raycast app.

2. **Search in the Raycast Store**:
   - Open the Raycast app, navigate to the **Store**, and search for "Undo RM".
   - Click "Install" to add the extension to your Raycast command list.

### Adding the Shell Functions

1. **Clone or Download the Script**: Place the `trash` and `recover` functions in a shell script or directly in your `.zshrc` or `.bashrc`.

2. **Source the Script in Your Shell Configuration**: 
   Add the following lines to your `.zshrc` or `.bashrc` file to enable the `trash` and `recover` commands:

   ```bash
   # Add trash function for safe deletion
   trash() {
        # Set trash directory and metadata file path
        TRASH_DIR="${HOME}/.rm_trash"
        TRASH_META="${TRASH_DIR}/.trashinfo"
        mkdir -p "$TRASH_DIR"
        touch "$TRASH_META"

        # Parse flags and arguments
        local force=0
        local recursive=0
        local direct_delete=0
        local args=()

        # Parse options
        while [[ "$1" ]]; do
            case "$1" in
            -f) force=1 ;;
            -r|-R) recursive=1 ;;
            --delete) direct_delete=1 ;;  # New flag to bypass trash
            --*) ;; # ignore any double-dash flags for simplicity
            -*) args+=("$1") ;; # collect all other flags
            *) args+=("$1") ;; # collect files or directories
            esac
            shift
        done

        # If no files or directories to delete, return
        if [[ "${#args[@]}" -eq 0 ]]; then
            echo "trash: missing file operand"
            return 1
        fi

        # Handle direct delete bypassing trash
        if [[ "$direct_delete" -eq 1 ]]; then
            command rm "${args[@]}"
            return
        fi

        # Move files/directories to trash and track original locations
        for file in "${args[@]}"; do
            if [[ -e "$file" ]]; then
            # Capture the full path before moving
            local original_path
            original_path="$(realpath "$file")"

            local filename
            filename="$(basename "$file")"
            local timestamp
            timestamp="$(date +%s)"

            # Create unique name in trash to avoid conflicts, preserving any special characters
            local trashed_file="${TRASH_DIR}/${filename}_${timestamp}"

            # Move file to trash safely
            mv -- "$file" "$trashed_file"

            # Record original location in metadata file, escaping paths safely
            printf "%s|%s\n" "$trashed_file" "$original_path" >> "$TRASH_META"
            else
            [[ "$force" -eq 0 ]] && echo "trash: cannot remove '$file': No such file or directory"
            fi
        done
        }

   # Add recover function for file restoration
    recover() {
        # Set trash directory and metadata file path
        TRASH_DIR="${HOME}/.rm_trash"
        TRASH_META="${TRASH_DIR}/.trashinfo"

        # Check if trash metadata exists
        if [[ ! -f "$TRASH_META" ]]; then
            echo "recover: No files found in trash."
            return 1
        fi

        # If no argument is provided, return an error
        if [[ -z "$1" ]]; then
            echo "recover: missing file operand"
            return 1
        fi

        local recover_name="$1"
        local matches

        # Look for all matching entries in the metadata file
        matches=$(grep "|.*/$recover_name" "$TRASH_META")

        # If no match is found, return an error
        if [[ -z "$matches" ]]; then
            echo "recover: '$recover_name' not found in trash"
            return 1
        fi

        # Count the number of matches
        local count
        count=$(echo "$matches" | wc -l)

        if [[ "$count" -gt 1 ]]; then
            echo "Multiple entries named '$recover_name' found in the trash. Please select which to recover:"
            echo

            # List all matches with details for user to choose
            local index=1
            while IFS= read -r line; do
            trashed_file=$(echo "$line" | cut -d '|' -f 1)
            original_path=$(echo "$line" | cut -d '|' -f 2)

            # Extract deletion timestamp from the trashed filename
            timestamp=$(basename "$trashed_file" | sed "s/^${recover_name}_//")
            deletion_date=$(date -r "$timestamp" +"%Y-%m-%d %H:%M:%S")

            echo "$index) Original Path: $original_path"
            echo "   Deletion Date: $deletion_date"
            echo

            ((index++))
            done <<< "$matches"

            # Ask user for selection
            echo -n "Enter the number of the entry to recover: "
            read -r selection

            # Validate user selection
            if ! [[ "$selection" =~ ^[0-9]+$ ]] || ((selection < 1 || selection > count)); then
            echo "Invalid selection."
            return 1
            fi

            # Get the chosen match
            match=$(echo "$matches" | sed -n "${selection}p")

        else
            # Only one match found, use it directly
            match="$matches"
        fi

        # Extract the trashed file path and original path from the chosen match
        trashed_file=$(echo "$match" | cut -d '|' -f 1)
        original_path=$(echo "$match" | cut -d '|' -f 2)

        # Ensure the trashed file exists
        if [[ ! -e "$trashed_file" ]]; then
            echo "recover: file '$trashed_file' is missing from trash"
            return 1
        fi

        # Create the original directory structure if it doesn't exist
        mkdir -p "$(dirname "$original_path")"

        # Check if the recovered file or folder already exists
        if [[ -e "$original_path" ]]; then
            # Handle existing file/folder
            echo "An entry named '$recover_name' already exists in the target directory. Please select an action:"
            echo

            echo "1) Keep Both"
            echo "2) Replace Existing"
            echo "3) Cancel Recovery"
            echo

            # Ask user for selection
            echo -n "Enter the number of the action to perform: "
            read -r selection

            # Validate user selection
            if ! [[ "$selection" =~ ^[1-3]$ ]]; then
            echo "Invalid selection."
            return 1
            fi

            case "$selection" in
            1)
                # Move the file/folder back with a unique name
                mv -- "$trashed_file" "${original_path}_restored"
                ;;
            2)
                # Replace the existing entry
                rm -rf -- "$original_path"
                mv -- "$trashed_file" "$original_path"
                ;;
            3)
                # Cancel recovery
                echo "Recovery cancelled."
                return 1
                ;;
            esac
        else
            # Move the file/folder back to its original location
            mv -- "$trashed_file" "$original_path"
        fi

        # Remove the line from the metadata file
        grep -Fv "$match" "$TRASH_META" > "${TRASH_META}.tmp" && mv "${TRASH_META}.tmp" "$TRASH_META"

        mv "${TRASH_META}.tmp" "$TRASH_META"

        # Remove the metadata file if it is empty
        if [[ ! -s "$TRASH_META" ]]; then
            rm -f "$TRASH_META"
        fi

        echo "recover: '$recover_name' has been restored to '$original_path'."
    }
   ```

3. **Alias `rm` to `trash`**:
   To make sure all file deletions are safely handled, alias the `rm` command to `trash` by adding this line to your `.zshrc` or `.bashrc`:

   ```bash
   alias rm='trash'
   ```

   Now, any time you use `rm` to delete a file, it will be moved to the trash directory instead of being permanently removed.

4. **Reload Your Shell Configuration**:
   To apply the changes, reload your shell configuration:

   ```bash
   source ~/.zshrc  # or ~/.bashrc
   ```

## Usage

### Safe Deletion with `trash`

To safely delete files or directories, use the `trash` command as follows:

```bash
trash file1.txt folder1/
```

This will move `file1.txt` and `folder1/` to the trash directory (`~/.rm_trash`) for safe keeping. If you have aliased `rm` to `trash`, you can use `rm` in the same way.

#### Force and Recursive Deletion

- **Force Delete (`-f`)**: Ignore nonexistent files and do not prompt for confirmation.
- **Recursive Delete (`-r` or `-R`)**: Recursively delete directories and their contents.
- **Direct Delete (`--delete`)**: Permanently delete files, bypassing the trash.

Example:
```bash
trash -f -r folder2/
trash --delete file2.txt  # Permanently deletes `file2.txt`
```

### Recovering Deleted Files

To restore a deleted file from the trash, use the `recover` command:

```bash
recover file1.txt
```

If multiple versions of the file exist in the trash, the `recover` command will list the different versions, allowing you to select the correct one to restore.

When a conflict arises (e.g., a file with the same name already exists in the original location), you can choose to:
1. **Keep Both**: Recover the file with a unique name.
2. **Replace Existing**: Overwrite the existing file.
3. **Cancel Recovery**: Cancel the recovery process.

## Advanced Functionality

- **Metadata Tracking**: Deleted files are stored with a timestamped name to avoid conflicts, and their original path is saved in a `.trashinfo` file within the trash directory.
- **Trash Directory Location**: All trashed files are stored in `~/.rm_trash`. You can inspect this directory manually if needed.
- **Automatic Cleanup**: If you manually remove files from `~/.rm_trash`, you can clean up the `.trashinfo` file to ensure it only tracks existing files.

## Contributing

Feel free to suggest enhancements or report bugs. If you have ideas for new features or ways to improve the current functionality, please open an issue or submit a pull request.

---

By using Undo RM, you'll protect your data from accidental deletions, enabling you to recover files easily and with confidence. Say goodbye to the anxiety of using `rm`—with Undo RM, safe deletion is just a command away!