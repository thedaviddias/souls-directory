pub mod souls;
pub mod install;
pub mod settings;
pub mod souls_store;
pub mod community_cache;
pub mod gateway;

pub use souls::{get_all_souls, get_catalog, get_fetched_repos, get_installed_souls, fetch_repo, add_custom_repo, remove_custom_repo, get_custom_repos, get_repo_readme, get_favorites, toggle_favorite_soul, toggle_favorite_repo, reveal_soul_in_finder, get_all_repos};
pub use install::{install_soul, uninstall_soul};
pub use settings::{get_settings, save_settings};
pub use souls_store::{get_souls_store, save_souls_store, clear_souls_store};
pub use community_cache::{get_community_cache_entry, save_community_cache_entry, clear_community_cache};
pub use gateway::{probe_gateway, discover_local_gateway, parse_connection_string, discover_ssh_gateways, start_ssh_tunnel, stop_ssh_tunnel};
