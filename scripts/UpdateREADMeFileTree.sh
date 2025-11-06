#!/bin/bash
# Safely updates the "## Project Architecture" section in a Markdown file.

README_FILE=${1:-README.md}
BACKUP_FILE="${README_FILE}.bak"

# Ensure the file exists
if [ ! -f "$README_FILE" ]; then
    echo "Error: $README_FILE not found!"
    exit 1
fi

# Ensure 'tree' exists
if ! command -v tree >/dev/null 2>&1; then
    echo "Error: 'tree' command not found. Install it with: sudo apt install tree"
    exit 1
fi

# Backup the original README
cp "$README_FILE" "$BACKUP_FILE"
echo "Backup created at $BACKUP_FILE"

# Generate the directory tree (excluding common dirs)
TREE_OUTPUT=$(tree -I "node_modules|venv|test|__pycache__" -L 9)

# Escape slashes and ampersands for sed
ESCAPED_TREE=$(printf '%s\n' "$TREE_OUTPUT" | sed -e 's/[\/&]/\\&/g')

# Check if section exists
if grep -q "^## Project Architecture" "$README_FILE"; then
    # Replace existing section between headings
    sed -i -E "/^## Project Architecture/,/^## /{
    /^## Project Architecture/{
        p
        a\\
\`\`\`\\
$ESCAPED_TREE\\
\`\`\`
    }
    d
    }" "$README_FILE"
else
    # Append section if not present
    echo -e "\n## Project Architecture\n\n\`\`\`\n$TREE_OUTPUT\n\`\`\`\n" >> "$README_FILE"
fi

echo "README updated successfully!"
