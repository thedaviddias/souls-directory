use crate::models::SoulsStore;
use std::fs;
use std::path::{Path, PathBuf};

fn get_souls_store_dir() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("souls-studio")
        .join("souls")
}

fn sanitize_user_id(user_id: &str) -> String {
    user_id
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn get_user_store_path(user_id: &str) -> PathBuf {
    let safe_user_id = sanitize_user_id(user_id);
    get_souls_store_dir().join(format!("{}.json", safe_user_id))
}

fn write_atomic(path: &Path, content: &str) -> Result<(), String> {
    let tmp_path = path.with_extension("tmp");
    fs::write(&tmp_path, content).map_err(|e| e.to_string())?;

    if path.exists() {
        let _ = fs::remove_file(path);
    }

    fs::rename(&tmp_path, path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_souls_store(user_id: String) -> Result<SoulsStore, String> {
    let path = get_user_store_path(&user_id);
    if !path.exists() {
        return Ok(SoulsStore::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse souls store: {}", e))
}

#[tauri::command]
pub async fn save_souls_store(user_id: String, store: SoulsStore) -> Result<(), String> {
    let path = get_user_store_path(&user_id);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&store).map_err(|e| e.to_string())?;
    write_atomic(&path, &content)
}

#[tauri::command]
pub async fn clear_souls_store(user_id: String) -> Result<(), String> {
    let path = get_user_store_path(&user_id);
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
