# Pinned base: Debian bookworm has ffmpeg in apt, which the Icecast silence check uses.
FROM node:22.14.0-bookworm-slim
# Pin further with a digest after the first pull: docker inspect --format "{{index .RepoDigests 0}}" node:22.14.0-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY src ./src
COPY scripts ./scripts
ENV NODE_ENV=production LOG_DIR=/data/logs FFMPEG_PATH=/usr/bin/ffmpeg
VOLUME ["/data"]
EXPOSE 9101
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:9101/health').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "src/index.mjs"]
