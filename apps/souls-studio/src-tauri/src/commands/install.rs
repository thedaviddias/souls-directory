use std::fs;
use std::path::PathBuf;
use tauri_plugin_shell::ShellExt;

fn get_data_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("souls-studio")
}

fn get_installed_souls_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".claude")
        .join("souls")
}

#[tauri::command]
pub async fn install_soul(
    app: tauri::AppHandle,
    owner: String,
    repo: String,
    soul_name: String,
    soul_path: String,
    souls_path: String,
    method: String,
) -> Result<String, String> {
    if method == "copy" {
        // Direct copy method
        let data_path = get_data_path();
        let repo_path = data_path.join("repos").join(&owner).join(&repo);

        let source_path = if souls_path == "." {
            repo_path.join(&soul_path)
        } else {
            repo_path.join(&souls_path).join(&soul_path)
        };

        let dest_path = get_installed_souls_path().join(&soul_name);

        // Create parent directory if needed
        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        // Copy the soul directory
        copy_dir_recursive(&source_path, &dest_path)
            .map_err(|e| format!("Failed to copy soul: {}", e))?;

        Ok(format!("Soul '{}' installed via direct copy", soul_name))
    } else {
        // npx method (default)
        let shell = app.shell();

        let output = shell
            .command("npx")
            .args([
                "souls",
                "add",
                &format!("{}/{}", owner, repo),
                &format!("--soul={}", soul_name),
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to run npx: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    if !src.exists() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("Source path does not exist: {:?}", src),
        ));
    }

    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn uninstall_soul(soul_name: String) -> Result<(), String> {
    let installed_path = get_installed_souls_path().join(&soul_name);

    if installed_path.exists() {
        if installed_path.is_symlink() {
            fs::remove_file(&installed_path)
                .map_err(|e| format!("Failed to remove symlink: {}", e))?;
        } else if installed_path.is_dir() {
            fs::remove_dir_all(&installed_path)
                .map_err(|e| format!("Failed to remove directory: {}", e))?;
        } else {
            fs::remove_file(&installed_path)
                .map_err(|e| format!("Failed to remove file: {}", e))?;
        }
    }

    Ok(())
}
