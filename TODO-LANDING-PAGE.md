# PixelForge Landing Page — TODO planas

> Statusas: ⬜ Nepradėta | 🔄 Daroma | ✅ Atlikta
> Paskutinis atnaujinimas: 2026-04-03

---

## 1. ⬜ Hero sekcija — social proof ir stipresnis CTA

**Problema:** Dabar yra tik "Get started free" mygtukas ir trumpas aprašymas. Žmogus neturi jokio motyvo spausti — nėra pasitikėjimo elementų, nėra skubumo.

**Ką reikia padaryti:**
- Po "Get started free" mygtuku pridėti tekstą: **"Nemokamas 30 dienų bandymas. Nereikia kortelės."**
- Pridėti social proof eilutę: **"Jau naudoja 50+ fotografų Lietuvoje"** (skaičių galima pradėti nuo mažo ir auginti)
- Pridėti 3 mažas ikonas po mygtuku: ✅ Nereikia kortelės | ✅ 30 dienų nemokamai | ✅ Atšaukykite bet kada

**Mano rekomendacija:** Tai pirmas dalykas, kurį turi pamatyti lankytojas. Šiuos pakeitimus padarysime `HomePage.jsx` hero sekcijoje. Nereikia keisti dizaino — tik pridėti tekstą po mygtuku. Efektas turėtų būti iškart matomas Analytics duomenyse.

**Failai:** `frontend/src/pages/HomePage.jsx`, `frontend/src/locales/lt.json`, `en.json`, `ru.json`

---

## 2. ⬜ Video/GIF demo — kaip veikia sistema

**Problema:** Lankytojas mato gražias nuotraukas, bet nesupranta ką platforma daro. Vidutinis laikas puslapyje — tik 42 sekundės. Per trumpai.

**Ką reikia padaryti:**
- Sukurti 15-20 sekundžių animuotą GIF arba video, kuris rodo:
  1. Fotografas įkelia nuotraukas
  2. Klientas gauna nuorodą ir renkasi mėgstamiausias
  3. Fotografas pristato galutines nuotraukas
- Patalpinti po hero sekcijos, prieš "Everything you need to deliver"

**Mano rekomendacija:** Geriausias variantas — sukurti screen recording iš pačios platformos su tikromis nuotraukomis. Galima naudoti ekrano įrašymą ir pagreitinti 2x. Alternatyviai — Lottie animacija su iliustracijomis. GIF bus lengvesnis nei video ir automatiškai gros.

**Failai:** Naujas komponentas `frontend/src/components/home/DemoSection.jsx`, video/GIF failas į R2 storage

---

## 3. ⬜ Papildomi CTA mygtukai per visą puslapį

**Problema:** Dabar CTA mygtukas yra tik hero sekcijoje. Kai žmogus nuskrolina žemyn — nebėra kaip registruotis (nebent scrollina atgal). Analytics rodo, kad žmonės neina toliau nei pagrindinis puslapis.

**Ką reikia padaryti:**
- Pridėti CTA mygtuką **po Features sekcijos** ("Everything you need to deliver")
- Pridėti CTA mygtuką **po Portfolio sekcijos** ("As seen in our portfolio")
- Pridėti CTA mygtuką **po FAQ sekcijos** (paskutinis šansas prieš footer)
- Visi mygtukai veda į `/register`

**Mano rekomendacija:** Nereikia didelių sekcijų — užtenka vienos eilutės su tekstu ir mygtuku. Pvz: "Pasiruošę pradėti? → Registruotis nemokamai". Stilius — gradient mygtukas kaip hero, centruotas, su padding viršuje/apačioje.

**Failai:** `frontend/src/pages/HomePage.jsx`

---

## 4. ⬜ Portfolio sekcija su CTA

**Problema:** Portfolio sekcija "As seen in our portfolio" rodo nuotraukas, bet neduoda jokio veiksmo. Tai dead-end — žmogus žiūri nuotraukas ir nesupranta ką daryti toliau.

**Ką reikia padaryti:**
- Po portfolio nuotraukų pridėti tekstą: **"Šias nuotraukas pristačiau per PixelForge. Sukurkite savo pirmą galeriją."**
- Pridėti mygtuką: **"Pradėti nemokamai →"**
- Galima pridėti animaciją — kai užvedi pelę ant nuotraukos, pasirodo overlay su tekstu "DRAFT", "SELECTING", "DELIVERED" (statusai kaip platformoje)

