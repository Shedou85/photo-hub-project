# SEO, Backlinking & Keywords Planas — pixelforge.pro

> Sukurta: 2026-03-05
> Atnaujinta: 2026-03-08
> Statusas: Techniniai kodo pakeitimai ATLIKTI. Prerender.io veikia. GSC patvirtintas. Liko išoriniai veiksmai.

---

## Dabartinė būklė

### Kas jau padaryta ✅
- `react-helmet-async` su `SEO.jsx` komponentu (title, description, canonical, OG, Twitter Card)
- JSON-LD `Organization` + `SoftwareApplication` + `WebSite` schema HomePage'e
- `robots.txt` — blokuoja auth puslapius, nurodo sitemap
- `sitemap.xml` — 2 URL (/, /register) su `<lastmod>` datomis
- Canonical URL kiekvienam viešam puslapiui
- `noindex` ant auth/utility puslapių
- Hreflang tagai `index.html` (lt/en/ru/x-default)
- LQIP + thumbnail optimizacija (Core Web Vitals)
- GA4 su cookie consent
- ✅ **GSC verifikacijos meta tagas** įdėtas `index.html` (2026-03-07)
- ✅ **SEO.jsx** — `image` prop, `og:image:width/height`, `og:locale` pagal i18n kalbą (2026-03-07)
- ✅ **SharePage SEO** — dinaminis title, description, `noindex` (2026-03-07)
- ✅ **sitemap.xml** — pridėtos `lastmod` datos, pašalintas `/login` (2026-03-07)
- ✅ **HomePage JSON-LD** — pridėtas `WebSite` schema tipas (2026-03-07)
- ✅ **HomePage alt tekstai** — aprašomieji alt tekstai hero grid ir portfolio nuotraukoms su i18n (2026-03-07)
- ✅ **SEO meta aprašymai** — keyword-optimizuoti descriptions EN/LT/RU (2026-03-07)

### Likusios problemos ❌
1. ~~**Google Search Console neprijungta**~~ → ✅ Patvirtinta, property veikia (2026-03-08)
2. ~~**SPA be prerendravimo**~~ → ✅ Prerender.io + Cloudflare Worker (2026-03-08)
3. **Nėra backlink'ų** — nauja svetainė, nėra išorinių nuorodų
4. **Nėra turinio/blogo** — tik 2 URL sitemap'e
5. ~~**SharePage neturi SEO**~~ → ✅ Pridėtas SEO komponentas
6. ~~**sitemap.xml be `<lastmod>`**~~ → ✅ Pridėtos datos
7. ~~**OG image be matmenų**~~ → ✅ Pridėti `og:image:width/height`
8. ~~**Sitemap su tašku gale**~~ → ✅ Pateiktas naujas teisingas sitemap GSC (2026-03-08)

---

## I. TECHNINIAI KODO PAKEITIMAI

### 1. ✅ Google Search Console verifikacija — ATLIKTA (2026-03-07, patvirtinta 2026-03-08)
**Failas:** `frontend/index.html`
Meta tagas su kodu `gLWdQRSu3juaLZVIf4yg_qKOx_LtCaWtcdXgRAzJjXc` pridėtas.
✅ GSC patvirtintas. Sitemap pateiktas su teisingu URL (be tašku gale).

### 2. ✅ Sitemap.xml papildymas — ATLIKTA (2026-03-07)
**Failas:** `frontend/public/sitemap.xml`
- Pridėtos `<lastmod>2026-03-07</lastmod>` datos
- Pašalintas `/login` (mažai SEO vertės)
- `/register` priority pakelta iki 0.5

### 3. ✅ SharePage SEO — ATLIKTA (2026-03-07)
**Failas:** `frontend/src/pages/SharePage.jsx`
- Pridėtas `<SEO>` komponentas su dinaminiu title ir description
- `noindex` — share puslapiai neturėtų būti Google indekse
- Pridėtas `seo.shareDescription` raktas visoms 3 kalboms

### 4. ✅ SEO.jsx papildymai — ATLIKTA (2026-03-07)
**Failas:** `frontend/src/components/SEO.jsx`
- `image` prop (default: statinis OG image)
- `og:image:width` (1200), `og:image:height` (630)
- `og:locale` pagal i18n kalbą (en→en_US, lt→lt_LT, ru→ru_RU)
- TODO: Pridėti `twitter:site` kai bus sukurtas Twitter profilis
- TODO: Patikrinti ar `frontend/public/og-image.png` yra 1200x630px

