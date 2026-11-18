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

A katalógus adatállománya a release része. Az EUR/HUF árfolyam külön, indításkor és óránként frissül. A Signeda termékárak nem frissülnek automatikusan közvetlenül a weboldalról; a mentett lekérési idő szerepel mellettük. A teljes képgaléria- és katalóguslefedettség még nincs igazolva.
