# Signeda adatforrás-felmérés

Ellenőrzés: 2026-11-12. Nem teljes katalógusfeltérképezés.

- A https://www.signeda.lt/robots.txt közvetlen HTTP lekérése 403 / Cloudflare challenge választ adott. Nem került sor a védelem megkerülésére, belépésre vagy tömeges termékletöltésre.
- A feltételek és a robotokra vonatkozó szabályok így nem igazolhatók. Stabil, dokumentált nyilvános JSON API nem volt igazolható. Az engedélyezett API-címek nincsenek kitalálva vagy beégetve.
- A webes kereső által indexelt nyilvános termékoldal példája: https://www.signeda.lt/variklio-apdaila-pfd99918ca-p38333 . Látható mezők: PFD99918CA cikkszám, VARIKLIO APDAILA megnevezés, OE gyártó, 5277749 OEM, Mustang 2015–2017 kompatibilitás, ár és készlet. A kereső indexe nem bizonyít élő készletet vagy aktuális árat; ezek az adatok nincsenek valós ajánlatként a demóba emelve.
- További nyilvános oldalak: https://www.signeda.lt/kapotas-pfd20209agt-p409789 és https://www.signeda.lt/asortimento-naujiena-2024-mustang-originalios-ir-kitos-dalys?fc=1382 .
- A nyilvános partneroldal: https://www.signeda.lt/en/bbef21fe07f7cd3357dd41cf291f0f4a?model_id=349 . Partneri feed/API lehetőségét a Signedával kell tisztázni; elérhetősége nincs igazolva.

Következő adatforrás-lépés: export vagy dokumentált JSON feed és a felhasználási feltételek ellenőrzése. A meglévő import/szinkron rétegnek normalizált termékrekordokat kell adni. Az MVP nem HTML-scraper és nem tölti le automatikusan a Signeda teljes katalógusát.
