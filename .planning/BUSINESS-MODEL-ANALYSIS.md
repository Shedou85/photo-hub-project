# PixelForge — Biznio Modelio Analize ir Konkurentu Tyrimas

> Sukurta: 2026-03-09
> Tikslas: Ivertinti dabartines galimybes, palyginti su konkurentais, patikslinti kainodaros strategija

---

## I. DABARTINES PIXELFORGE GALIMYBES (Features)

### Kas jau veikia (v2.0 shipped):

| Kategorija | Feature | Planas |
|------------|---------|--------|
| **Kolekcijos** | Kolekciju kurimas, redagavimas, trynimas | Visi |
| **Kolekcijos** | Cover photo nustatymas | Visi |
| **Kolekcijos** | Kolekciju statusu lifecycle (DRAFT > SELECTING > REVIEWING > DELIVERED > DOWNLOADED > ARCHIVED) | Visi |
| **Nuotrauku ikėlimas** | Batch upload su concurrent queue (max 3) | Visi |
| **Nuotrauku ikėlimas** | Thumbnail generavimas (GD) | Visi |
| **Nuotrauku ikėlimas** | LQIP (Low Quality Image Placeholders) | Visi |
| **Nuotrauku ikėlimas** | Edited/final nuotrauku ikėlimas | Visi |
| **Dalinimasis** | Share link su slaptazodziu | Visi |
| **Dalinimasis** | Kliento galerija (be prisijungimo) | Visi |
| **Kliento atranka** | Kliento nuotrauku pasirinkimas (SELECTED/FAVORITE/REJECTED) | Trial/Standard/PRO |
| **Kliento atranka** | Atrankos limitas (selectionLimit) | Visi |
| **Kliento atranka** | Atrankos perziura (review step) | Visi |
| **Pristatymas** | Atskiras delivery token (ne shareId) | Visi |
| **Pristatymas** | ZIP atsisiuntimas (streaming, ZipStream-PHP) | Visi |
| **Pristatymas** | Individualus nuotrauku atsisiuntimas | Visi |
| **Pristatymas** | Download tracking su session deduplication | Visi |
| **PRO features** | Watermarked previews (SELECTING faze) | PRO |
| **PRO features** | Drag-and-drop nuotrauku pertvarkymas (@dnd-kit) | PRO |
| **Branding** | Custom branding logo URL | Standard/PRO |
| **Branding** | Custom branding spalva | Standard/PRO |
| **Promocija** | Promotional nuotraukos HomePage portfolio sekcijoje | Visi |
| **Autentifikacija** | Email/password + Google OAuth | Visi |
| **Autentifikacija** | Email verifikacija | Visi |
| **Autentifikacija** | Password reset | Visi |
| **Admin** | User management, audit log, statistikos | Admin |
| **i18n** | Lietuviskai, angliskai, rusiski | Visi |
| **SEO** | react-helmet-async, JSON-LD, OG tags, sitemap | — |
| **Saugumas** | CSRF, rate limiting, session cookies | — |

### Ko NERA (trukstamos features):

| Feature | Konkurentai turi? | Prioritetas |
|---------|-------------------|-------------|
| **Stripe mokejimas** | Visi | KRITINIS |
| **Print store / e-commerce** | Pixieset, ShootProof, Pic-Time, CloudSpot, Zenfolio | Vidutinis |
| **Video support** | Pixieset, Pic-Time, Zenfolio | Zemas |
| **Slideshow** | Pic-Time, Zenfolio | Zemas |
| **Album proofing** | Pic-Time, Sprout Studio | Zemas |
| **CRM / invoicing / contracts** | ShootProof, CloudSpot, Sprout Studio | Zemas (ne musu focus) |
| **Email notifications** | Visi | Aukštas |
| **Galerijos galiojimo data (expiry)** | Pixieset, CloudSpot | Vidutinis |
| **Custom domain** | Pixieset, Pic-Time, Zenfolio | Vidutinis |
| **Mobile app** | Pixieset, CloudSpot | Zemas |
| **Blog feature** | Pic-Time (Advanced), Zenfolio | Vidutinis (SEO) |
| **Marketing automation** | Pic-Time, CloudSpot | Zemas |
| **Fotografo website builder** | Pixieset, Zenfolio, SmugMug | Zemas (ne musu focus) |
| **AI features** | Aftershoot, TurtlePic | Ateitis |
| **Multi-brand** | Pic-Time (Advanced) | Zemas |
| **Favorites/voting sistema** | Picdrop, Pic-Time | Jau turime (SELECTED/FAVORITE/REJECTED) |

