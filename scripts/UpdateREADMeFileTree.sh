#!/bin/bash
# update_project_architecture.sh
# Usage: ./update_project_architecture.sh [path_to_readme]

README_FILE=${1:-README.md}

# Ensure 'tree' is installed
if ! command -v tree &> /dev/null; then
    echo "Error: 'tree' command not found. Please install it (sudo apt install tree)."
    exit 1
fi

# Generate the new directory structure
NEW_TREE=$(tree -I "node_modules|venv|test|__pycache__" -L 9)

# Escape backticks and dollar signs for safe substitution
ESCAPED_TREE=$(printf '%s\n' "$NEW_TREE" | sed -e 's/\\/\\\\/g' -e 's/`/\\`/g' -e 's/\$/\\$/g')

# Use awk to replace the section in the markdown
awk -v new_tree="$ESCAPED_TREE" '
BEGIN { in_section=0 }
{
    if ($0 ~ /^## 📁 Project Architecture/) {
        print $0
        print ""
        print "```"
        print new_tree
        print "```"
        in_section=1
        next
    }
    if (in_section && /^## / && $0 !~ /^## 📁 Project Architecture/) {
        in_section=0
    }
    if (!in_section || /^## 📁 Project Architecture/) next
    print $0
}
' "$README_FILE" > "${README_FILE}.tmp" && mv "${README_FILE}.tmp" "$README_FILE"

echo "✅ Updated '## 📁 Project Architecture' section in $README_FILE"
