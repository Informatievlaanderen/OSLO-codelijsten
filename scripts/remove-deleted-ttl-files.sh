#!/bin/bash
# filepath: scripts/remove-deleted-ttl-files.sh
#
# Removes generated .ttl files that correspond to entries in the delete CSVs
# of a KBO update directory.
# The update directory gets uploaded daily and contains a list of records that should be deleted from the database, in our case the filedir.
#
# Usage:
#   ./scripts/remove-deleted-ttl-files.sh <update-dir> [output-dir]
#
# Example:
#   ./scripts/remove-deleted-ttl-files.sh ./KboOpenData_0273_2026_02_15_Update ./output

set -e

UPDATE_DIR="${1:?Usage: $0 <update-dir> [output-dir]}"
OUTPUT_DIR="${2:-./output}"

ORGANISATIONS_DIR="$OUTPUT_DIR/organisations"
BRANCHES_DIR="$OUTPUT_DIR/branches"

if [ ! -d "$UPDATE_DIR" ]; then
    echo "Error: Update directory '$UPDATE_DIR' does not exist."
    exit 1
fi

removed=0
missing=0

remove_ttl() {
    local file="$1"
    if [ -f "$file" ]; then
        rm "$file"
        echo "  Removed: $file"
        ((removed++)) || true
    else
        ((missing++)) || true
    fi
}

# --- enterprise_delete.csv → output/organisations/{EnterpriseNumber}.ttl ---
ENTERPRISE_DELETE="$UPDATE_DIR/enterprise_delete.csv"
if [ -f "$ENTERPRISE_DELETE" ]; then
    echo "Processing enterprise_delete.csv..."
    while IFS= read -r number; do
        [ -z "$number" ] && continue
        remove_ttl "$ORGANISATIONS_DIR/${number}.ttl"
    done < <(tail -n +2 "$ENTERPRISE_DELETE" | sed 's/^"//;s/"$//')
else
    echo "  Skipping enterprise_delete.csv (not found)"
fi

# --- establishment_delete.csv → output/branches/{EstablishmentNumber}.ttl ---
ESTABLISHMENT_DELETE="$UPDATE_DIR/establishment_delete.csv"
if [ -f "$ESTABLISHMENT_DELETE" ]; then
    echo "Processing establishment_delete.csv..."
    while IFS= read -r number; do
        [ -z "$number" ] && continue
        remove_ttl "$BRANCHES_DIR/${number}.ttl"
    done < <(tail -n +2 "$ESTABLISHMENT_DELETE" | sed 's/^"//;s/"$//')
else
    echo "  Skipping establishment_delete.csv (not found)"
fi

# --- branch_delete.csv → output/branches/{Id}.ttl ---
BRANCH_DELETE="$UPDATE_DIR/branch_delete.csv"
if [ -f "$BRANCH_DELETE" ]; then
    echo "Processing branch_delete.csv..."
    while IFS= read -r id; do
        [ -z "$id" ] && continue
        remove_ttl "$BRANCHES_DIR/${id}.ttl"
    done < <(tail -n +2 "$BRANCH_DELETE" | sed 's/^"//;s/"$//')
else
    echo "  Skipping branch_delete.csv (not found)"
fi

echo ""
echo "Done. Removed: $removed file(s). Enterprises already gone: $missing."