### 5. ✅ JSON-LD schema praturtinimas — ATLIKTA (2026-03-07)
**Failas:** `frontend/src/pages/HomePage.jsx`
- Pridėtas `WebSite` tipas į `@graph` masyvą
- TODO: Pridėti `sameAs` su socialinių tinklų profiliais kai jie bus sukurti

### 6. ✅ Alt tekstai ir keyword optimizacija — ATLIKTA (2026-03-07)
- Hero grid nuotraukoms: aprašomieji alt tekstai su i18n (`home.heroPhotoAlt`)
- Portfolio nuotraukoms: aprašomieji alt tekstai su i18n (`promotional.photoAlt`)
- SEO meta descriptions optimizuoti su raktažodžiais (EN/LT/RU)

### 7. ✅ Prerendravimas — ATLIKTA (2026-03-08)
**Sprendimas:** Prerender.io + Cloudflare Worker
- Cloudflare Worker `prerender-worker` perima bot užklausas ir siunčia per Prerender.io
- Worker route: `*pixelforge.pro/*` (fail open)
- Token: `Ceib5qNXYW2Y4LHw7rGC`
- Prerender.io dashboard rodo žalią varnelę (verified)
- Apache `.htaccess` Prerender.io konfigūracija pašalinta (nereikalinga su CF Worker)

---

## II. KEYWORDS STRATEGIJA

### ⚠️ Meta keywords yra NEGYVI
Google oficialiai ignoruoja `<meta name="keywords">` nuo 2009 m. NEREIKIA jų pridėti.

### Kur raktažodžiai TURI būti:
1. **`<title>` tagai** — svarbiausias SEO signalas
2. **`<meta description>`** — netiesiogiai veikia per CTR
3. **H1, H2 antraštės** puslapio turinyje
4. **Paragrafų tekstas** — natūraliai integruoti
5. **Alt tekstai** nuotraukose
6. **URL struktūra** (jau gera)

### Tiksliniai raktažodžiai

#### Pirminiai (anglų kalba — didesnė rinka):
| Raktažodis | Paieškos intencija |
|------------|-------------------|
| photo delivery software for photographers | Pirkimo |
| client photo gallery software | Pirkimo |
| online photo proofing platform | Pirkimo |
| photo collection management tool | Informacinė/Pirkimo |
| share photos with clients securely | Informacinė |

#### Ilgaodegiai (long-tail — lengviau rankinti):
| Raktažodis | Paieškos intencija |
|------------|-------------------|
| how to deliver photos to clients online | Informacinė |
| best photo delivery platform for wedding photographers | Palyginimo |
| send photos to clients without Dropbox | Alternatyvų paieška |
| professional photo selection tool for clients | Pirkimo |
| photographer client portal software | Pirkimo |

#### Lietuviški (labai maža konkurencija!):
| Raktažodis | Pastaba |
|------------|--------|
| nuotraukų pristatymo platforma fotografams | Beveik 0 konkurencija |
| fotografo klientų galerija internete | Niche |
| nuotraukų atranka online | Niche |
| vestuvių fotografo įrankiai | Plati auditorija LT |

### Kur integruoti (konkretūs failai):
- **HomePage** (`pages/HomePage.jsx`) — H1, H2 antraštės, hero sekcijos tekstas, feature aprašymai
- **SEO descriptions** (`locales/en.json`, `lt.json`, `ru.json` → `seo` namespace) — optimizuoti meta descriptions
- **RegisterPage** — title ir description su raktažodžiais
- **Ateityje: Blog** — kiekvienas straipsnis taikomas į specifinį raktažodį

---

## III. BACKLINK STRATEGIJA

### A. Greiti veiksmai (1-2 savaitės) — NEMOKAMI

