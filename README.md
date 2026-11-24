# DF Tuning Desktop — Mustang MVP

Magyar nyelvű, sötét/neonzöld Tauri 2 + React + TypeScript alkalmazás. Desktop módban SQLite; a gyors böngészős előnézetben localStorage. A Tauri az operációs rendszer webnézetét használja, ezért nem csomagol külön Chromiumot, mint az Electron. A desktop buildhez Rust szükséges.

**Katalógus:** 2031 aktív Signeda Mustang tétel, mindegyikhez mentett EUR árral. 2195 helyi kép, 1876 terméknél legalább egy fotó; a teljes képgaléria és katalógus lefedettsége még nincs igazolva. A termékárak mellett a tényleges lekérési idő látható. Az EUR/HUF referenciaárfolyam minden indításkor és óránként frissül, offline mentéssel.

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

**A fejlesztői desktop kliens induláskor automatikusan ellenőrzi a 24 óránál régebbi EUR termékárakat.** A nyilvános 0.1.1 kiadás ezt még nem tartalmazza. A natív `check_product_price` kizárólag Signeda-termékoldalakat kér le, ellenőrzi a robots.txt-t és a pontos cikkszámot, és kizárólag a kiválasztott termék EUR árát olvassa. Minimum 5 másodperces ütemezés, három próbálkozás átmeneti hibára, 403/429/biztonsági ellenőrzés esetén leállás. A sikeres árak külön SQLite-állapotba kerülnek; a kép/OEM/illeszkedési mezők változatlanok. Újraindításkor a még régi árakkal folytatódik. A teljes katalógus ideje legalább kb. 3 óra, a hálózattól és előírt várakozástól függően. Az ablak bezárása leállítja a munkát; a böngészős előnézetben nincs natív árlekérés. A helyi JSON-feed importálása továbbra is működik.

A Signeda legutóbbi biztonsági korlátozása miatt sikeres teljes élő frissítés még nincs igazolva. Nem használunk böngészős sütiket, CAPTCHA-megkerülést vagy rejtett végpontot. Tartós hozzáférési korlátozás esetén Signeda által biztosított API/feed vagy a DF Tuning kliens engedélyezése szükséges. A parser és hibakezelés helyi tesztjei hálózati lekérés nélkül futnak.

