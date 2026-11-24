# DF Tuning kiadás

A fejlesztői előnézet: `npm run dev -- --port 1420`. Ez nem tesz közzé kiadást.

A `Release installers` GitHub Actions folyamat kézzel indítható. A tag (`v0.1.1`) egyezzen a package.json, src-tauri/Cargo.toml és tauri.conf.json verziójával. Mac ARM64, Mac Intel és Windows x64 csomagot készít, és piszkozatként csatolja a GitHub Release-hez. A piszkozat közzététele teszi elérhetővé az automatikus frissítést.

Repo beállítások:
- Secret: TAURI_SIGNING_PRIVATE_KEY (a helyi .release/updater.key tartalma).
- Variable: DF_UPDATE_PUBLIC_KEY (a .release/updater.key.pub tartalma).
- A privát aláírókulcsot ne tedd a repóba, telepítőbe vagy nyilvános mentésbe. Biztonsági másolata szükséges a későbbi frissítésekhez.

Az updater minden natív indításkor ellenőrzi a latest.json fájlt. Új verzió esetén letölti, aláírás alapján ellenőrzi, telepíti és újraindítja az appot. Hálózati hiba esetén az aktuális verzió használható marad. A webes előnézet nem frissíti magát.

GitHub nélküli HTTPS-tárhely is használható: DF_UPDATE_URL a verziómanifest címe. A manifest és csomagok feltöltése után ugyanaz az updater működik. Titkos GitHub-token nem kerül a kliensbe.

Az updater aláírása nem Apple Developer / Windows Authenticode aláírás. Ezekhez külön fejlesztői tanúsítványok szükségesek; enélkül az operációs rendszer megjeleníthet ismeretlen kiadóra vonatkozó figyelmeztetést.

A katalógus adatállománya a release része. Az EUR/HUF árfolyam külön, indításkor és óránként frissül. A 0.1.2 natív háttérben ellenőrzi a régi Signeda-termékárakat; robots- vagy HTTP-tiltásnál leáll, és megőrzi az utolsó adatokat. A teljes élő árfrissítés sikere még nincs igazolva. A teljes képgaléria- és katalóguslefedettség még nincs igazolva.

## Külön demoalkalmazás

`npm run bundle:demo` külön `DF Tuning Demo` alkalmazást készít (`hu.dftuning.catalog.demo`, 0.1.2-dev), saját adatbázissal. A demo build mód nem tölti be a production updater-kapcsolót; release-frissítést nem telepít. A termékár-frissítés viszont natívan bekapcsolt, és forrásoldali blokkolásnál leáll. A demo nem kerül automatikusan a GitHub Releases oldalra.

A fejlesztői árfrissítő natív parser/URL-tesztjei: `cd src-tauri && cargo test --lib`. Teljes élő Signeda-frissítés és Windows-futtatás még külön igazolandó. A publikus 0.1.1 kiadás csak a korábbi helyi feedet olvassa.

## Újdonságok és telepítési ellenőrzés

A `src/release-notes.ts` rövid magyar újdonságokat tartalmaz. A kiadásellenőrzés megköveteli az egyező verziót. Első indításkor az új verzióhoz egyszer jelenik meg, a bezárás helyben mentődik.

`node scripts/verify-updater.mjs delivery/release-v0.1.1` ellenőrzi mindkét Mac-architektúra és a Windows EXE/MSI kriptográfiai aláírását a kliens publikus kulcsával, valamint a sérült tartalom elutasítását. Ez nem tényleges telepítési vagy adatmegőrzési próba.

2026-11-24: mind a négy csomag aláírása megfelelő. A GitHubon a 0.1.1 a közzétett kiadás; új release nem készült. A két verzió közötti tényleges frissítés és a Windows-futtatás még ellenőrizendő. A gépen nincs érvényes Apple codesigning identity. Hivatalos terjesztéshez Developer ID Application és notarization, Windowson külön kódaláírás szükséges. SmartScreen reputációs figyelmeztetés aláírt új alkalmazásnál is előfordulhat.