**Mano rekomendacija:** Portfolio sekcija yra labai stipri vizualiai. Ją reikia tik papildyti CTA, ne perdaryti. Overlay su statusais būtų labai šaunus touch — rodo, kad tai ne šiaip galerija, o tikra platforma su darbo eiga.

**Failai:** `frontend/src/pages/HomePage.jsx`, `frontend/src/locales/*.json`

---

## 5. ⬜ Testimonialai / atsiliepimai

**Problema:** Nėra jokio social proof. Žmogus neturi patvirtinimo, kad kiti fotografai naudoja ir jiems patinka. Tai viena iš svarbiausių konversijos elementų.

**Ką reikia padaryti:**
- Pridėti naują sekciją tarp Portfolio ir Pricing: **"Ką sako fotografai"**
- 2-3 atsiliepimai su:
  - Fotografo vardas ir pavardė
  - Nuotrauka (avatar)
  - Trumpas atsiliepimas (2-3 sakiniai)
  - Specializacija (pvz. "Vestuvių fotografas, Vilnius")
- Card dizainas su citatų ženklu

**Mano rekomendacija:** Pradžioje galima naudoti savo ir draugų fotografų atsiliepimus. Vėliau, kai turėsi tikrų vartotojų, pakeisime tikrais. Svarbu kad atsiliepimai būtų trumpi, konkretūs ir apie konkrečią naudą (pvz. "Klientai patys pasirenka nuotraukas — nebereikia siuntinėti per email").

**Failai:** Naujas komponentas `frontend/src/components/home/TestimonialsSection.jsx`, `frontend/src/locales/*.json`

---

## 6. ⬜ Pricing mygtukai → tiesiai į /register

**Problema:** "Start free", "Get Professional", "Get Business" mygtukai turi vesti tiesiai į registraciją su pasirinktu planu. Dabar reikia patikrinti kur jie veda.

**Ką reikia padaryti:**
- Patikrinti dabartinę pricing mygtukų logiką
- "Start free" → `/register?plan=free`
- "Get Professional" → `/register?plan=professional`
- "Get Business" → `/register?plan=business`
- RegisterPage turi nuskaityti `plan` query param ir parodyti pasirinktą planą

**Mano rekomendacija:** Tai mažas pakeitimas, bet labai svarbus konversijai. Kai žmogus jau nusprendė mokėti — neleisk jam pasiklysti. Kiekvienas papildomas klikas mažina konversiją ~20%.

**Failai:** `frontend/src/pages/HomePage.jsx` (pricing sekcija), `frontend/src/pages/RegisterPage.jsx`

---

## 7. ⬜ Sticky CTA mygtukas mobiliesiems

**Problema:** Mobiliajame ekrane žmogus skrolina ir praranda CTA mygtuką. 60%+ traffic ateina iš mobiliųjų (ypač iš Meta reklamų).

**Ką reikia padaryti:**
- Pridėti fiksuotą (sticky) mygtuką ekrano apačioje tik mobiliam view (<768px)
- Mygtukas: **"Registruotis nemokamai"** — gradient stilius
- Pasirodo tik kai nuskrolina žemiau hero sekcijos (kad nesidubliuotų su hero CTA)
- Turi "X" uždarymo mygtuką (kad neerzintų)

**Mano rekomendacija:** Tai labai efektyvus mobile konversijos elementas. Naudoja visos rimtos SaaS platformos. Implementuosime su `useMediaQuery` hook ir `IntersectionObserver` kad pasirodytų tik nuskrolinus žemiau hero.

**Failai:** Naujas komponentas `frontend/src/components/home/StickyMobileCTA.jsx`, `frontend/src/pages/HomePage.jsx`

---

## 8. ⬜ Footer pagerinimas

**Problema:** Footer per tuščias — tik email ir Facebook ikona. Atrodo nebaigtas. Nėra Instagram, nėra teisinių nuorodų.

