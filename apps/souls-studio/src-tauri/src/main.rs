#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;

use commands::{
    get_all_souls, get_catalog, get_fetched_repos, get_installed_souls,
    get_settings, install_soul, save_settings, uninstall_soul, fetch_repo,
    add_custom_repo, remove_custom_repo, get_custom_repos, get_repo_readme, get_favorites,
    toggle_favorite_soul, toggle_favorite_repo, reveal_soul_in_finder, get_all_repos,
    get_souls_store, save_souls_store, clear_souls_store,
    get_community_cache_entry, save_community_cache_entry, clear_community_cache,
    probe_gateway, discover_local_gateway, parse_connection_string, discover_ssh_gateways,
    start_ssh_tunnel, stop_ssh_tunnel,
};
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};
use tauri_plugin_log::{Target, TargetKind};

fn init_sentry() -> Option<sentry::ClientInitGuard> {
    let dsn = std::env::var("SENTRY_DSN")
        .ok()
        .or_else(|| std::env::var("TAURI_SENTRY_DSN").ok())
        .filter(|value| !value.trim().is_empty())?;

    let guard = sentry::init((
        dsn,
        sentry::ClientOptions {
            release: sentry::release_name!(),
            attach_stacktrace: true,
            ..Default::default()
        },
    ));
    Some(guard)
}

fn main() {
    let _sentry = init_sentry();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some("souls-studio".into()),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri::plugin::Builder::<tauri::Wry, ()>::new("oauth-guard")
                .on_navigation(|_webview, url| {
                    // Safety net: block OAuth navigations in the webview.
                    // The JS layer (tauri-auth.ts) handles opening the URL
                    // in the system browser via the opener plugin.
                    let is_convex_auth_signin = url.path().starts_with("/api/auth/signin/");
                    let is_github_oauth = url.host_str() == Some("github.com")
                        && url.path().starts_with("/login/oauth");

                    if is_convex_auth_signin || is_github_oauth {
                        log::info!("Blocked OAuth navigation in webview: {}", url);
                        return false;
                    }
                    true
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            if let Err(error) = app
                .handle()
                .plugin(tauri_plugin_updater::Builder::new().build())
            {
                log::error!("Failed to initialize updater plugin: {}", error);
            }

            // ── Native menu bar ───────────────────────────────────
            let settings_item = MenuItemBuilder::with_id("menu://settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;
            let check_update_item =
                MenuItemBuilder::with_id("menu://check-update", "Check for Updates...")
                    .build(app)?;

            let app_menu = SubmenuBuilder::new(app, "Souls Studio")
                .about(None)
                .separator()
                .item(&settings_item)
                .item(&check_update_item)
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let new_soul_item = MenuItemBuilder::with_id("menu://new-soul", "New Soul")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&new_soul_item)
                .close_window()
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let tab_explore = MenuItemBuilder::with_id("menu://tab-library", "Explore")
                .accelerator("CmdOrCtrl+1")
                .build(app)?;
            let tab_agents = MenuItemBuilder::with_id("menu://tab-agents", "Agents")
                .accelerator("CmdOrCtrl+2")
                .build(app)?;
            let tab_souls = MenuItemBuilder::with_id("menu://tab-souls", "My Souls")
                .accelerator("CmdOrCtrl+3")
                .build(app)?;
            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&tab_explore)
                .item(&tab_agents)
                .item(&tab_souls)
                .separator()
                .fullscreen()
                .build()?;

            let window_menu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .maximize()
                .separator()
                .close_window()
                .build()?;

            let docs_item =
                MenuItemBuilder::with_id("menu://open-docs", "Documentation").build(app)?;
            let whats_new_item =
                MenuItemBuilder::with_id("menu://whats-new", "What's New").build(app)?;
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&docs_item)
                .item(&whats_new_item)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_menu)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&window_menu)
                .item(&help_menu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app_handle, event| {
                let id = event.id().0.as_str();
                if id.starts_with("menu://") {
                    let _ = app_handle.emit("menu-event", id);
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_catalog,
            get_all_souls,
            get_all_repos,
            get_fetched_repos,
            fetch_repo,
            get_installed_souls,
            get_settings,
            save_settings,
            install_soul,
            uninstall_soul,
            add_custom_repo,
            remove_custom_repo,
            get_custom_repos,
            get_repo_readme,
            get_favorites,
            toggle_favorite_soul,
            toggle_favorite_repo,
            reveal_soul_in_finder,
            get_souls_store,
            save_souls_store,
            clear_souls_store,
            get_community_cache_entry,
            save_community_cache_entry,
            clear_community_cache,
            probe_gateway,
            discover_local_gateway,
            parse_connection_string,
            discover_ssh_gateways,
            start_ssh_tunnel,
            stop_ssh_tunnel,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
