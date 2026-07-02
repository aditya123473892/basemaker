# Redis Deployment Guide

## Do You Need Redis?

**Short answer: No, Redis is optional but highly recommended for production.**

The RBAC system is designed to work in two modes:

1. **With Redis** (Recommended for production, multi-server, or high-traffic)
   - Distributed caching across multiple servers
   - Real-time cache invalidation via events
   - Better performance under load
   - Shared cache state

2. **Without Redis** (Development, single-server, or low-traffic)
   - Automatic fallback to in-memory cache
   - No performance degradation
   - Works out of the box
   - Zero configuration needed

## When to Use Redis

### ✅ Use Redis When:

- Running multiple server instances (load balancing)
- High traffic application (>1000 concurrent users)
- Need real-time cache invalidation across servers
- Production environment with scaling requirements

### ❌ Skip Redis When:

- Single server deployment
- Development/testing environment
- Low traffic (<100 concurrent users)
- Quick prototyping or MVP

---

## Option 1: No Redis (Zero Config)

The system automatically uses in-memory caching. No action needed.

**Configuration:**

```env
# .env file
# Don't set REDIS_URL or leave it as default
# REDIS_URL=redis://localhost:6379
```

**Result:** Each server instance has its own cache. Works perfectly for single-server deployments.

---

## Option 2: Redis Deployment

### A. Docker (Recommended for Quick Setup)

**1. Create `docker-compose.yml` in project root:**

```yaml
version: "3.8"

services:
  redis:
    image: redis:7-alpine
    container_name: fleet-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    command: redis-server --appendonly yes
    networks:
      - fleet-network

  # Optional: Redis Commander (Web UI for managing Redis)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: fleet-redis-commander
    restart: always
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
      - REDIS_PASSWORD=${REDIS_PASSWORD:-}
    depends_on:
      - redis
    networks:
      - fleet-network

volumes:
  redis_data:

networks:
  fleet-network:
```

**2. Update `.env` file:**

```env
REDIS_URL=redis://localhost:6379
# If password set:
# REDIS_URL=redis://:yourpassword@localhost:6379
```

**3. Start Redis:**

```bash
docker-compose up -d redis
```

**4. Verify Redis is running:**

```bash
docker-compose ps
# Should show redis container as "Up"

# Test connection
docker exec -it fleet-redis redis-cli ping
# Should return: PONG
```

---

### B. Windows (Local Development)

**1. Download Redis for Windows:**

```powershell
# Using Chocolatey
choco install redis

# Or download from: https://github.com/microsoftarchive/redis/releases
```

**2. Start Redis service:**

```powershell
# Start Redis server
redis-server

# Or as Windows service (run as Administrator)
redis-server --service-start
```

**3. Verify:**

```powershell
redis-cli ping
# Should return: PONG
```

**4. Update `.env`:**

```env
REDIS_URL=redis://localhost:6379
```

---

### C. Linux (Ubuntu/Debian)

**1. Install Redis:**

```bash
sudo apt update
sudo apt install redis-server
```

**2. Start and enable Redis:**

```bash
sudo systemctl start redis
sudo systemctl enable redis
```

**3. Verify:**

```bash
redis-cli ping
# Should return: PONG
```

**4. Update `.env`:**

```env
REDIS_URL=redis://localhost:6379
```

---

### D. Redis Cloud (Managed Redis)

For production, consider managed Redis services:

