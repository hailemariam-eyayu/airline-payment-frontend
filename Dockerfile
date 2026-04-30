# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build args — passed at docker build time
ARG VITE_API_BASE_URL
ARG VITE_CHANNEL=IB
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_CHANNEL=$VITE_CHANNEL

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
