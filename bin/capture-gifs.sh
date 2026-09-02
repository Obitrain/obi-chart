#!/usr/bin/env bash

# DESCRIPTION
#   Records the example app demo screens on an iOS simulator and converts each
#   recording to an animated GIF in static/. Each screen is driven by the
#   obichart://<slug>?demo=1 deep link, which replays a scripted demo (useDemo).
#
# USAGE
#   bin/capture-gifs.sh [--skip-build] [--device "<simulator name>"] [<slug>...]
#
#     --skip-build          Reuse the app already installed on the simulator.
#     --device <name>       Simulator to use (default: "iPhone 15 Pro").
#     <slug>...             Screens to capture (default: all of them).
#
#   Requires Xcode with an iOS simulator, ffmpeg and jq.
#   DURATION=<seconds> overrides the recording length (default 9).
#
# EXAMPLES
#   bin/capture-gifs.sh
#   bin/capture-gifs.sh --skip-build dots line-chart
#   bin/capture-gifs.sh --device "iPhone 17 Pro"

set -euo pipefail

cd "$(dirname "$0")/.." || exit 1

# CocoaPods bails out on a non-UTF-8 locale.
export LANG="${LANG:-en_US.UTF-8}"

readonly ALL_SLUGS=(
    bottom-axis
    line-chart
    zoomable-line-chart
    dots
    advanced-chart
)

DEVICE_NAME='iPhone 15 Pro'
SKIP_BUILD=0
SLUGS=()
DURATION="${DURATION:-9}"

while [ $# -gt 0 ]; do
    case "$1" in
        --skip-build)
            SKIP_BUILD=1
            shift
            ;;
        --device)
            DEVICE_NAME="${2:?--device requires a simulator name}"
            shift 2
            ;;
        -h | --help)
            sed -n '3,21p' "$0"
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
        *)
            SLUGS+=("$1")
            shift
            ;;
    esac
done

if [ ${#SLUGS[@]} -eq 0 ]; then
    SLUGS=("${ALL_SLUGS[@]}")
fi

for _slug in "${SLUGS[@]}"; do
    if [[ " ${ALL_SLUGS[*]} " != *" $_slug "* ]]; then
        echo "Unknown screen: $_slug (known: ${ALL_SLUGS[*]})" >&2
        exit 1
    fi
done

for _cmd in xcrun jq ffmpeg node; do
    command -v "$_cmd" > /dev/null || {
        echo "$_cmd is required" >&2
        exit 1
    }
done

BUNDLE_ID=$(node -p "require('./example/app.json').expo.ios.bundleIdentifier")
readonly BUNDLE_ID
readonly UDID=$(xcrun simctl list devices available -j |
    jq --raw-output --arg name "$DEVICE_NAME" \
        '[.devices[][] | select(.name == $name)] | first | .udid // empty')

if [ -z "$UDID" ]; then
    echo "No available simulator named \"$DEVICE_NAME\"" >&2
    echo "Available: $(xcrun simctl list devices available -j | jq -r '[.devices[][].name] | unique | join(", ")')" >&2
    exit 1
fi

echo "Simulator: $DEVICE_NAME ($UDID)"
xcrun simctl boot "$UDID" 2> /dev/null || true
xcrun simctl bootstatus "$UDID" -b

xcrun simctl status_bar "$UDID" override \
    --time 9:41 \
    --batteryState charged \
    --batteryLevel 100 \
    --wifiBars 3 \
    --cellularBars 4

if [ "$SKIP_BUILD" -eq 0 ]; then
    echo "Building the example app (Release)..."
    (cd example && npx expo run:ios --configuration Release --no-bundler --device "$UDID")
fi

readonly TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p static

for _slug in "${SLUGS[@]}"; do
    echo "Capturing $_slug..."
    _video="$TMP_DIR/$_slug.mp4"

    xcrun simctl terminate "$UDID" "$BUNDLE_ID" 2> /dev/null || true
    xcrun simctl launch "$UDID" "$BUNDLE_ID" > /dev/null
    sleep 3

    xcrun simctl io "$UDID" recordVideo --codec h264 --force "$_video" &
    _recorder=$!
    sleep 1

    xcrun simctl openurl "$UDID" "obichart://$_slug?demo=1"
    sleep "$DURATION"

    kill -INT "$_recorder"
    wait "$_recorder" || true

    ffmpeg -loglevel error -y -i "$_video" \
        -vf "fps=15,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" \
        "static/$_slug.gif"
    echo "  -> static/$_slug.gif"
done

xcrun simctl status_bar "$UDID" clear
echo "Done."
