# LP — AI Creator (Impacta × Olhar Digital)

Landing page estática do curso **AI Creator — Criação, Storytelling e Vídeo com Inteligência Artificial** (3 dias, online ao vivo), servida por nginx em container via Coolify.

- **Produção:** https://aicreator.technowhub.ai (destino futuro: `impacta.com.br/cursos/aicreator` — trocar o `<link rel="canonical">` e o `sitemap.xml` quando migrar)
- **Infra:** Coolify na VPS Hetzner (`159.69.240.1`) — push na `main` → redeploy automático
- **Healthcheck:** `GET /healthz` → `ok`

## Estrutura
- `index.html` — página única (SEO: canonical, OG, JSON-LD Course + FAQ + Breadcrumb)
- `styles.css` — design system Impacta + estilos da página (exportados do canvas)
- `app.js` — captura de UTMs → repassa ao checkout/WhatsApp, eventos IRIS (`lp_view`, `click_compra`, `click_whats`), Pixel Meta, tag do Google Ads, vídeo do hero
- `assets/` — vídeo do hero, imagens, logos e fontes self-hosted
- `Dockerfile` + `nginx.conf` — nginx:alpine, porta 80, cache 30d em `/assets/`

## Turma / checkout (Engaged)
| Turma | Datas | Checkout |
|---|---|---|
| Online ao vivo | 6, 7 e 8/10/2026 · 19h–22h | `.../p/checkout/5ruizijtw3` |

Investimento: R$ 700 à vista (de R$ 1.200) ou 12x de R$ 58,33.

## Tracking
| Item | Valor |
|---|---|
| `productSlug` | `aicreator` |
| `campaignSlug` | `aicreator-outubro-2026` |
| Pixel Meta | `1581473926936760` (pixel IRIS compartilhado das LPs Impacta) |
| Google Ads | `AW-1056567970` (tag global). **Sem campanha no Google por ora** (decisão de 2026-09-06) — a tag carrega mas não registra conversão. Se e quando entrar mídia no Google, criar o label "InitiateCheckout LP AI Creator" e preencher `GOOGLE_ADS_LABEL` em `app.js`. |
| Engaged sharedId | `5ruizijtw3` |

Origem `https://aicreator.technowhub.ai` precisa estar em `iris/app/api/events/route.ts → ALLOWED_ORIGINS`, senão os contadores do cockpit ficam zerados.

## Origem do design
Exportado do Claude Design (canvas `.dc.html`) como bundle auto-descompactante e convertido para estático: `<style>` do helmet → `styles.css`, `<sc-if>` resolvidos, bindings do vídeo → atributos HTML, atributos `style` normalizados no formato do CSSOM (os media queries do design dependem disso) e assets extraídos do manifest.

## Rodar local
```bash
python3 -m http.server 8743
# ou
docker build -t lp-aicreator . && docker run -p 8080:80 lp-aicreator
```