**1. Redis Cloud (https://redis.com/cloud/)**

- Free tier: 30MB
- Sign up and get connection URL

**2. AWS ElastiCache**

- Managed Redis on AWS

**3. Google Cloud Memorystore**

- Managed Redis on GCP

**4. Azure Cache for Redis**

- Managed Redis on Azure

**Update `.env` with provided URL:**

```env
REDIS_URL=redis://username:password@redis-cloud.example.com:6379
```

---

## Deployment Environments

### Development

```env
# .env.development
REDIS_URL=redis://localhost:6379

# Optional: Disable Redis entirely for simpler debugging
# Comment out REDIS_URL to use in-memory cache
```

### Production

```env
# .env.production
REDIS_URL=redis://prod-redis.example.com:6379
# Or with authentication:
REDIS_URL=redis://:strongpassword@prod-redis.example.com:6379
```

### Docker Production

```yaml
# docker-compose.prod.yml
services:
  backend:
    build: .
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    command: redis-server --requirepass ${REDIS_PASSWORD}

volumes:
  redis_data:
```

---

## Configuration Options

### Redis in `app.ts` (Already Configured)

```typescript
import { redisCacheService } from "./services/redisCacheService";

// The service automatically:
// - Connects to Redis on startup
// - Falls back to in-memory cache if Redis unavailable
// - Retries connection with exponential backoff
// - Logs connection status
```

### Environment Variables

```env
# Required
JWT_SECRET=your-jwt-secret-here

# Optional - Redis Configuration
REDIS_URL=redis://localhost:6379           # Redis connection string
REDIS_PASSWORD=yourpassword                # If Redis has authentication

# Database (required)
DATABASE_URL=sqlserver://localhost:1433;database=fleet_management;...

# Other
NODE_ENV=production
PORT=4000
```

---

## Testing Redis Connection

### 1. Health Check Endpoint

Create a health check endpoint (optional):

```typescript
// backend/src/routes/health.ts
router.get("/redis", async (req, res) => {
  try {
    const isAvailable = await redisCacheService.isAvailable();
    const stats = await redisCacheService.getStats();
    res.json({
      success: true,
      redis: isAvailable,
      stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Manual Test

```bash
# Start Redis
docker-compose up -d redis

# Start backend
npm run dev

# In another terminal, test cache
curl http://localhost:4000/api/security/registry

# Check Redis
docker exec -it fleet-redis redis-cli
127.0.0.1:6379> KEYS permissions:*
# Should show cached permissions

127.0.0.1:6379> DBSIZE
# Should show number of cached keys
```

---

## Monitoring Redis

### Redis CLI Commands

```bash
# Connect to Redis
redis-cli

# Check if Redis is running
127.0.0.1:6379> PING
PONG

# View all keys
127.0.0.1:6379> KEYS *

# Check cache hit rate
127.0.0.1:6379> INFO stats
# Look for "keyspace_hits" and "keyspace_misses"

# Monitor commands in real-time
127.0.0.1:6379> MONITOR

# Check memory usage
127.0.0.1:6379> INFO memory
```

### Redis Commander (Web UI)

Access web UI at `http://localhost:8081` if using docker-compose:

```yaml
redis-commander:
  image: rediscommander/redis-commander:latest
  ports:
    - "8081:8081"
```

---

## Security Configuration

### 1. Enable Redis Authentication

```bash
# redis.conf
requirepass your-strong-password-here

# Or via command line
redis-server --requirepass your-strong-password-here
```

Update `.env`:

```env
REDIS_URL=redis://:your-strong-password-here@localhost:6379
```

### 2. Bind to Localhost Only (Development)

```bash
# redis.conf
bind 127.0.0.1
```

### 3. Production Network Security

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    networks:
      - backend-network # Internal network only
    # Don't expose port 6379 publicly in production
    # Use internal Docker network
```

---

## Performance Tuning

### Redis Configuration (`redis.conf`)

```conf
# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru  # Evict least recently used keys

# Persistence (optional, for cache it's okay to disable)
save 900 1      # Save after 15 minutes if 1 key changed
save 300 10     # Save after 5 minutes if 10 keys changed
save 60 10000   # Save after 1 minute if 10000 keys changed

# Network
tcp-backlog 511
timeout 0

# Security
requirepass your-strong-password
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

### Docker Compose with Custom Config

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
```

---

## Troubleshooting

### Problem: "Redis connection refused"

**Solution:**

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
docker-compose up -d redis
# OR
redis-server
```

### Problem: "NOAUTH Authentication required"

**Solution:**

```bash
# Update REDIS_URL with password
REDIS_URL=redis://:password@localhost:6379
```

### Problem: "Connection timeout"

**Solution:**

```bash
# Check Redis logs
docker logs fleet-redis

# Verify port is accessible
telnet localhost 6379

# Check firewall rules
sudo ufw allow 6379  # Linux
```

### Problem: "High memory usage"

**Solution:**

```bash
# Set memory limit in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru

# Check current memory usage
redis-cli INFO memory
```

---

## Kubernetes Deployment

### 1. Deploy Redis with Helm

```bash
# Add Bitnami repo
helm repo add bitnami https://charts.bitnami.com/bitnami

# Install Redis
helm install fleet-redis bitnami/redis \
  --set auth.password=yourpassword \
  --set master.persistence.size=8Gi
```

### 2. Get Redis Connection Details

```bash
# Get Redis host
kubectl get svc fleet-redis-master

# Update .env
REDIS_URL=redis://:yourpassword@fleet-redis-master:6379
```

### 3. Kubernetes Secret (Production)

```yaml
# kubernetes/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: fleet-secrets
type: Opaque
stringData:
  REDIS_URL: "redis://:password@fleet-redis-master:6379"
  DATABASE_URL: "sqlserver://..."
  JWT_SECRET: "your-jwt-secret"
```

---

## Cloud Provider Specific Guides

### AWS ElastiCache

1. **Create Redis cluster:**
   - AWS Console → ElastiCache → Redis
   - Choose cluster mode enabled
   - Set security groups

2. **Get connection endpoint:**

   ```
   fleet-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379
   ```

3. **Update `.env`:**
   ```env
   REDIS_URL=redis://fleet-redis.xxxxxx.0001.use1.cache.amazonaws.com:6379
   ```

### Google Cloud Memorystore

1. **Create Redis instance:**
   - GCP Console → Memorystore → Redis
   - Set memory size and network

2. **Get IP address:**

   ```
   10.0.0.3:6379
   ```

3. **Update `.env`:**
   ```env
   REDIS_URL=redis://10.0.0.3:6379
   ```

### Azure Cache for Redis

1. **Create Azure Redis Cache:**
   - Azure Portal → Create Resource → Redis Cache
   - Set SKU and size

2. **Get connection string:**

   ```
   fleetredis.redis.cache.windows.net:6380
   ```

3. **Update `.env`:**
   ```env
   REDIS_URL=redis://:key@fleetredis.redis.cache.windows.net:6380
   ```

---

## Best Practices

### 1. Production Checklist

- [ ] Use managed Redis service (Redis Cloud, AWS ElastiCache, etc.)
- [ ] Enable Redis authentication with strong password
- [ ] Set up Redis persistence (AOF + RDB)
- [ ] Configure memory limits and eviction policy
- [ ] Monitor Redis with CloudWatch/Stackdriver
- [ ] Set up Redis backups
- [ ] Use TLS/SSL for Redis connections (if supported)
- [ ] Restrict Redis network access (VPC/security groups)
- [ ] Set up Redis alerts for memory/CPU usage
- [ ] Test failover and recovery procedures

### 2. Scaling Redis

**Single Instance:**

- Good for: <10,000 users
- Max memory: 4-8GB

**Redis Cluster:**

- Good for: >10,000 users
- Auto-sharding across multiple nodes
- High availability with replica nodes

**Redis Sentinel:**

- Good for: High availability requirements
- Automatic failover
- Multiple replica nodes

### 3. Cost Optimization

```bash
# Use Redis AOF instead of RDB for better performance
# but higher disk usage

# Set appropriate TTLs (already set to 5 minutes)
# This automatically evicts old data

# Monitor memory usage
redis-cli INFO memory

# Adjust maxmemory based on user count:
# ~100 bytes per user * 5 minutes TTL
# 10,000 users = ~1MB
# 100,000 users = ~10MB
# 1,000,000 users = ~100MB
```

---

## Multi-Server Deployment Example

**Scenario:** Running 3 backend servers behind Nginx load balancer

### Setup:

1. **Docker Compose:**

```yaml
version: "3.8"

services:
  backend-1:
    build: .
    environment:
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=sqlserver://...
    depends_on:
      - redis
    deploy:
      replicas: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend-network

volumes:
  redis_data:

networks:
  backend-network:
    internal: true # No external access
```

2. **Nginx Load Balancer:**

```nginx
upstream backend {
    server backend-1:4000;
    server backend-2:4000;
    server backend-3:4000;
}

server {
    listen 80;

    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

3. **Result:**
   - All 3 servers share same Redis cache
   - Permission changes invalidate cache for all servers
   - Consistent RBAC state across all instances

---

## Maintenance

### Redis Backup

```bash
# Manual backup
redis-cli BGSAVE
# Creates dump.rdb file

# Automated backup (cron)
0 * * * * redis-cli BGSAVE
```

### Redis Monitoring

```bash
# Check Redis info
redis-cli INFO all

# Monitor in real-time
redis-cli MONITOR

# Check slow queries
redis-cli SLOWLOG GET 10
```

### Redis Update

```bash
# Graceful restart
redis-cli SHUTDOWN SAVE
redis-server

# Or with Docker
docker-compose restart redis
```

---

## Quick Reference

### Start Redis:

```bash
# Docker (easiest)
docker-compose up -d redis

# Windows
redis-server

# Linux
sudo systemctl start redis
```

### Test Connection:

```bash
redis-cli ping
# Output: PONG
```

### Stop Redis:

```bash
# Docker
docker-compose down redis

# Windows
redis-cli SHUTDOWN

# Linux
sudo systemctl stop redis
```

### View Logs:

```bash
# Docker
docker logs fleet-redis

# Windows
# Check Windows Event Viewer

# Linux
journalctl -u redis
```

### Clear Cache:

```bash
redis-cli FLUSHALL
# WARNING: This clears all cached permissions
```

---

## Support

- Redis Documentation: https://redis.io/docs
- ioredis Documentation: https://github.com/luin/ioredis
- Redis Commands: https://redis.io/commands

**Remember:** Redis is optional. The system works perfectly without it.
