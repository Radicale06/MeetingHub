# MeetingHub — Nginx + SSL Setup

Domain: `meetin.space`

---

## Step 1 — DNS Records

Create 4 A records pointing to your server IP:

```
Type   Name       Value
A      @          <YOUR_SERVER_IP>
A      api        <YOUR_SERVER_IP>
A      livekit    <YOUR_SERVER_IP>
A      auth       <YOUR_SERVER_IP>
```

Verify:
```bash
dig +short meetin.space
dig +short api.meetin.space
dig +short livekit.meetin.space
dig +short auth.meetin.space
```

Wait until all four return your server IP before proceeding.

---

## Step 2 — Open Firewall Ports

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 7881/tcp
sudo ufw allow 7882:7892/udp
sudo ufw reload
```

---

## Step 3 — Deploy Initial Nginx Config (HTTP only)

```bash
sudo cp /path/to/MeetingHub/nginx/nginx.initial.conf /etc/nginx/sites-available/meetinghub
sudo ln -sf /etc/nginx/sites-available/meetinghub /etc/nginx/sites-enabled/meetinghub
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Verify:
```bash
curl http://meetin.space
# Should return: MeetingHub — waiting for SSL setup
```

---

## Step 4 — Generate SSL Certificates

```bash
sudo certbot
```

Certbot will interactively detect your nginx server blocks, ask which domains to secure — select all four:
1. `meetin.space`
2. `api.meetin.space`
3. `livekit.meetin.space`
4. `auth.meetin.space`

It handles everything: generates certs, updates nginx config with SSL directives, and reloads nginx.

---

## Step 5 — Deploy Full Nginx Config

After certbot succeeds, replace the certbot-modified config with the production one:

```bash
sudo cp /path/to/MeetingHub/nginx/ssl-params.conf /etc/nginx/snippets/ssl-params.conf
sudo cp /path/to/MeetingHub/nginx/nginx.conf /etc/nginx/sites-available/meetinghub
sudo nginx -t
sudo systemctl reload nginx
```

Verify:
```bash
curl -I https://meetin.space       # 502 is OK (frontend not running yet)
curl -I https://api.meetin.space   # 502 is OK (backend not running yet)
```

No SSL errors = success.

---

## Step 6 — Auto-Renewal Hook

```bash
sudo bash -c 'cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << "EOF"
#!/bin/bash
systemctl reload nginx
EOF'
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
```

---

## Step 7 — LiveKit TURN TLS

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

## Step 8 — Update Production Env Vars

**Backend `.env`:**
```
FRONTEND_URL=https://meetin.space
SUPABASE_URL=https://auth.meetin.space
LIVEKIT_WS_URL=wss://livekit.meetin.space
LIVEKIT_HTTP_URL=https://livekit.meetin.space
```

**Frontend `.env.production`:**
```
VITE_BACKEND_API_URL=https://api.meetin.space
VITE_SUPABASE_URL=https://auth.meetin.space
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LIVEKIT_URL=wss://livekit.meetin.space
```

---

## Step 9 — Start Services

```bash
docker network create network

# Infrastructure
docker compose -f docker-compose.yml up -d

# Supabase
cd supabase && docker compose up -d && cd ..

# Backend
cd backend && docker compose -f docker-compose.prod.yaml up -d && cd ..

# Frontend
cd frontend && docker compose --profile prod up -d && cd ..

# Agent
cd agent && docker compose up -d && cd ..
```

---

## Step 10 — Verify

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
