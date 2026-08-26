//! Cliente HTTP pro VSFood web. O app NUNCA fala com o Supabase diretamente
//! (nunca vê a service role) — só chama /api/print/* com o token do próprio
//! dispositivo no header Authorization. Ver README.md, seção "Segurança".

use crate::models::{DeviceInfoResponse, NextJobResponse, PairResponse};
use serde_json::json;
use std::time::Duration;

/// URL base do VSFood web. Configurável via env `VSFOOD_API_BASE_URL` (útil
/// pra testar contra um preview/localhost); em produção usa o domínio real.
fn base_url() -> String {
    std::env::var("VSFOOD_API_BASE_URL").unwrap_or_else(|_| "https://vsfood.vercel.app".to_string())
}

fn client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .expect("falha ao construir cliente HTTP")
}

pub async fn pair(code: &str, device_name: &str, platform: &str, app_version: &str) -> Result<PairResponse, String> {
    let res = client()
        .post(format!("{}/api/print/pair", base_url()))
        .json(&json!({ "code": code, "deviceName": device_name, "platform": platform, "appVersion": app_version }))
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    res.json::<PairResponse>().await.map_err(|e| format!("Resposta inesperada do servidor: {e}"))
}

pub async fn heartbeat(token: &str, app_version: &str, platform: &str) -> Result<(), String> {
    let res = client()
        .post(format!("{}/api/print/heartbeat", base_url()))
        .bearer_auth(token)
        .json(&json!({ "appVersion": app_version, "platform": platform }))
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    Ok(())
}

pub async fn device_info(token: &str) -> Result<DeviceInfoResponse, String> {
    let res = client()
        .get(format!("{}/api/print/device", base_url()))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    res.json::<DeviceInfoResponse>().await.map_err(|e| format!("Resposta inesperada do servidor: {e}"))
}

pub async fn next_job(token: &str) -> Result<NextJobResponse, String> {
    let res = client()
        .post(format!("{}/api/print/next-job", base_url()))
        .bearer_auth(token)
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    res.json::<NextJobResponse>().await.map_err(|e| format!("Resposta inesperada do servidor: {e}"))
}

pub async fn report_success(token: &str, order_id: &str) -> Result<(), String> {
    let res = client()
        .post(format!("{}/api/print/success", base_url()))
        .bearer_auth(token)
        .json(&json!({ "orderId": order_id }))
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    Ok(())
}

pub async fn report_failure(token: &str, order_id: &str, error_message: &str) -> Result<(), String> {
    let res = client()
        .post(format!("{}/api/print/failure", base_url()))
        .bearer_auth(token)
        .json(&json!({ "orderId": order_id, "error": error_message }))
        .send()
        .await
        .map_err(|e| format!("Sem conexão com o VSFood: {e}"))?;

    if !res.status().is_success() {
        return Err(extract_error(res).await);
    }
    Ok(())
}

async fn extract_error(res: reqwest::Response) -> String {
    let status = res.status();
    match res.json::<serde_json::Value>().await {
        Ok(body) => body.get("error").and_then(|v| v.as_str()).unwrap_or("Erro desconhecido do servidor.").to_string(),
        Err(_) => format!("Erro do servidor (status {status})."),
    }
}
