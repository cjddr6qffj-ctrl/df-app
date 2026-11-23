# DF Tuning Desktop — Mustang MVP

Magyar nyelvű, sötét/neonzöld Tauri 2 + React + TypeScript alkalmazás. Desktop módban SQLite; a gyors böngészős előnézetben localStorage. A Tauri az operációs rendszer webnézetét használja, ezért nem csomagol külön Chromiumot, mint az Electron. A desktop buildhez Rust szükséges.

**Katalógus:** 2031 aktív Signeda Mustang tétel, mindegyikhez mentett EUR árral. 2192 helyi kép, 1873 terméknél legalább egy fotó; a teljes képgaléria és katalógus lefedettsége még nincs igazolva. A termékárak mellett a tényleges lekérési idő látható. Az EUR/HUF referenciaárfolyam minden indításkor és óránként frissül, offline mentéssel.

**Letöltés:** [DF Tuning kiadások](https://github.com/cjddr6qffj-ctrl/df-app/releases). Az új verziók először kiadási piszkozatként készülnek; a közzétett kiadásokat a telepített kliens induláskor automatikusan ellenőrzi. [Kiadási útmutató](docs/RELEASE.md).

A modellválasztó külön kezeli a 2005–2009, 2010–2014, 2015–2017, 2018–2023 és 2024+ időszakot. Ezek vizuális szűrőcsoportok: az eredeti alkatrész-kompatibilitást nem írják át. A PNG-k generált modellillusztrációk, nem alkatrészfotók.

## Gyors kipróbálás

Node.js 22 LTS vagy újabb:

```sh
npm ci
npm run dev
```

Nyisd meg a kiírt helyi címet. A böngészős mód fejlesztői előnézet, nem telepíthető/offline PWA. A desktop csomag a teljes felületet helyben tartalmazza, internet nélkül is indul.

```sh
npm test
npm run build
```

## Desktop indítás és telepítő

Hivatalos előfeltételek: https://v2.tauri.app/start/prerequisites/

macOS:

1. Telepítsd az Xcode Command Line Tools csomagot (`xcode-select --install`).
2. Telepítsd a Rust stable toolchaint a https://rustup.rs útmutatója szerint.
3. A projekt könyvtárában: `npm ci`, majd `npm run desktop`.
4. `npm run bundle` → `src-tauri/target/release/bundle/` alatt `.app` és `.dmg`.

Windows 10/11:

1. Node.js 22+, Rust stable MSVC toolchain.
2. Visual Studio Build Tools: Desktop development with C++, Windows SDK.
3. Microsoft Edge WebView2 Runtime.
4. PowerShellben a projekt könyvtárában: `npm ci`, `npm run desktop`.
5. `npm run bundle` → a bundle mappában MSI/NSIS telepítő (a Tauri eszközeitől függően).

A platformhoz tartozó telepítőt az adott rendszeren készítsd. A mellékelt manuálisan indítható GitHub Actions workflow macOS és Windows buildet készít, ha **ennek a projektmappának a tartalma kerül a repository gyökerébe**. A kiadási workflow külön Mac ARM64, Mac Intel és Windows x64 csomagot készít. Aláírás/notarizálás és Windows code signing a nyilvános terjesztés előtt külön beállítandó.

## Elkészült funkciók

- Magyar főoldal, katalógus, adatkezelési oldal, mentett kedvencek.
- Keresés név, márka, cikkszám, OEM és HU/EN/LT/DE szinonimák alapján. Ékezet- és cikkszám-elválasztó tolerancia.
- S197 (2005–2014), S550 (2015–2023), S650 (2024+) generáció, évjárat, kategória, rendelhetőség szerinti szűrés; név/ár rendezés.
- Termékadatlap, lapozható képgyűjtemény, eredeti/magyar név, kompatibilitási megjegyzés, külső Signeda-link.
- Helyi perzisztencia, induláskori helyi feed-ellenőrzés és kézi frissítés. Nincs hamis „élő ár” állapot.
- JSON import sémavizsgálattal, Mach-E kizárással és azonosító szerinti részleges frissítéssel. Az első import eltávolítja a bemutató adatokat. Az import nem törli a hiányzó valós termékeket.
- Beágyazott képek: a desktop SQLite-ban, offline is hozzáférhetők. Távoli URL-es képet az import nem fogad el.

A bemutató cikkszámok/OEM-ek/árak/készletek kitaláltak. A rajzok helyi sematikus illusztrációk. A valós termékek Base/V6/EcoBoost/GT/PP kompatibilitását a `fitment` mezőben kell megőrizni, évjáratból nem következtetünk rá.

## Import és adatmodell

A `docs/demo-feed.json` az Adatkezelés oldalon importálható mintafájl. Hiteles forrásból származó adatoknál `source: "signeda"`, valós `checkedAt`, pontos Signeda terméklink és a helyes ár/pénznem szükséges. Ismeretlen ár: `null`; ismeretlen készlet: `unknown`, nem `unavailable`. A magyar megnevezés és fordítás a forrásadapter feladata; a keresőszinonimák nem teljes körű gépi fordítások.

A teljes séma a `src/model.ts` fájlban található. Fő mezők: `id`, `sku`, `oem[]`, `name`, `nameHu`, `aliases[]`, `category`, `generation`, `yearFrom`, `yearTo`, `model: "Ford Mustang"`, `fitment`, `brand`, `price`, `currency`, `availability`, `images[]`, `url`, `source`, `checkedAt`.

Képek: PNG/JPEG/WebP base64 data URL, maximum 100 kép/termék, kb. 2 MB/kép. Import: maximum 40 MB és 20 000 rekord. Ezek MVP-korlátok; teljes katalógushoz külön fájlos képtár és SQLite terméktábla/FTS-index szükséges. Jelenleg a validált katalógus JSON-ként tárolódik SQLite-ban; a keresés memóriában történik. Nagy katalógusra nincs teljesítménygarancia.

## Külső szinkronmodul

A `scripts/sync.ts` **jóváhagyott, normalizált JSON termékvégpontokhoz** készült, nem a Signeda HTML-jéhez. Nincs előre megadott működő Signeda API. Bekötéséhez dokumentált feed vagy adapter szükséges. A demó teljes funkcionalitással használható enélkül.

1. Ellenőrizd a forrás feltételeit, készíts egy engedélyezett végpontlistát.
2. Másold a `docs/sync.config.example.json` fájlt `sync.config.json` néven, töltsd ki valós adatokkal. A feltételvizsgálat legfeljebb 30 napos lehet. A konfiguráció nem jogi engedély; azt előzetesen tisztázni kell.
3. A végpontok egy-egy normalizált termékrekordot adnak vissza, opcionális `imageUrls` listával. Minden kép külön engedélyezett HTTPS hoston lehet.
4. `npm run sync -- sync.config.json`.
5. A kimeneti `catalog-feed.json` fájlt importáld, vagy helyezd a Tauri app data könyvtárába. Alapesetben macOS: `~/Library/Application Support/hu.dftuning.catalog/`; Windows: `%APPDATA%\hu.dftuning.catalog\`.

Működés: soros kérések, minimum 3 másodperc (alapérték 5), robots.txt kötelező ellenőrzés, Crawl-delay tisztelete, 20 másodperces timeout, legfeljebb 3 próbálkozás, exponenciális visszavárás és legfeljebb 120 másodpercig figyelembe vett Retry-After. 403/404 esetén nincs retry; ismeretlen vagy tiltott robots szabály esetén nincs letöltés. Redirect nem követhető. Korlátozott válaszméret; képek URL-hash szerinti 7 napos fájlcache-ben. Csak megbízható, nyilvános hostokat konfigurálj.

A hibás termék régi rekordját megőrzi, a sikereseket frissíti. A készlet eltűnésből nem következtethető ki. Atomi átnevezéssel teszi közzé a feedet, napló `.report.json`, párhuzamos futást `.lock` gátolja. Megszakított folyamat után a `.lock` fájlt csak akkor töröld, ha nincs futó szinkron. Kilépési kód 2: részleges hiba; 1: konfiguráció/fatális hiba. A képkorlát túllépése nem írja felül a korábbi feedet.

**Az alkalmazás induláskor a helyi feedet olvassa újra. A külső hálózati szinkronizáló nincs automatikusan elindítva vagy időzítve.** Ez az élő forrás ellenőrzésének hiányában szándékos; valódi induláskori árfrissítéshez még a jóváhagyott forrás bekötése szükséges.

## Ellenőrzés és korlátok

A tesztek keresést, invalid importot, generációt, Mach-E kizárást, backoffot, Retry-After-t és részleges frissítést fednek le. A `npm run build` TypeScript ellenőrzést és production frontend buildet végez. Natív fordítás és a valódi hálózati feed integrációja külön ellenőrzendő.

Nincs rendelésleadás, fizetés, felhasználói belépés, automatikus háttérszolgáltatás vagy teljes Signeda-katalógus. A kedvencek helyi listát alkotnak. A helyi adatok törlése az adott alkalmazás-adatmappa törlésével történik; ezt a program nem végzi automatikusan.