A robots-illesztés a [robotstxt könyvtárat](https://docs.rs/robotstxt/0.3.0/robotstxt/) használja; a HTML mezőket a [scraper](https://docs.rs/scraper/0.24.0/scraper/) olvassa.

## Ellenőrzés és korlátok

A tesztek keresést, invalid importot, generációt, Mach-E kizárást, backoffot, Retry-After-t és részleges frissítést fednek le. A `npm run build` TypeScript ellenőrzést és production frontend buildet végez. A natív Mac-fordítás és az 5 natív árfrissítőteszt sikeres; a 25 alkalmazásteszt is sikeres. A teljes élő Signeda-ellenőrzés és a Windows-futtatás külön igazolandó.

Nincs rendelésleadás, fizetés, felhasználói belépés, automatikus háttérszolgáltatás vagy teljes Signeda-katalógus. A kedvencek helyi listát alkotnak. A helyi adatok törlése az adott alkalmazás-adatmappa törlésével történik; ezt a program nem végzi automatikusan.

### Katalógus ellenőrzése és folytatása

`npm run catalog:build` újraépíti a mentett Signeda-adatokból a katalógust, majd ellenőrzi az adatmodellt és minden hivatkozott WebP fájlt. A korábban csomagolt, bővebb galéria akkor is megmarad, ha az ideiglenes letöltések már hiányoznak. A régi letöltési mappa opcionálisan a `DF_LEGACY_DOWNLOADS` változóval adható meg.

`npm run catalog:audit` csak helyi ellenőrzést végez. A `data/signeda/catalog-audit.json` külön felsorolja a hiányzó képeket, OEM-adatokat, árakat és 24 óránál régebbi árakat. A `repair-queue.json` a hiányzó fotókat veszi előre. Az üres kezdeti galéria nem bizonyítja, hogy a forrásnál nincs kép. A teljes lefedettséget csak új forrásoldali összevetés igazolhatja.

2026-11-23: 29 termék ára újraellenőrizve; 5 megváltozott ár, 43 további OEM-hivatkozás és 3 új fotó mentve. A további böngészős lekéréseket a Signeda biztonsági ellenőrzése megállította. A teljes galériaellenőrzés még nincs kész. Az automatikus árfrissítő a fejlesztői változatba bekerült, de sikeres élő frissítése még nincs igazolva. Ezek fejlesztői változtatások; a nyilvános 0.1.1 telepítő nem változott.

### OEM- és kivitelszűrés

A pontos OEM-egyezés elválasztó- és kisbetű/nagybetű-független. Pontos egyezésnél az OEM-találatok jelennek meg; az aktív szűrők feloldhatók az Összes OEM-találat gombbal. Az adatlapon kattintható OEM-ek és közvetlenül közös OEM-mel listázott termékek láthatók. Nem alkalmazunk tranzitív helyettesítést, és az OEM-egyezés nem VIN-szintű illeszkedési bizonyíték.

A kivitel szűrése csak a Modelio detalės mező egyértelmű, önálló kiviteljelölését használja. Kizárásos, évjáratos és összetett szövegből nem következtetünk. Az ismeretlen kivitelű tételek külön elrejthetők. A Performance Package megfelelést igazolt adat hiányában nem állítjuk. A helyi katalógusban hiányzó OEM-ek pótlása továbbra is forrásadatot igényel.

Az OEM- és kivitelváltoztatások után 29 alkalmazásteszt sikeres. Böngészős próba: JR3B-17B613-A → PFDB2014A és PFDB2055A; közös OEM-navigáció és GT-szűrő ellenőrizve.

### Árajánlatok (fejlesztői változat)

A termékkép bal felső + gombja az aktív ajánlathoz adja a terméket; ismételt hozzáadás növeli a mennyiséget. Az Ajánlatok (0/1) gomb az oldalsáv alján nyitja az ajánlatokat. A szürke állapotban is elérhető a mentett lista. A vevő neve és telefonszáma szerkeszthető; a magyar megnevezés átírható. Cikkszám/OEM nem kerül az ajánlatba és PDF-be.

A felhasználó kérése szerint a Signeda-ár **nettó ajánlati alapár**, levonás nélkül; ez az ajánlat üzleti beállítása. Az EUR ár a hozzáadáskori, ajánlathoz rögzített EUR/HUF árfolyammal alakul át HUF-ra. A nettó vagy bruttó egységár szerkesztése megőrzi a legutóbb bevitt oldal értékét, és számítja a másikat. Az áfa alapértelmezetten 27%, szerkeszthető. Az ajánlatszintű százalékos kedvezmény az összesítőben érvényesül, az egységárak kedvezmény előttiek. Hiányzó ár/árfolyam nem válik automatikusan nullává. A 0-s ár tudatosan beírható. Maximum 500 sor, 9999 darab/sor és 10 millió Ft egységár.

Az ajánlatok automatikusan a helyi SQLite állapotba mentődnek (`quotes-v1`); böngészőben localStorage. A Mentés gomb a listára teszi az ajánlatot, a Lezárás írásvédetté teszi, a Szerkesztés újra feloldja. Törlés egyenként vagy kijelöléssel, megerősítéssel. Sorszám: DF-év-hatjegyű számláló, a törlés nem használja újra a sorszámot. A sorszám helyi telepítésenként értendő; nincs több gép közötti ajánlatszinkron.

A PDF-export a desktop kliensben az operációs rendszer Asztal mappájába ment, vevőnévvel és ajánlatszámmal, meglévő fájl felülírása nélkül. A böngészős előnézet letöltést indít. A PDF beágyazott magyar betűtípust, fekete, átlátszó hátterű DF-logót és többoldalas táblázatot használ. A betűtípus licence: `public/fonts/LICENSE-DejaVu.txt`. A PDF nem számla; nincs benne kitalált céges cím vagy adószám.

Ellenőrzés: 35 alkalmazásteszt, 7 natív teszt; böngészőben hozzáadás, nettó/bruttó átszámítás, kedvezmény, mentés, újratöltés, lezárás és tényleges PDF-letöltés. Egy- és többoldalas PDF-ek képként renderelve ellenőrizve.

### Megszakítás után folytatható képpótlás

`node scripts/audit-source-coverage.mjs` összeveti a mentett kategóriaoldalakat a katalógussal, és előállítja a képhiányok listáját. Ez nem bizonyítja az aktuális élő kínálat teljességét.
`node scripts/recover-images.mjs` először ellenőrzi a robots-szabályokat, majd legfeljebb 25 ismert képet tölt le, legalább 5 másodperces szünetekkel. HTTP 401/403/429 esetén leáll. Minden képet és haladást külön ment; újraindítva átugorja a már meglévő képeket.
Sikeres letöltés után `npm run catalog:build` beemeli őket. A `data/signeda/image-recovery-progress.json` tartalmazza a megállás okát és a kész letöltéseket.

### Saját DF nettó árak

Az Árazás menüben a nyilvános teljes nettó és a DF beszerzési nettó ár között lehet váltani, 0–1000% felárral. Az ajánlat a kiválasztott nettó árból készül, 27% áfával. A már mentett ajánlatok árai nem változnak. Hiányzó DF-ár esetén nincs nyilvánosár-helyettesítés.

A saját árak nem részei a repónak vagy a telepítőnek. A natív app induláskor a saját adatkönyvtárából olvassa a `df-private-prices.json` fájlt, ellenőrzi, majd helyi SQLite-ba menti. macOS: `~/Library/Application Support/hu.dftuning.catalog/`; Windows: `%APPDATA%/hu.dftuning.catalog/`. A demó azonosítója `.demo` végű. Formátum: termékazonosítóval kulcsolt objektum, értékei `sku`, a katalógus szerinti `url`, `price` (nettó EUR), `currency: "EUR"`, `checkedAt` (ISO dátum). Régebbi bejegyzés nem ír felül frissebbet. Új gépen a saját állományt külön, biztonságosan kell átadni, és az appot újraindítani.

2026-11-24: 2031 katalógustételből 2026-hoz ellenőrzött DF-ár. A Signeda keresőjében RTEDC00082, RTEDC00065, RTEDC00066, RTEDC00089 és RAEDC00285 nem mutatott árat. A DF-árak mentett pillanatképek: a nyilvános háttérfrissítés nem frissíti a bejelentkezéshez kötött árakat. A bejelentkezett munkamenet és jelszó nem kerül a kliensbe.
