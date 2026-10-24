# 1. Gunakan Node 20 (LTS) karena lebih stabil untuk native module
FROM node:20-bookworm-slim
WORKDIR /app

# 2. Install alat kompilasi yang dibutuhkan untuk build SQLite
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 3. Copy file package dan install dependensi
COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# 4. PAKSA KOMPILASI ULANG MODUL SQLITE (Ini obat utama Segfault)
RUN npm rebuild better-sqlite3 || npm rebuild sqlite3 || true

# 5. Copy sisa kode
COPY src ./src
RUN mkdir -p /app/data

# 6. Environment variables
ENV NODE_ENV=production \
    PORT=8000 \
    DB_PATH=/app/data/bengkelku.sqlite

EXPOSE 8000
VOLUME ["/app/data"]

# 7. Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]