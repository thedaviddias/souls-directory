use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Soul {
    pub id: String,
    pub name: String,
    pub description: String,
    pub owner: String,
    pub repo: String,
    pub souls_path: String,
    pub path: String,
    pub content: Option<String>,
    pub is_installed: bool,
    pub is_fetched: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Catalog {
    pub version: String,
    pub last_updated: String,
    pub repos: Vec<CatalogRepo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CatalogRepo {
    pub url: String,
    #[serde(default)]
    pub highlight: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct FetchedRepos {
    pub repos: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OpenClawConnection {
    pub id: String,
    pub name: String,
    pub method: String,
    pub gateway_url: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub auth_token: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_host: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_user: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_port: Option<u16>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_key_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_passphrase: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ssh_password: Option<String>,
    #[serde(default)]
    pub is_default: bool,
    #[serde(default)]
    pub discovered: bool,
}

#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GatewayAgent {
    pub agent_id: String,
    #[serde(default)]
    pub has_soul_md: bool,
    #[serde(default)]
    pub has_agents_md: bool,
    #[serde(default)]
    pub has_tools_md: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SshHostCandidate {
    pub host_alias: String,
    pub hostname: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(default = "default_ssh_port")]
    pub port: u16,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub identity_file: Option<String>,
    #[serde(default)]
    pub gateway_responds: bool,
}

fn default_ssh_port() -> u16 {
    22
}

fn default_theme() -> String {
    "system".to_string()
}

fn default_font_size() -> u32 {
    13
}

fn default_sync_interval() -> u32 {
    30
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    #[serde(default = "default_install_method")]
    pub install_method: String,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_font_size")]
    pub editor_font_size: u32,
    #[serde(default = "default_sync_interval")]
    pub sync_interval_seconds: u32,
    #[serde(default)]
    pub openclaw_connections: Vec<OpenClawConnection>,
}

fn default_install_method() -> String {
    "copy".to_string()
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            install_method: default_install_method(),
            theme: default_theme(),
            editor_font_size: default_font_size(),
            sync_interval_seconds: default_sync_interval(),
            openclaw_connections: Vec::new(),
        }
    }
}
