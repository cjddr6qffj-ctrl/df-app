mod quote_export;
mod prices;
use tauri::Manager;
#[tauri::command]
fn read_feed(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("catalog-feed.json");
    match std::fs::metadata(&path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
        Ok(meta) => {
            if meta.len() > 40_000_000 { return Err("A szinkronfájl túl nagy (maximum 40 MB).".into()); }
            std::fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
        }
    }
}
#[tauri::command]
fn read_df_prices(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app.path().app_data_dir().map_err(|e| e.to_string())?.join("df-private-prices.json");
    match std::fs::metadata(&path) {
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
        Ok(meta) => {
            if meta.len() > 5_000_000 { return Err("A DF-árfájl túl nagy.".into()); }
            std::fs::read_to_string(path).map(Some).map_err(|e| e.to_string())
        }
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .manage(prices::PriceClient::default())
        .invoke_handler(tauri::generate_handler![read_feed, read_df_prices, prices::check_product_price, quote_export::save_quote_pdf])
        .run(tauri::generate_context!())
        .expect("Nem indítható a DF Tuning alkalmazás");
}
