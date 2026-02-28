#!/bin/bash
# Deploy newsworthy as a systemd service on a Linux VPS.
# Run as a non-root user with sudo access.
# Usage: ./deploy.sh

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$APP_DIR/venv"
SERVICE_NAME="newsworthy"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
RUN_USER="$(whoami)"

# --- Pre-flight checks ---

if [ "$EUID" -eq 0 ]; then
    echo "Error: do not run this as root. Run as a regular user with sudo access."
    exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
    echo "Error: .env file not found."
    echo "  cp .env.example .env"
    echo "  # then edit .env and set your OpenAI API_KEY"
    exit 1
fi

if ! grep -q "^API_KEY=." "$APP_DIR/.env"; then
    echo "Error: API_KEY is not set in .env"
    exit 1
fi

command -v python3 >/dev/null 2>&1 || { echo "Error: python3 not found. Install it first."; exit 1; }

# --- Virtual environment ---

echo "Setting up Python virtual environment..."
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -r "$APP_DIR/requirements.txt"
echo "Dependencies installed."

# --- Bootstrap news.json ---
# The app crashes on the first request if news.json is missing.
# Create a placeholder and backdate it so the refresher triggers immediately
# on first use rather than waiting 5 minutes.

if [ ! -f "$APP_DIR/news.json" ]; then
    echo "Creating bootstrap news.json..."
    echo '{}' > "$APP_DIR/news.json"
    touch -d "10 minutes ago" "$APP_DIR/news.json"
fi

# --- Systemd service ---

echo "Installing systemd service to $SERVICE_FILE..."
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Newsworthy - News Sentiment Dashboard
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
ExecStart=$VENV_DIR/bin/python fetch.py
EnvironmentFile=$APP_DIR/.env
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# --- Done ---

echo ""
echo "Deployed. Service status:"
sudo systemctl status "$SERVICE_NAME" --no-pager -l
echo ""
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "Useful commands:"
echo "  sudo journalctl -u $SERVICE_NAME -f    # live logs"
echo "  sudo systemctl restart $SERVICE_NAME   # restart"
echo "  sudo systemctl stop $SERVICE_NAME      # stop"
