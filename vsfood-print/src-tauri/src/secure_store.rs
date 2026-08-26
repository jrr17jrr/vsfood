//! Guarda o token do dispositivo no cofre de credenciais do próprio Windows
//! (Credential Manager), nunca em texto puro num arquivo — é o `keyring`
//! (mantido pela comunidade Rust, usa a API nativa `wincred` no Windows,
//! Keychain no macOS, Secret Service no Linux). O service role da Supabase
//! NUNCA passa perto deste processo: o app só guarda o token opaco que
//! `/api/print/pair` devolve.

use keyring::Entry;

const SERVICE: &str = "com.vsfood.print";
const USERNAME: &str = "device-token";

fn entry() -> keyring::Result<Entry> {
    Entry::new(SERVICE, USERNAME)
}

pub fn save_token(token: &str) -> Result<(), String> {
    entry()
        .and_then(|e| e.set_password(token))
        .map_err(|e| format!("Não foi possível salvar a credencial do dispositivo: {e}"))
}

pub fn load_token() -> Option<String> {
    entry().ok()?.get_password().ok()
}

pub fn clear_token() -> Result<(), String> {
    match entry() {
        Ok(e) => match e.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(format!("Não foi possível remover a credencial do dispositivo: {e}")),
        },
        Err(e) => Err(format!("Não foi possível acessar o cofre de credenciais: {e}")),
    }
}
