#!/bin/bash
# filepath: scripts/fetch-and-convert-OVO.sh

set -e  # Exit on error

# Parse command-line arguments
OUTPUT_DIR="${1:-/tmp/output/organisations}"
JSON_FILE="${2:-/tmp/organisaties.json}"

echo "=========================================="
echo "Fetching organizations from Wegwijs API"
echo "=========================================="

# Define variables
API_URL="https://api.wegwijs.vlaanderen.be/v1/powerbi/search/organisations"
REPO_URL="git@github.com:Informatievlaanderen/OSLO-codelistgenerated.git"
REPO_BRANCH="OVO"
REPO_DIR="./OSLO-codelistgenerated"

# Clean up previous files
echo "Cleaning up previous files..."
rm -f "$JSON_FILE"
rm -rf "$OUTPUT_DIR"
rm -rf "$REPO_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Download organizations from Wegwijs API
echo "Downloading organizations from Wegwijs API..."
echo "This may take a while..."
curl -s --progress-bar -o "$JSON_FILE" "$API_URL"

if [ ! -f "$JSON_FILE" ]; then
    echo "Error: Failed to download organizations from API"
    exit 1
fi

# Check if file is valid JSON
if ! jq empty "$JSON_FILE" 2>/dev/null; then
    echo "Error: Downloaded file is not valid JSON"
    exit 1
fi

TOTAL_ORGS=$(jq '. | length' "$JSON_FILE")
echo "✓ Successfully downloaded $TOTAL_ORGS organizations"

# Check if converter is installed
if ! command -v oslo-org-to-ttl &> /dev/null; then
    echo "Installing @oslo-flanders/org-to-ttl-converter..."
    npm install -g @oslo-flanders/org-to-ttl-converter
fi

# Convert JSON to TTL files
echo "=========================================="
echo "Converting organizations to TTL format"
echo "=========================================="

oslo-org-to-ttl --input "$JSON_FILE" --output "$OUTPUT_DIR"

if [ $? -ne 0 ]; then
    echo "Error: Conversion failed"
    exit 1
fi

echo "✓ Conversion completed successfully"

# Configure git
echo "=========================================="
echo "Configuring Git"
echo "=========================================="

git config --global user.name "OSLO-support"
git config --global user.email "OSLO-support@vlaanderen.be"

# Clone the target repository using SSH
echo "=========================================="
echo "Cloning target repository"
echo "=========================================="

git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"

if [ $? -ne 0 ]; then
    echo "Error: Failed to clone repository"
    exit 1
fi

cd "$REPO_DIR"

# Copy TTL files to repository
echo "=========================================="
echo "Copying TTL files to repository"
echo "=========================================="

# Create OVO directory if it doesn't exist
mkdir -p OVO

# Remove old TTL files
echo "Removing old TTL files..."
rm -f OVO/*.ttl

# Copy all TTL files
echo "Copying new TTL files..."
find "$OUTPUT_DIR" -name "*.ttl" -type f -print0 | xargs -0 -I {} cp {} OVO/

TTL_COUNT=$(find OVO -name "*.ttl" -type f | wc -l)
echo "✓ Copied $TTL_COUNT TTL files"

# Check if there are changes
if [[ -z $(git status -s) ]]; then
    echo "No changes detected. Nothing to commit."
    cd ..
    exit 0
fi

# Add, commit and push changes
echo "=========================================="
echo "Committing and pushing changes"
echo "=========================================="

# Add files in batches to avoid argument list too long
find OVO -name "*.ttl" -type f -print0 | xargs -0 git add

# Get statistics
ADDED=$(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')
DELETED=$(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')

git commit -m "Update OVO organizations ($(date +'%Y-%m-%d %H:%M:%S'))

- Total organizations: $TOTAL_ORGS
- TTL files: $TTL_COUNT
- Lines added: $ADDED
- Lines removed: $DELETED

Generated from Wegwijs API via CircleCI"

git push origin "$REPO_BRANCH"

if [ $? -eq 0 ]; then
    echo "✓ Successfully pushed changes to GitHub"
else
    echo "Error: Failed to push changes"
    exit 1
fi

# Cleanup
cd ..
rm -rf "$REPO_DIR"
rm -f "$JSON_FILE"

echo "=========================================="
echo "Process completed successfully!"
echo "=========================================="
echo "Summary:"
echo "  - Downloaded: $TOTAL_ORGS organizations"
echo "  - Converted: $TTL_COUNT TTL files"
echo "  - Repository: https://github.com/Informatievlaanderen/OSLO-codelistgenerated/tree/$REPO_BRANCH/OVO"
echo "=========================================="