| # | Veiksmas | Backlink tipas | Pastabos |
|---|---------|---------------|---------|
| 1 | **Google Search Console** | Techninis | Prijungti, pateikti sitemap |
| 2 | **Google Business Profile** | Dofollow | Jei taikoma jūsų verslui |
| 3 | **AlternativeTo.net** | Dofollow | Registruoti kaip alternatyvą: Pixieset, ShootProof, Pic-Time, CloudSpot |
| 4 | **SaaSHub.com** | Dofollow | SaaS direktorija |
| 5 | **Product Hunt** | Dofollow | Sukurti "upcoming" puslapį |
| 6 | **GitHub** | Nofollow | Repo aprašyme pridėti nuorodą |
| 7 | **LinkedIn Company Page** | Nofollow | Su nuoroda į svetainę |
| 8 | **Twitter/X profilis** | Nofollow | Fotografų auditorija |
| 9 | **Instagram** | Nofollow | Bio nuoroda |
| 10 | **Facebook Business Page** | Nofollow | Su nuoroda |

### B. Vidutinio laikotarpio (1-3 mėnesiai)

| # | Veiksmas | Aprašymas |
|---|---------|-----------|
| 1 | **Product Hunt Launch** | Oficialus launch — didelis traffic spike + daug backlinks |
| 2 | **G2.com** | SaaS review platforma — aukštas DA |
| 3 | **Capterra** | SaaS direktorija — aukštas DA |
| 4 | **GetApp** | SaaS direktorija |
| 5 | **Reddit r/photography** | Vertingi komentarai, ne spam (r/weddingphotography taip pat) |
| 6 | **Fotografijų forumai** | Fred Miranda, Photography-on-the.net |
| 7 | **Crunchbase** | Jei registruoti kaip startup'ą |
| 8 | **BetaList** | Jei dar beta stadijoje |

### C. Ilgalaikė strategija (3+ mėnesiai)

| # | Veiksmas | Aprašymas |
|---|---------|-----------|
| 1 | **Blog sekcija** | Turinio strategija (žr. žemiau) |
| 2 | **Guest posting** | PetaPixel, Fstoppers, SLR Lounge, Digital Photography School |
| 3 | **Broken link building** | Rasti negyvas nuorodas fotografijų resursuose, pasiūlyti savo turinį |
| 4 | **Partnerystės** | Integracijos su kitais fotografų įrankiais (Lightroom, CRM) |
| 5 | **"State of Photography" ataskaita** | Duomenų tyrimas → natūralūs backlinkai |
| 6 | **Testimonials** | Parašyti atsiliepimus naudojamoms paslaugoms (CF, AWS) — dažnai duoda backlinką |
| 7 | **HARO / Connectively** | Atsakyti žurnalistų klausimus kaip ekspertas |

### ⛔ Ko VENGTI (Google baudžia):
- Nuorodų mainai (link exchanges)
- Mokamos nuorodos be `rel="sponsored"`
- PBN (Private Blog Networks)
- Masinis directory spam
- Komentarų spam su nuorodomis

---

## IV. TURINIO / BLOGO STRATEGIJA (ilgalaikis SEO)

### Kodėl reikia blogo:
- Kiekvienas straipsnis = naujas URL Google indekse
- Galimybė taikytis į long-tail raktažodžius
- Natūralūs backlinkai kai kiti cituoja straipsnius
- Padidina svetainės autoritetą (topical authority)

### Rekomenduojamos temos:

**"How-to" turinys (informacinė intencija):**
- "How to Deliver Photos to Clients Professionally in 2026"
- "Photography Workflow: From Shoot to Client Delivery"
- "Best Practices for Photo Proofing with Clients"
- "How to Create a Client Photo Gallery Online"
- "How to Watermark Photos Before Sending to Clients"

**Palyginamasis turinys (didelė SEO vertė):**
- "Pixelforge vs Pixieset: Which Is Better for Photographers?"
- "Top 5 Photo Delivery Platforms for Photographers in 2026"
- "Dropbox vs Dedicated Photo Delivery Software"
- "Pixelforge vs ShootProof Comparison"

**Lietuviškas turinys (niche su 0 konkurencija):**
- "Kaip pristatyti nuotraukas klientams profesionaliai"
- "Geriausios nuotraukų pristatymo platformos fotografams 2026"
- "Vestuvių fotografo darbo eiga: nuo fotosesijos iki pristatymo"