---

## II. KONKURENTU PALYGINIMAS

### Kainodara — pilna lentele

| Platforma | Nemokamas | Entry | Mid | Pro | Unlimited |
|-----------|-----------|-------|-----|-----|-----------|
| **Pixieset** (Gallery) | 3GB, 15% komisija | $10/mo (10GB) | $20/mo (100GB) | $50/mo (1TB) | $50/mo (unlimited) |
| **ShootProof** | 100 photos | $10/mo (1.5K photos) | $20/mo (5K photos) | $30/mo (25K photos) | $60/mo (unlimited) |
| **Pic-Time** | ~3K photos | $8/mo (10GB) | $25/mo (100GB) | $50/mo (unlimited) | — |
| **CloudSpot** | Free + 15% komisija | ~$10/mo | ~$21/mo | — | — |
| **Zenfolio** | 14d trial | $9/mo (15GB) | $23/mo (150GB) | $40/mo (unlimited) | — |
| **Pass Gallery** | Free tier | ~$15/mo | ~$29/mo | — | — |
| **Sprout Studio** | Free trial | $17-19/mo | $34/mo | $49/mo | — |
| **PixelForge (dabar)** | 30d trial (20 col, 500 ph) | $15/mo (20 col, 500 ph) | — | $29/mo (unlimited) | — |

### Feature palyginimas

| Feature | Pixieset | ShootProof | Pic-Time | CloudSpot | PixelForge |
|---------|----------|------------|----------|-----------|------------|
| Client gallery | Da | Da | Da | Da | Da |
| Client proofing/selection | Da | Da | Da | Da | Da |
| ZIP download | Da | Da | Da | Da | Da |
| Watermark previews | Da | Da | Da | Da | Da (PRO) |
| Print store | Da | Da | Da | Da | NE |
| CRM/Invoicing | Da (Suite) | Da | Ne | Da | NE |
| Video | Da | 2026 | Da | Ne | NE |
| Custom domain | Da | Ne | Da | Ne | NE |
| Website builder | Da | Ne | Ne | Ne | NE |
| Email notifications | Da | Da | Da | Da | NE |
| Mobile app | Da | Ne | Ne | Da | NE |
| Drag-drop reorder | Da | Da | Da | Da | Da (PRO) |
| Multi-language | Ne | Ne | Ne | Ne | Da (LT/EN/RU) |
| Free tier po trial | Ne | Da (100 ph) | Da (~3K ph) | Da | Da (5 col, 30 ph) |

---

## III. PIXELFORGE SWOT ANALIZE

### Stiprybes (Strengths)
1. **Paprastumas** — siauresnis focus = lengvesne UX negu all-in-one platformos
2. **Nulinis friction klientams** — no account, no login, just a link
3. **Multi-language (LT/EN/RU)** — unikalu rinkoje, niche LT rinka su 0 konkurencija
4. **Pilnas workflow** — nuo upload iki delivery viename tool'e
5. **Moderni tech stack** — React 18 + Vite = greitas, SPA su prerendering
6. **Pigiau nei konkurentai** — $15/mo vs $20-50/mo uz panasias features
7. **Nemokamas planas po trial** — skirtingai nuo Pixieset kuris neturi free tier

### Silpnybes (Weaknesses)
1. **Nera mokejimo integracijos** — negalima realiai prenumeruoti (KRITINE!)
2. **Nera email notifications** — klientas nezino kad galerija paruosta
3. **Nera print store** — tai primary revenue source daugeliui konkurentu
4. **Nauja svetaine** — 0 SEO authority, 0 backlinks, 0 reviews
5. **Vieno zmogaus projektas** — ribotas support, ribotas development speed
6. **Nera custom domain** — fotografai nori savo brando

