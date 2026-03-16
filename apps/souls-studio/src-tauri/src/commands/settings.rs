use crate::models::Settings;
use std::fs;
use std::path::PathBuf;

fn get_settings_path() -> PathBuf {
    dirs::config_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("souls-studio")
        .join("settings.json")
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    let settings_path = get_settings_path();

    if !settings_path.exists() {
        return Ok(Settings::default());
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings: {}", e))
}

#[tauri::command]
pub async fn save_settings(settings: Settings) -> Result<(), String> {
    let settings_path = get_settings_path();

    // Create parent directory if needed
    if let Some(parent) = settings_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    fs::write(&settings_path, content)
        .map_err(|e| format!("Failed to write settings: {}", e))?;

    Ok(())
}
