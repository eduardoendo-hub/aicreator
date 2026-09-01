# AI Creator — landing page estática servida por nginx
FROM nginx:1.27-alpine

# curl para o healthcheck (Coolify roda o check dentro do container; a imagem
# nginx:alpine não traz curl por padrão).
RUN apk add --no-cache curl

# Config (inclui healthcheck /healthz → "ok")
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Conteúdo da LP
COPY index.html styles.css app.js robots.txt sitemap.xml llms.txt favicon.ico /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80

# 127.0.0.1 (não "localhost") — o entrypoint alpine não habilita IPv6 quando o
# default.conf é customizado, então localhost->::1 pode falhar.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/healthz || exit 1
