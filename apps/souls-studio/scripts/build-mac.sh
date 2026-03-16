#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env.local
ENV_FILE="$PROJECT_DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env.local not found!"
    echo "Copy .env.local.example to .env.local and fill in your credentials:"
    echo "  cp .env.local.example .env.local"
    exit 1
fi

# Export variables from .env.local
set -a
source "$ENV_FILE"
set +a

# Validate required variables
REQUIRED_VARS=("APPLE_ID" "APPLE_PASSWORD" "APPLE_TEAM_ID" "APPLE_SIGNING_IDENTITY")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var is not set in .env.local"
        exit 1
    fi
done

echo "============================================"
echo "  Building Souls Studio for macOS"
echo "============================================"
echo ""
echo "Notarization credentials loaded from .env.local:"
echo "  APPLE_ID: $APPLE_ID"
echo "  APPLE_TEAM_ID: $APPLE_TEAM_ID"
echo "  APPLE_SIGNING_IDENTITY: $APPLE_SIGNING_IDENTITY"
echo ""
echo "Starting build with signing and notarization..."
echo ""

cd "$PROJECT_DIR"

# Build with Tauri (uses pnpm as configured in tauri.conf.json)
pnpm run tauri build -- --bundles dmg

echo ""
echo "============================================"
echo "  Build complete!"
echo "============================================"
echo ""
echo "DMG location: src-tauri/target/release/bundle/dmg/"
echo ""
ls -la "$PROJECT_DIR/src-tauri/target/release/bundle/dmg/" 2>/dev/null || echo "DMG not found - check build output above for errors"
