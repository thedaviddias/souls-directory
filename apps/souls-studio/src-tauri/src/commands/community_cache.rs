use serde_json::Value;
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

fn get_community_cache_dir() -> PathBuf {
    dirs::cache_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("souls-studio")
        .join("community")
}

fn sanitize_key(key: &str) -> String {
    key.chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '_' || c == '-' {
                c
            } else {
                '_'
            }
        })
        .collect()
}

fn hash_key(key: &str) -> u64 {
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);
    hasher.finish()
}

fn get_cache_path(key: &str) -> PathBuf {
    let safe = sanitize_key(key);
    let shortened = if safe.len() > 64 { &safe[..64] } else { &safe };
    let hashed = hash_key(key);
    get_community_cache_dir().join(format!("{}-{:016x}.json", shortened, hashed))
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
pub async fn get_community_cache_entry(key: String) -> Result<Option<Value>, String> {
    let path = get_cache_path(&key);
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let parsed: Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse cache entry: {}", e))?;
    Ok(Some(parsed))
}

#[tauri::command]
pub async fn save_community_cache_entry(key: String, value: Value) -> Result<(), String> {
    let path = get_cache_path(&key);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string(&value).map_err(|e| e.to_string())?;
    write_atomic(&path, &content)
}

#[tauri::command]
pub async fn clear_community_cache() -> Result<(), String> {
    let path = get_community_cache_dir();
    if path.exists() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    }

    Ok(())
}
