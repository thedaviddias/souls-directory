use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SoulsStore {
    #[serde(default)]
    pub records: Vec<Value>,
    #[serde(default)]
    pub ops: Vec<Value>,
    #[serde(default)]
    pub meta: SoulsStoreMeta,
}

impl Default for SoulsStore {
    fn default() -> Self {
        Self {
            records: Vec::new(),
            ops: Vec::new(),
            meta: SoulsStoreMeta::default(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SoulsStoreMeta {
    pub schema_version: u32,
    pub last_pull_at: Option<i64>,
    pub last_push_at: Option<i64>,
}

impl Default for SoulsStoreMeta {
    fn default() -> Self {
        Self {
            schema_version: 1,
            last_pull_at: None,
            last_push_at: None,
        }
    }
}