### Vidinės nuorodos (internal linking):
- Kiekvienas blog straipsnis → bent 2-3 nuorodos į kitus puslapius
- Feature aprašymai → Pricing/Register puslapis
- HomePage → Blog straipsniai
- Anchor tekstas turi būti aprašomasis (NE "spauskite čia")

---

## V. PRIORITETŲ SĄRAŠAS

| # | Veiksmas | Tipas | Poveikis | Sudėtingumas | Statusas |
|---|---------|-------|----------|--------------|---------|
| 1 | Google Search Console prijungimas | Išorinis | ⭐⭐⭐⭐⭐ | Žemas | ✅ Patvirtinta 2026-03-08 |
| 2 | Sitemap pateikimas GSC | Išorinis | ⭐⭐⭐⭐ | Žemas | ✅ Pateiktas 2026-03-08 (teisingas URL be tašku) |
| 3 | SaaS direktorijų registracija | Išorinis | ⭐⭐⭐⭐ | Žemas | ✅ AlternativeTo, SaaSHub, Product Hunt 2026-03-09 |
| 4 | SharePage SEO + dinaminis OG | Kodas | ⭐⭐⭐⭐ | Vidutinis | ✅ Atlikta 2026-03-07 |
| 5 | sitemap.xml lastmod | Kodas | ⭐⭐⭐ | Žemas | ✅ Atlikta 2026-03-07 |
| 6 | SEO.jsx OG patobulinimai | Kodas | ⭐⭐⭐ | Žemas | ✅ Atlikta 2026-03-07 |
| 7 | JSON-LD papildymas | Kodas | ⭐⭐⭐ | Žemas | ✅ Atlikta 2026-03-07 |
| 8 | HomePage raktažodžių + alt optimizacija | Kodas | ⭐⭐⭐⭐ | Vidutinis | ✅ Atlikta 2026-03-07 |
| 9 | Product Hunt launch | Išorinis | ⭐⭐⭐⭐⭐ | Vidutinis | ❌ Nepadaryta |
| 10 | Prerendravimas | Kodas | ⭐⭐⭐⭐⭐ | Aukštas | ✅ Prerender.io + CF Worker 2026-03-08 |
| 11 | Blog sekcija | Kodas + Turinys | ⭐⭐⭐⭐⭐ | Aukštas | ❌ Nepadaryta |
| 12 | Socialinių tinklų profiliai | Išorinis | ⭐⭐⭐ | Žemas | ✅ Instagram, X, LinkedIn 2026-03-09 |

---

## VI. KUR SUKURTI ACCOUNTS (checklist)

### Prioritetas 1 — ASAP (nemokami backlinkai)

- [x] **Google Search Console** — ✅ Patvirtinta 2026-03-08. Sitemap pateiktas.
- [x] **AlternativeTo** — ✅ Registruota 2026-03-09.
- [x] **SaaSHub** — ✅ Registruota 2026-03-09.
- [x] **Product Hunt** — ✅ Registruota 2026-03-09.
- [x] **LinkedIn** — ✅ https://linkedin.com/in/marius-dainys-a129323b5 (asmeninis; ateityje sukurti Company Page)
- [x] **Twitter/X** — ✅ https://x.com/PixelForgeApp
- [x] **Instagram** — ✅ https://www.instagram.com/pixelforgeapp/

### Prioritetas 2 — Per 1-3 mėnesius

- [ ] **G2** — https://g2.com — SaaS review platforma, aukštas DA.
- [ ] **Capterra** — https://capterra.com — SaaS direktorija, aukštas DA.
- [ ] **GetApp** — https://getapp.com — SaaS direktorija.
- [ ] **Crunchbase** — https://crunchbase.com — Startup profilis.
- [ ] **BetaList** — https://betalist.com — Jei pozicionuojat kaip beta.
- [ ] **Google Business Profile** — https://business.google.com — Jei tinka verslui.

> ✅ Socialinių tinklų profiliai sukurti, `sameAs` pridėtas į JSON-LD schemą (commit 645d309).

---

## VII. KUR RAŠYTI TURINĮ / BLOGUS

### A. Savo blogas (reikia sukurti blog feature — atskiras techninis task'as)