### Galimybes (Opportunities)
1. **Lietuviska rinka** — 0 lokalizuotu konkurentu, photographers LT naudoja Dropbox/WeTransfer
2. **Kainodara** — galime buti pigiausia profesionali platforma
3. **Vestuviu fotografai** — didziausia target auditorija, jiems reikia workflow tool
4. **AI features ateityje** — auto-culling, smart selection suggestions
5. **Product Hunt launch** — didziulis traffic spike ir backlinkai
6. **Niche focus** — delivery-first platforma, ne all-in-one (paprastumas = privalumas)

### Gresmes (Threats)
1. **Pixieset dominuoja** — didziausias brand awareness fotografu tarpe
2. **All-in-one trend** — ShootProof, Sprout Studio siulo viska viename
3. **Kaina != barjeras** — fotografai jau moka uz Pixieset/ShootProof
4. **AI disruption** — Aftershoot, TurtlePic keicia zaidimo taisykles

---

## IV. BIZNIO MODELIO REKOMENDACIJOS

### A. Kainodara — NAUJA PASIULYMA

Dabartine kainodara yra per daug supaprastinta ir nekonkurencinga. Rekomenduoju:

#### Siulomas naujas modelis:

| Planas | Kaina | Target | Limitas | Key features |
|--------|-------|--------|---------|--------------|
| **Free** | $0 | Isibandymui | 3 kolekcijos, 50 ph/col, 1GB total | Gallery + share link only. No selections, no delivery, no download. Watermark "Powered by PixelForge" |
| **Starter** | $9/mo ($7/mo annual) | Hobistai, pradedantys | 10 kolekc., 200 ph/col, 5GB | Client selections, delivery, ZIP download, basic branding |
| **Professional** | $19/mo ($15/mo annual) | Profesionalai | 50 kolekc., 1000 ph/col, 50GB | Custom branding, email notifications, watermark previews, gallery expiry, custom colors |
| **Business** | $35/mo ($29/mo annual) | Studijos | Unlimited | All Professional + priority support, drag-drop reorder, multi-brand, API access, custom domain |

#### Kodel keisti:

1. **4 planai > 3 planai** — daugiau "anchoring" galimybiu, didesnis spread
2. **$9 entry point** — konkurencingas su Pic-Time ($8), ShootProof ($10), Zenfolio ($9)
3. **Metine nuolaida** — standartine SaaS praktika, mazina churn
4. **Free planas be trial limito** — amzinas free = didesnis funnel, kaip ShootProof/Pic-Time
5. **"Powered by PixelForge"** watermark free plane — nemokama reklama
6. **Storage limitai** — realistiskesni, alignment su konkurentais

### B. Kritiniai next steps (prioriteto tvarka):

| # | Veiksmas | Kodel | Sudėtingumas |
|---|---------|-------|-------------|
| 1 | **Stripe integracija** | Be mokėjimų negalima monetizuoti. Schema jau paruosta (stripeCustomerId). | Aukštas |
| 2 | **Email notifications** | Klientas TURI zinoti kad galerija paruosta. Kiekvienas konkurentas turi. | Vidutinis |
| 3 | **Gallery expiry** | Schema jau turi expiresAt. Reikia cron + UI. | Vidutinis |
| 4 | **"Powered by PixelForge" free plan watermark** | Nemokama reklama + upgrade incentive | Zemas |
| 5 | **Product Hunt launch** | Traffic + backlinks + early adopters | Isoriinis |
| 6 | **Blog sekcija** | SEO long-tail keywords, authority | Vidutinis |

### C. Ko NEDARYTI (bent jau artimiausiu metu):

1. **Print store / e-commerce** — per daug sudetinga, reikia lab integraciju, shipping. Geriau fokusas i delivery.
2. **CRM / invoicing / contracts** — tai atskiras produktas (Sprout Studio, HoneyBook). Ne musu lane.
3. **Website builder** — Pixieset/Zenfolio teritorija. Per daug darbo, per maza nauda.
4. **Mobile app** — web app veikia mobile. Native app nera butina siame etape.
5. **Video support** — gali palaukti iki bus stabilios pajamos.

---

## V. POZICIONAVIMAS RINKOJE

### Musu USP (Unique Selling Proposition):

> **"The simplest way to deliver photos to your clients."**
> PixelForge — nuo upload iki delivery vienu click. Be CRM bloat. Be print store komplikaciju. Tiesiog paprastas, greitas, profesionalus nuotrauku pristatymas.

