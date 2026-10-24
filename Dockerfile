FROM node:22-bookworm-slim
WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev

COPY src ./src
RUN mkdir -p /app/data

ENV NODE_ENV=production \
    PORT=8000 \
    DB_PATH=/app/data/bengkelku.sqlite

EXPOSE 8000
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
