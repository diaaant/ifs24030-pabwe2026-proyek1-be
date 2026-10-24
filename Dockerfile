# ==========================================
# TAHAP 1: BUILDER (Kompilasi Native Module)
# ==========================================
# Gunakan image node:20 versi lengkap (bukan slim) untuk kompilasi
FROM node:20 AS builder

WORKDIR /app

# Install semua alat build yang dibutuhkan
RUN apt-get update && apt-get install -y python3 make g++

# Copy package.json dan install SEMUA dependencies (termasuk dev)
COPY package*.json .npmrc ./
RUN npm ci

# Paksa kompilasi ulang better-sqlite3 agar menghasilkan binary .node yang benar
RUN npm rebuild better-sqlite3

# ==========================================
# TAHAP 2: RUNNER (Jalankan Aplikasi)
# ==========================================
# Gunakan image slim untuk ukuran akhir yang kecil
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Set environment variable
ENV NODE_ENV=production \
    PORT=8000 \
    DB_PATH=/app/data/bengkelku.sqlite

# Copy file konfigurasi dan install HANYA production dependencies
COPY package*.json .npmrc ./
RUN npm ci --omit=dev

# ⚠️ LANGKAH KRUSIAL: Salin hasil kompilasi better-sqlite3 dari tahap builder
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Copy sisa kode aplikasi
COPY src ./src
RUN mkdir -p /app/data

EXPOSE 8000
VOLUME ["/app/data"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]