# MeetingHub — Nginx + SSL Setup Guide

Domain: `meetin.space`

## Prerequisites

- A VPS/server with a public IP
- SSH access to the server
- DNS access to `meetin.space`
- Docker & Docker Compose installed on the server
- The MeetingHub repo cloned on the server

---

## Step 1 — DNS Records

Go to your domain registrar / DNS provider and create these A records, all pointing to your server's public IP:

```
Type   Name       Value            TTL
A      @          <YOUR_SERVER_IP>  300
A      api        <YOUR_SERVER_IP>  300
A      livekit    <YOUR_SERVER_IP>  300
A      auth       <YOUR_SERVER_IP>  300
```

Verify propagation:
```bash
dig +short meetin.space
dig +short api.meetin.space
dig +short livekit.meetin.space
dig +short auth.meetin.space
```

All four should return your server IP. Wait until they do before proceeding.

---

## Step 2 — Install Nginx & Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## Step 3 — Open Firewall Ports

```bash
sudo ufw allow 80/tcp       # HTTP (Certbot + redirect)
sudo ufw allow 443/tcp      # HTTPS
sudo ufw allow 3478/udp     # TURN/STUN
sudo ufw allow 5349/tcp     # TURNS (TLS)
sudo ufw allow 7881/tcp     # LiveKit TURN TCP fallback
sudo ufw allow 7882:7892/udp  # WebRTC media
sudo ufw reload
```

---

## Step 4 — Deploy the Initial Nginx Config (HTTP only)

This minimal config just serves the ACME challenge so Certbot can verify domain ownership.

```bash
sudo cp /path/to/MeetingHub/nginx/nginx.initial.conf /etc/nginx/sites-available/meetinghub
sudo ln -sf /etc/nginx/sites-available/meetinghub /etc/nginx/sites-enabled/meetinghub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Verify it works:
```bash
curl http://meetin.space
# Should return: MeetingHub — waiting for SSL setup
```

---

## Step 5 — Generate SSL Certificates

```bash
sudo certbot
```

Select the 4 meetin.space domains, choose **1 (No redirect)** — our full config handles redirects.

---

## Step 6 — Deploy SSL Snippet + Full Nginx Config

```bash
sudo cp /path/to/MeetingHub/nginx/ssl-params.conf /etc/nginx/snippets/ssl-params.conf
sudo cp /path/to/MeetingHub/nginx/nginx.conf /etc/nginx/sites-available/meetinghub
sudo nginx -t
sudo systemctl reload nginx
```

Verify:
```bash
curl -I https://meetin.space       # 502 = OK (frontend not running yet)
curl -I https://api.meetin.space   # 502 = OK (backend not running yet)
```

---

## Step 7 — Auto-Renewal Hook

```bash
sudo bash -c 'cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << "EOF"
#!/bin/bash
systemctl reload nginx
EOF'
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
```

---

## Step 8 — LiveKit TURN TLS

Uncomment the cert lines in `livekit.yaml`:

```yaml
turn:
  enabled: true
  domain: meetin.space
  tls_port: 5349
  udp_port: 3478
  cert_file: /etc/letsencrypt/live/meetin.space/fullchain.pem
  key_file: /etc/letsencrypt/live/meetin.space/privkey.pem
```

Mount certs into the LiveKit container (root `docker-compose.yml`):

```yaml
livekit:
  volumes:
    - ./livekit.yaml:/etc/livekit.yaml
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

---

## Step 9 — Update Production Env Vars

**Backend `.env`:**
```env
FRONTEND_URL=https://meetin.space
SUPABASE_URL=https://auth.meetin.space
LIVEKIT_URL=https://livekit.meetin.space
LIVEKIT_PUBLIC_URL=wss://livekit.meetin.space
```

**Frontend `.env.production`:**
```env
VITE_BACKEND_API_URL=https://api.meetin.space
VITE_SUPABASE_URL=https://auth.meetin.space
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LIVEKIT_URL=wss://livekit.meetin.space
```

**Agent `.env`:**
```env
LIVEKIT_URL=ws://livekit:7880
```
(Agent uses internal Docker network — no TLS needed)

---

## Step 10 — Port Mapping (Shared VPS)

MeetingHub runs alongside other services on the same VPS. To avoid conflicts:

| Service | Host port | Container port | Notes |
|---------|-----------|---------------|-------|
| Frontend | **3001** | 3000 | 3000 used by vanlog |
| Backend | **6002** | 6001 | 6001 used by vanlog |
| Redis | **6380** | 6379 | clean separation |
| Supabase Kong | 8000 | 8000 | shared, already running |
| PostgreSQL | 5432 | 5432 | shared, already running |
| LiveKit | 7880 | 7880 | no conflict |
| TURN/STUN | 3478/udp | 3478 | no conflict |
| TURNS TLS | 5349 | 5349 | no conflict |
| LibreTranslate | 5555 | 5000 | no conflict |

Nginx upstreams point to `127.0.0.1:3001` (frontend) and `127.0.0.1:6002` (backend).

---

## Step 11 — Start MeetingHub Services

Supabase is already running and shared. Only start MeetingHub-specific services:

```bash
# Create the shared Docker network (if not already)
docker network create network 2>/dev/null || true

# Start infrastructure (LiveKit, Redis, Egress, LibreTranslate)
cd ~/MeetingHub
docker compose -f docker-compose.yml up -d

# Start backend
cd backend && docker compose -f docker-compose.prod.yaml up -d && cd ..

# Build and start frontend (production)
cd frontend && docker compose --profile prod up -d && cd ..

# Start agent (optional — needs GPU/CPU for Whisper)
cd agent && docker compose up -d && cd ..
```

---

## Step 12 — Verify

```bash
curl -I https://meetin.space          # 200
curl -I https://api.meetin.space/api  # 200 (Swagger)
curl https://auth.meetin.space/rest/v1/ -H "apikey: your-anon-key"  # JSON
```

TURN test from another machine: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
- `turn:meetin.space:3478` (UDP)
- `turns:meetin.space:5349` (TLS)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Certbot "Could not connect" | Check DNS propagation + port 80 open |
| 502 Bad Gateway | Upstream service not running — check `docker ps` |
| LiveKit clients can't connect | Check UDP ports 3478, 7882-7892 are open |
| WebSocket 400 | Check no CDN stripping upgrade headers |
| Port already in use | Check `docker ps` for conflicts, update host port mapping |
