---
name: Infrastructure details
description: Hostinger VPS specs, IP, container setup, deploy paths
type: project
---

- **Provider:** Hostinger KVM 8 — 32GB RAM, 8 cores, 400GB
- **IP:** 76.13.170.42
- **SSH:** root@76.13.170.42 (ed25519 key from local PC)
- **Repo on VPS:** /opt/doctor-auto-ai
- **Env file:** /opt/doctor-auto-ai/.env.production
- **Containers:** Caddy (:80/:443), Gateway (:3001), Python Agents (:8000), ChromaDB
- **Dashboard URL:** http://76.13.170.42
- **Health endpoint:** http://76.13.170.42/api/health
- **OpenClaw:** runs on port 18789 (needs reinstall)
- **Domain planned:** ai.doctorautoprime.com (not configured yet)
- **Caddy:** currently HTTP only, will switch to HTTPS when domain is set

**Why:** Need quick reference for deploy commands and server access.
**How to apply:** Use these details when doing remote operations or troubleshooting.