**Ką reikia padaryti:**
- Pridėti Instagram nuorodą (kai turėsime Instagram paskyrą)
- Pridėti nuorodas: Privacy Policy, Terms of Service (net jei dar neturime pilnų dokumentų — bent placeholder puslapius)
- Pridėti "Quick Links" stulpelį: Home, Features, Pricing, FAQ, Sign Up
- Pridėti "Contact" stulpelį su email

**Mano rekomendacija:** Footer turi atrodyti profesionaliai — tai paskutinis dalykas, kurį žmogus mato prieš išeinant. Trys stulpeliai: Apie / Quick Links / Kontaktai. Stilius — tamsesnis nei dabartinis fonas, su subtiliu border-top.

**Failai:** `frontend/src/pages/HomePage.jsx` (footer sekcija), galbūt nauji puslapiai `PrivacyPage.jsx`, `TermsPage.jsx`

---

## 9. ⬜ Registracijos vedimo strategija — VARIANTAI (pasirink)

**Problema:** Iš 75 sesijų pagrindiniame puslapyje, tik 1 žmogus nuėjo į `/register`. Tai beveik 0% konversija. Reikia drastiškai pagerinti vedimą.

### Variantas A: Specialus reklamos landing page

**Aprašymas:** Sukurti atskirą puslapį `/lp/photographers` specialiai Meta reklamai. Trumpesnis nei pagrindinis puslapis — tik hero + 3 privalumai + CTA. Be portfolio, be FAQ. Tikslas — kuo greičiau nuvesti į registraciją.

**Privalumai:** Labai fokusuotas, nėra distrakcijų, lengva A/B testuoti
**Trūkumai:** Reikia sukurti naują puslapį, dvigubin turinį

---

### Variantas B: Exit-intent popup

**Aprašymas:** Kai žmogus nori uždaryti puslapį (pelė eina link naršyklės "X" mygtuko), pasirodo popup su pasiūlymu: "Palaukite! Išbandykite PixelForge nemokamai 30 dienų." Su email laukeliu arba tiesioginiu mygtuku į registraciją.

**Privalumai:** Pagauna žmones, kurie jau beišeina — paskutinė galimybė
**Trūkumai:** Gali erzinti kai kuriuos lankytojus, neveikia mobiliuosiuose

---

### Variantas C: Hero perdarkymas — registracijos forma tiesiai puslapyje

**Aprašymas:** Vietoj "Get started free" mygtuko, padaryti mini registracijos formą tiesiai hero sekcijoje: email laukelis + "Pradėti nemokamai" mygtukas. Vienu paspaudimu žmogus patenka į registraciją su jau įvestu email.

**Privalumai:** Sumažina žingsnius iki registracijos, labai efektyvu
**Trūkumai:** Hero sekcija tampa sudėtingesnė vizualiai

---

### Variantas D: Chatbot / Live demo mygtuktas

**Aprašymas:** Pridėti floating mygtuką "Pabandyti demo" apatiniame dešiniajame kampe. Paspaudus — atidaro demo versiją su jau užpildytomis nuotraukomis ir pilnu workflow (upload → select → deliver). Žmogus gali pasibandyti prieš registruodamasis.

**Privalumai:** Labai įtikinamai, žmogus pamato vertę prieš registraciją
**Trūkumai:** Reikia sukurti demo režimą, daugiau darbo

---

### 🏆 Mano rekomendacija:

Rekomenduoju **daryti kartu A + C variantus**:
1. **Variantas C** (email laukelis hero sekcijoje) — greitas pakeitimas, iškart pagerina konversiją pagrindiniame puslapyje
2. **Variantas A** (atskiras landing page reklamai) — kai paleisime naują Meta kampaniją ne tik Lietuvai, šis puslapis bus optimizuotas būtent reklaminio srauto konversijai

Bet sprendimas tavo — pasirinksim ką nori ir padarysim!

---

## Meta Ads / Marketing TODO (ateičiai)

- ⬜ Meta paskyros verifikacija (asmens dokumentas)
- ⬜ Nauja Meta kampanija — ne tik Lietuva (Latvija, Estija, Lenkija?)
- ⬜ Instagram profilio sukūrimas ir postai
- ⬜ Facebook posto užbaigimas su paveikslėliu
- ⬜ Google Analytics integracija dashboard'e

---

*Šį dokumentą atnaujinsime kiekvieną kartą kai atliksime punktą.*