**Angliškai (didesnė rinka):**
- "How to Deliver Photos to Clients Professionally in 2026"
- "Photography Workflow: From Shoot to Client Delivery"
- "Best Practices for Photo Proofing with Clients"
- "PixelForge vs Pixieset: Which Is Better for Photographers?"
- "Top 5 Photo Delivery Platforms for Photographers in 2026"
- "Dropbox vs Dedicated Photo Delivery Software"

**Lietuviškai (0 konkurencija!):**
- "Kaip pristatyti nuotraukas klientams profesionaliai"
- "Geriausios nuotraukų pristatymo platformos fotografams 2026"
- "Vestuvių fotografo darbo eiga: nuo fotosesijos iki pristatymo"

### B. Guest posting (išoriniai straipsniai su backlinku)

| Platforma | URL | Auditorija |
|-----------|-----|-----------|
| **PetaPixel** | petapixel.com | Fotografai, didelė auditorija |
| **Fstoppers** | fstoppers.com | Profesionalūs fotografai |
| **SLR Lounge** | slrlounge.com | Vestuvių/portretų fotografai |
| **Digital Photography School** | digital-photography-school.com | Plati fotografų auditorija |

### C. Forumai / Reddit (naudingi komentarai, NE spam)

| Vieta | Strategija |
|-------|-----------|
| **r/photography** | Atsakinėti į klausimus, natūraliai paminėti PixelForge |
| **r/weddingphotography** | Ta pati strategija |
| **Fred Miranda forumai** | Fotografų bendruomenė |

---

## VIII. DABARTINIS PROGRESAS (2026-03-08)

### ✅ Atlikta:
1. GSC verifikacijos meta tagas įdėtas — ✅ GSC PATVIRTINTAS (2026-03-08)
2. Sitemap atnaujintas (lastmod, pašalintas /login) — ✅ Pateiktas GSC su teisingu URL (2026-03-08)
3. `.htaccess` fix — sitemap.xml ir robots.txt tiekiami su teisingu Content-Type
4. SEO.jsx — image prop, og:image:width/height, og:locale
5. SharePage — SEO komponentas su noindex
6. HomePage — WebSite JSON-LD schema, alt tekstai nuotraukoms
7. Locale failai (en/lt/ru) — keyword-optimizuoti SEO aprašymai, nauji raktai
8. ✅ Prerender.io + Cloudflare Worker — SPA prerendravimas botams veikia (2026-03-08)
9. Senas sitemap su tašku gale (`sitemap.xml.`) sukėlė "Sitemap is HTML" klaidą — pateiktas naujas teisingas

### ✅ Atlikta 2026-03-09:
- Direktorijų registracijos (AlternativeTo, SaaSHub, Product Hunt)
- Socialinių tinklų profiliai (Instagram, X/Twitter, LinkedIn)
- `sameAs` JSON-LD schema atnaujinta su socialiniais profiliais (commit 645d309)

### ❌ Nepadaryta:
- Blog sekcija (atskiras feature)
- Guest posting
- Prioritetas 2 direktorijos (G2, Capterra, GetApp, Crunchbase, BetaList)

---

## IX. VERIFIKACIJA

- **Google Search Console** → Coverage report → ar puslapiai indeksuojami?
- **`site:pixelforge.pro`** Google paieškoje → kiek puslapių suindeksuota
- **Google Rich Results Test** → JSON-LD validacija
- **Facebook Sharing Debugger** → OG tagų patikra
- **Twitter Card Validator** → Twitter card patikra
- **PageSpeed Insights** → Core Web Vitals rezultatai
- **Ahrefs/SEMrush** (nemokamos versijos) → backlink profilis, raktažodžių pozicijos

---

## Šaltiniai
- [React SPA SEO strategijos 2026](https://www.copebusiness.com/technical-seo/spa-seo-strategies/)
- [SaaS Link Building strategijos](https://skale.so/saas-seo/link-building/)
- [XML Sitemap best practices](https://www.trysight.ai/blog/xml-sitemap-best-practices)
- [Meta Keywords 2025 — ar aktualūs?](https://www.postaffiliatepro.com/faq/are-meta-keywords-still-relevant/) — NE
- [SEO fotografams](https://aftershoot.com/blog/seo-for-photographers/)
- [Vidinės nuorodos strategija](https://www.ideamagix.com/blog/internal-linking-strategy-seo-guide-2026/)