### Target auditorija (prioriteto tvarka):

1. **Vestuviu fotografai** (41% rinkos) — jiems reikia workflow nuo shoot iki delivery
2. **Portretiniai fotografai** — family, senior, maternity sessions
3. **Event fotografai** — corporate events, konferencijos
4. **Lietuvos fotografai** — 0 lokalizuotu alternatyvu, niche su potencialu

### Diferenciacija nuo konkurentu:

| vs Konkurentas | Musu privalumas |
|----------------|-----------------|
| vs **Pixieset** | Paprasčiau, pigiau, multi-language, amžinas free planas |
| vs **ShootProof** | Modernesnė UX, greitesnis (SPA), multi-language |
| vs **Pic-Time** | Paprasčiau (no e-commerce bloat), pigiau entry level |
| vs **CloudSpot** | Multi-language, aiškesnis workflow lifecycle |
| vs **Dropbox/WeTransfer** | Profesionali galerija, client selections, branding |

### Lietuviska rinka — specifine strategija:

- **0 konkurentu** su lietuviska lokalizacija
- Target: ~3000-5000 aktyviu profesionaliu fotografu Lietuvoje
- Kainodara EUR (ne USD) lietuviskam rinkui
- Partnerystes su LT fotografu bendruomenemis (foto.lt, Facebook grupes)
- LT blogo turinys (0 konkurencija Google)

---

## VI. REVENUE PROJEKCIJOS (konservatyvios)

### Prielaidos:
- Launch su Stripe: ~2026 Q2
- Product Hunt launch: ~2026 Q2
- Organic growth per SEO/content: 2026 Q3+

### Scenario A — Konservatyvus (pirmi 12 men.):

| Metrikos | M1-3 | M4-6 | M7-9 | M10-12 |
|----------|------|------|------|--------|
| Free users | 50 | 150 | 300 | 500 |
| Paid users | 3 | 15 | 35 | 60 |
| Avg. revenue/user | $15 | $17 | $18 | $19 |
| MRR | $45 | $255 | $630 | $1,140 |

### Scenario B — Optimistinis (su sekmingu PH launch):

| Metrikos | M1-3 | M4-6 | M7-9 | M10-12 |
|----------|------|------|------|--------|
| Free users | 200 | 500 | 1000 | 2000 |
| Paid users | 15 | 50 | 120 | 250 |
| Avg. revenue/user | $16 | $18 | $19 | $20 |
| MRR | $240 | $900 | $2,280 | $5,000 |

### Break-even estimacija:
- Server costs: ~$50/mo (hosting + R2 + DB)
- Domain + services: ~$30/mo
- Total fixed: ~$80/mo
- Break-even: ~5-6 paid users

---

## VII. RINKOS KONTEKSTAS

- Photography studio software rinka: **$0.72B (2025)** -> **$1.36B (2030)**, CAGR 13.56%
- Cloud-based sprendimai: 72% revenue dalies
- Solo fotografai: 55% rinkos
- Vestuviu/event fotografai: 41% rinkos
- AI integracija auga — 65-70% editing irankiu jau turi AI features
- Asia Pacific — greiciausiai auganti regionas (14.8% CAGR)

---

## Saltiniai

- [Pixieset Pricing](https://pixieset.com/pricing/)
- [ShootProof Plans](https://www.shootproof.com/plans/)
- [Pic-Time Pricing](https://www.pic-time.com/pricing/client-delivery-suite)
- [CloudSpot Pricing](https://cloudspot.io/pricing)
- [Zenfolio Pricing](https://zenfolio.com/)
- [Sprout Studio Pricing](https://getsproutstudio.com/pricing/)
- [Pass Gallery Pricing](https://www.passgallery.com/pricing)
- [Aftershoot — Best Online Proofing Galleries 2026](https://aftershoot.com/blog/best-online-proofing-galleries/)
- [Photography Studio Software Market — Mordor Intelligence](https://www.mordorintelligence.com/industry-reports/photography-studio-software-market)
- [Photography Software Market — Global Growth Insights](https://www.globalgrowthinsights.com/market-reports/photography-software-market-110947)
- [Pixieset Alternatives 2026](https://pixieset-alternatives.com/)

---

*Dokumentas sukurtas: 2026-03-09*
