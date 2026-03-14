# GeoIntel-360 Deployment Guide (Ubuntu 24.04)

This guide covers the full process of migrating or deploying the GeoIntel-360 application onto a fresh Ubuntu 24.04 machine, utilizing GitHub, Cloudflare Tunnels, and proper `.env` configuration.

---

## 1. System Requirements & Prerequisites

Ensure your Ubuntu 24.04 machine is up to date and has the following installed:
- Git
- Python 3.12+ & pip
- Node.js (v18 or v20+) & npm
- Docker and Docker Compose (for Elasticsearch)

### Quick Setup:
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Git, Curl, and the uv package manager
sudo apt install -y git curl
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/env

# 3. Install Docker and Docker Compose
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# (Log out and log back in, or run `newgrp docker` to apply docker permissions)

# 4. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 2. Clone the Repository

Retrieve your project's code from GitHub:
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd GeoIntel-360  # Or whatever the cloned repository directory is named
```

---

## 3. Setup the Backend Environment

The backend handles the APIs, AI functionality, and Elasticsearch interactions.

### 3.1 Start Elasticsearch
Elasticsearch is defined in `docker-compose.yml`. Start it up as a detached background service:
```bash
sudo docker compose up -d
```
Verify it is running correctly:
```bash
curl http://localhost:9200
```

### 3.2 Initialize the Python Environment
Set up your virtual environment inside the `backend` folder using `uv`:
```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
# Alternatively, if avoiding the `requirements.txt` proxy entirely:
# uv sync # if using pyproject.toml
```

### 3.3 Configure the Backend `.env`
Create the `.env` file via copying an existing `.env.example` or creating a new one:
```bash
nano .env
```
Ensure it contains the Elasticsearch configuration and your API keys:
```env
# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200

# LLM Provider Configuration (Example)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# Other API keys (Cloudflare, Newsdata, etc...)
```

### 3.4 Start the Backend Server
Run Uvicorn. For a production environment, you might consider setting this up as a `systemd` service, but to start it manually:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## 4. Setup the Frontend Environment

Open a new terminal session, navigate to the project directory, and enter the `frontend` folder.

### 4.1 Install Node Dependencies
```bash
cd frontend
npm install
```

### 4.2 Configure the Frontend `.env`
Create the `.env` file so the React/Vite application knows where the secure backend API is located:
```bash
nano .env
```
Add the correct production public API URL:
```env
VITE_API_URL=https://api-intel.shipzee.org/api
```

### 4.3 Build and Serve the Frontend
Because we are using Vite, the `.env` variables are baked into the static files at build time. Whenever you change the URL, you **must rebuild**:
```bash
npm run build
```
Once built, use a static file server to host the `dist/` folder. For example, using the `serve` package:
```bash
npm install -g serve
serve -s dist -l 5173
```

---

## 5. Configure Cloudflare Tunnels (Crucial)

Since you moved to a new machine, Cloudflare needs to know how to route `https://intel.shipzee.org` and `https://api-intel.shipzee.org` to this **very machine**.

### 5.1 Install `cloudflared` on the New Machine
Download and install the Cloudflare Tunnel daemon for Ubuntu:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 5.2 Authenticate the Tunnel
1. Log into your **Cloudflare Zero Trust Dashboard** -> **Networks** -> **Tunnels**.
2. Select your existing tunnel and click **Configure**.
3. Under the "Choose your environment" section, select **Debian/Ubuntu**.
4. Copy the long connector command provided. It will look similar to this:
   ```bash
   sudo cloudflared service install eyJh...
   ```
5. Paste and run that command on your **new machine**.
6. Check the status to ensure it registered properly:
   ```bash
   sudo systemctl status cloudflared
   ```

### 5.3 Update Public Hostname IP Configurations
Because `cloudflared` is now installed and running directly on your **new machine**, it acts as a proxy for the local network. You no longer need to use `192.168.1.150` or `192.168.1.49` – Cloudflare communicates directly with `localhost`.

In the Cloudflare Zero Trust Dashboard -> Tunnels -> **Public Hostname**:
* Ensure **Frontend Route**: `intel.shipzee.org` points to `http://localhost:5173`
* Ensure **Backend Route**: `api-intel.shipzee.org` points to `http://localhost:8000`

---

## 6. Post-Deployment Checklist
1. Review the Cloudflare Tunnels dashboard, making sure the connector shows as "Healthy".
2. Ensure both the Python backend (`uvicorn`) and the frontend (`serve` or `npm run dev`) are actively running.
3. Advise all users or connected devices to **clear their browser cache** (`Ctrl + Shift + R` or `Cmd + Shift + R`). Failing to do so can result in browsers blocking requests due to cached HTTP requests (Mixed Content warnings).
