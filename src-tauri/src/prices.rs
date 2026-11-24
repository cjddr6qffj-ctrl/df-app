use reqwest::blocking::Client;
use scraper::{Html, Selector};
use serde_json::{json, Value};
use std::{io::Read, sync::Mutex, time::{Duration, Instant, SystemTime}};

const UA: &str = "DFTuningCatalog";
#[derive(Default)]
pub struct PriceClient(Mutex<Session>);
#[derive(Default)]
struct Session { last: Option<Instant>, robots: Option<(String, Instant)>, blocked: Option<Instant>, delay: u64 }

fn client() -> Result<Client, reqwest::Error> {
    let _ = rustls::crypto::ring::default_provider().install_default();
    Client::builder().user_agent("DFTuningCatalog/0.1 (Mustang price refresh)").redirect(reqwest::redirect::Policy::none()).timeout(Duration::from_secs(20)).build()
}
fn allowed_url(raw: &str) -> bool {
    let Ok(url) = reqwest::Url::parse(raw) else { return false; };
    url.scheme()=="https" && url.host_str()==Some("www.signeda.lt") && url.port().is_none()
        && url.username().is_empty() && url.password().is_none() && url.query().is_none()
        && url.fragment().is_none() && url.path().rsplit_once("-p").is_some_and(|(_,id)| !id.is_empty() && id.bytes().all(|c|c.is_ascii_digit()))
}
fn amount(text: &str) -> Option<f64> {
    let number=text.split_once('€')?.0.trim();
    if !number.chars().all(|c| c.is_ascii_digit() || c.is_whitespace() || c==',' || c=='.') { return None; }
    let mut s:String=number.chars().filter(|c|!c.is_whitespace()).collect();
    if s.contains(',') && s.contains('.') {
        let decimal=if s.rfind(',')>s.rfind('.') {','} else {'.'};
        let thousands=if decimal==',' {'.'} else {','};
        let (whole,fraction)=s.rsplit_once(decimal)?;
        if fraction.len()!=2 || !fraction.bytes().all(|c|c.is_ascii_digit()) {return None;}
        let groups:Vec<_>=whole.split(thousands).collect();
        if groups[0].is_empty() || groups[0].len()>3 || groups.iter().skip(1).any(|g|g.len()!=3) {return None;}
        s=format!("{}.{}",groups.join(""),fraction);
    } else {s=s.replace(',',".");}
    let parts:Vec<_>=s.split('.').collect();
    if parts.len()>2 || parts[0].is_empty() || (parts.len()==2&&(parts[1].is_empty()||parts[1].len()>2)) {return None;}
    let n=s.parse::<f64>().ok()?;
    (n.is_finite()&&n>=0.0&&n<=100_000_000.0).then_some(n)
}
fn parse_price(html: &str, sku: &str) -> Result<f64, String> {
    let doc=Html::parse_document(html);
    let heading=doc.select(&Selector::parse("h1").unwrap()).next().map(|e|e.text().collect::<String>()).unwrap_or_default();
    if heading.split_whitespace().last()!=Some(sku) {return Err("Az oldal nem a kért terméket tartalmazza; a régi ár megmaradt.".into());}
    let selector=Selector::parse(".product-page__content__product-data__product-actions__content__selected-price__price").unwrap();
    let nodes:Vec<_>=doc.select(&selector).collect();
    if nodes.len()!=1 {return Err("Nem azonosítható egyértelmű termékár.".into());}
    amount(&nodes[0].text().collect::<String>()).ok_or("Nem olvasható EUR termékár; a régi ár megmaradt.".into())
}
impl Session {
    fn fetch(&mut self, client:&Client, url:&str, limit:u64) -> Result<String,String> {
        for attempt in 0..3 {
            if self.blocked.is_some_and(|until|Instant::now()<until) {return Err("STOP: A forrás ideiglenesen korlátozza a lekérést. Próbáld később.".into());}
            let delay=Duration::from_secs(self.delay.max(5));
            if let Some(last)=self.last {std::thread::sleep(delay.saturating_sub(last.elapsed()));}
            self.last=Some(Instant::now());
            let response=client.get(url).send();
            match response {
                Ok(mut response)=>{
                    let status=response.status().as_u16();
                    if status==403 || status==429 {
                        let retry=response.headers().get("retry-after").and_then(|h|h.to_str().ok()).and_then(|v|v.parse::<u64>().ok().or_else(||httpdate::parse_http_date(v).ok().map(|t|t.duration_since(SystemTime::now()).unwrap_or_default().as_secs()))).unwrap_or(3600).max(60);
                        self.blocked=Instant::now().checked_add(Duration::from_secs(retry)).or_else(||Instant::now().checked_add(Duration::from_secs(3153600000)));
                        return Err(format!("STOP: Signeda HTTP {status}. Az árfrissítés leállt; az utolsó ismert árak megmaradtak."));
                    }
                    if status>=500 && attempt<2 {std::thread::sleep(Duration::from_secs(2_u64.pow(attempt+1)));continue;}
                    if status!=200 {return Err(format!("HTTP {status}: az ár nem frissült."));}
                    if response.content_length().is_some_and(|n|n>limit) {return Err("Túl nagy válasz.".into());}
                    let mut bytes=Vec::new();response.by_ref().take(limit+1).read_to_end(&mut bytes).map_err(|e|e.to_string())?;
                    if bytes.len() as u64>limit {return Err("Túl nagy válasz.".into());}
                    let text=String::from_utf8(bytes).map_err(|_|"Nem olvasható válasz.")?;
                    if text.contains("cf-chl-") || text.contains("Performing security verification") || text.contains("Just a moment...") {
                        self.blocked=Some(Instant::now()+Duration::from_secs(3600));
                        return Err("STOP: A Signeda biztonsági ellenőrzést kér. A korábbi árak megmaradtak.".into());
                    }
                    return Ok(text);
                },
                Err(_) if attempt<2=>std::thread::sleep(Duration::from_secs(2_u64.pow(attempt+1))),
                Err(_)=>return Err("STOP: A Signeda nem érhető el. A korábbi árak megmaradtak.".into())
            }
        }
        Err("Sikertelen lekérés.".into())
    }
    fn price(&mut self,url:&str,sku:&str)->Result<Value,String>{
        if !allowed_url(url)||sku.is_empty()||sku.len()>100 {return Err("Tiltott termékhivatkozás.".into());}
        let client=client().map_err(|e|e.to_string())?;
        if self.robots.as_ref().is_none_or(|(_,at)|at.elapsed()>Duration::from_secs(3600)) {
            let rules=self.fetch(&client,"https://www.signeda.lt/robots.txt",512000).map_err(|e|format!("STOP: A robots-szabályok nem ellenőrizhetők. {e}"))?;
            if !rules.lines().any(|l|l.to_lowercase().starts_with("user-agent:")) {return Err("STOP: Nem olvasható robots.txt.".into());}
            // Conservative: respect the largest declared crawl delay, even from another agent group.
            self.delay=rules.lines().filter_map(|l|{let (key,value)=l.split_once(':')?;if key.trim().eq_ignore_ascii_case("crawl-delay"){value.split('#').next()?.trim().parse::<f64>().ok().map(|v|v.ceil() as u64)}else{None}}).max().unwrap_or(5).max(5);
            if self.delay>3600 {return Err("STOP: A forrás túl hosszú várakozást ír elő.".into());}
            self.robots=Some((rules,Instant::now()));
        }
        if !robotstxt::DefaultMatcher::default().one_agent_allowed_by_robots(&self.robots.as_ref().unwrap().0,UA,url) {return Err("STOP: A robots.txt nem engedélyezi ezt a lekérést.".into());}
        let html=self.fetch(&client,url,5_000_000)?;
        let price=parse_price(&html,sku)?;
        Ok(json!({"sku":sku,"url":url,"price":price,"currency":"EUR"}))
    }
}
#[tauri::command]
pub async fn check_product_price(app:tauri::AppHandle,url:String,sku:String)->Result<Value,String>{
    use tauri::Manager;
    tauri::async_runtime::spawn_blocking(move||app.state::<PriceClient>().0.lock().map_err(|_|"Árfrissítő zárolási hiba.".to_string())?.price(&url,&sku)).await.map_err(|e|e.to_string())?
}
#[cfg(test)]
mod tests {
 use super::*;
 #[test] fn tls_client_builds(){assert!(client().is_ok());}
 #[test] fn robots_rules_are_enforced(){let rules="User-agent: *\nDisallow: /private/\n";let mut matcher=robotstxt::DefaultMatcher::default();assert!(!matcher.one_agent_allowed_by_robots(rules,UA,"https://www.signeda.lt/private/item-p1"));assert!(matcher.one_agent_allowed_by_robots(rules,UA,"https://www.signeda.lt/item-p1"));}
 #[test] fn exact_product_only(){let html="<h1>LAMPA ABC</h1><div class='product-page__content__product-data__product-actions__content__selected-price__price'>81.40€<span>21% PVM</span></div><p>Old price 99.00€</p>";assert_eq!(parse_price(html,"ABC"),Ok(81.4));assert!(parse_price(html,"AB").is_err());assert!(parse_price("<h1>ABC</h1><p>Related 10€</p>","ABC").is_err());}
 #[test] fn decimal_formats(){for (s,n) in [("1,234.56€",1234.56),("1.234,56€",1234.56),("1 234,56€",1234.56),("0.00€",0.0)]{assert_eq!(amount(s),Some(n));}for s in ["1,23,4.56€","N/A","-10€","12.345€"]{assert_eq!(amount(s),None);}}
 #[test] fn only_public_product_urls(){assert!(allowed_url("https://www.signeda.lt/test-p123"));for u in ["http://www.signeda.lt/test-p1","https://evil.test/test-p1","https://www.signeda.lt/test-p1?x=1","https://user@www.signeda.lt/test-p1","https://www.signeda.lt/admin/"]{assert!(!allowed_url(u));}}
}
