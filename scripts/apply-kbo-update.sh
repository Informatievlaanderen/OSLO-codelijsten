#!/bin/bash
# filepath: scripts/apply-kbo-update.sh

set -e  # Exit on error

echo "=========================================="
echo "Applying KBO daily update"
echo "=========================================="

# Define variables
REPO_URL="git@github.com:Informatievlaanderen/OSLO-codelistgenerated.git"
REPO_BRANCH="KBO"
REPO_DIR="/tmp/OSLO-codelistgenerated"
UPDATE_DIR="/tmp/kbo-update/update"
FULL_DIR="/tmp/kbo-full/data"

# Validate required environment variables
for var in FTP_HOST FTP_PORT FTP_USER FTP_PASSWORD FTP_UPDATE_PATH FTP_FULL_PATH; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable '$var' is not set."
        exit 1
    fi
done

# Clean up any previous runs
echo "Cleaning up previous files..."
rm -rf "$REPO_DIR" "$UPDATE_DIR" "$FULL_DIR"
mkdir -p "$UPDATE_DIR" "$FULL_DIR"

# Clone the KBO branch of the generated repo
echo "Cloning OSLO-codelistgenerated ($REPO_BRANCH branch)..."
git clone --branch "$REPO_BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"

# Fetch update and full data zip files from FTP
echo "Fetching KBO data from FTP..."
lftp -u "$FTP_USER,$FTP_PASSWORD" -p "$FTP_PORT" sftp://"$FTP_HOST" -c "
  set net:timeout 30;
  set net:max-retries 3;
  set net:reconnect-interval-base 5;
  set sftp:connect-program 'ssh -a -x -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null';
  get1 $FTP_UPDATE_PATH -o /tmp/kbo-update.zip;
  get1 $FTP_FULL_PATH -o /tmp/kbo-full.zip;
  bye
"

if [ ! -f "/tmp/kbo-update.zip" ]; then
    echo "Error: Failed to download update zip from FTP."
    exit 1
fi

if [ ! -f "/tmp/kbo-full.zip" ]; then
    echo "Error: Failed to download full data zip from FTP."
    exit 1
fi

echo "Extracting zip archives..."
unzip -q /tmp/kbo-update.zip -d "$UPDATE_DIR"
unzip -q /tmp/kbo-full.zip -d "$FULL_DIR"

# Flatten if the zip extracted into a single subdirectory
for DIR in "$UPDATE_DIR" "$FULL_DIR"; do
    if [ "$(ls -1 "$DIR" | wc -l)" -eq 1 ] && [ -d "$DIR"/$(ls "$DIR") ]; then
        SUBDIR="$DIR/$(ls "$DIR")"
        mv "$SUBDIR"/* "$DIR/"
        rmdir "$SUBDIR"
    fi
done

if [ ! -f "$UPDATE_DIR/enterprise_insert.csv" ]; then
    echo "Error: enterprise_insert.csv not found in extracted update directory."
    exit 1
fi

if [ ! -f "$FULL_DIR/enterprise.csv" ]; then
    echo "Error: enterprise.csv not found in extracted full data directory."
    exit 1
fi

# Patch the full dataset with inserted enterprises from the update
echo "Applying enterprise inserts..."
cp "$UPDATE_DIR/enterprise_insert.csv" "$FULL_DIR/enterprise.csv"
echo "  ✓ enterprise.csv replaced with enterprise_insert.csv"

# Remove TTL files for deleted enterprises/establishments/branches
echo "Removing deleted TTL files..."
chmod +x "$(dirname "$0")/remove-deleted-ttl-files.sh"
"$(dirname "$0")/remove-deleted-ttl-files.sh" "$UPDATE_DIR" "$REPO_DIR/$REPO_BRANCH"

# Convert inserted enterprises to TTL
echo "Converting enterprises to TTL..."
oslo-company-to-ttl --input "$FULL_DIR" --output "$REPO_DIR/$REPO_BRANCH"

# Commit and push changes
echo "Committing and pushing changes..."
cd "$REPO_DIR"
git add -A

if git diff --cached --quiet; then
    echo "No changes to commit."
else
    git commit -m "chore: apply KBO update from $(date +%Y-%m-%d)"
    git push origin "$REPO_BRANCH"
    echo "  ✓ Changes pushed to $REPO_BRANCH"
fi

echo "=========================================="
echo "KBO update complete"
echo "=========================================="
