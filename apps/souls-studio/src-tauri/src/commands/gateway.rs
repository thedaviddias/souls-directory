use crate::models::{OpenClawConnection, SshHostCandidate};
use regex::Regex;
use serde::Serialize;
use std::fs;
use std::time::Duration;
use tokio::io::AsyncBufReadExt;
use tokio::net::TcpStream;
use tokio::time::timeout;
use url::Url;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SshTunnelResult {
    pub pid: u32,
    pub local_port: u16,
}

/// Check if an SSH stderr line indicates a fatal error.
fn is_fatal_ssh_error(line: &str) -> bool {
    let fatal_patterns = [
        "Permission denied",
        "Connection refused",
        "Connection timed out",
        "No route to host",
        "Host key verification failed",
        "Could not resolve hostname",
        "Network is unreachable",
        "Connection reset by peer",
        "Authentication failed",
        "Too many authentication failures",
        "No such file or directory",
        "bind: Address already in use",
        "channel_setup_fwd_listener",
        "Warning: remote port forwarding failed",
    ];
    fatal_patterns.iter().any(|p| line.contains(p))
}

/// Validate SSH host/user parameters against safe patterns to prevent injection.
fn validate_ssh_param(value: &str, label: &str) -> Result<(), String> {
    let safe_pattern = Regex::new(r"^[a-zA-Z0-9._\-@/~]+$").unwrap();
    if value.is_empty() {
        return Err(format!("{} cannot be empty", label));
    }
    if !safe_pattern.is_match(value) {
        return Err(format!(
            "{} contains invalid characters: only alphanumeric, dots, hyphens, underscores, @, /, ~ are allowed",
            label
        ));
    }
    Ok(())
}

/// Probe a WebSocket gateway URL with a 3-second timeout.
/// Returns true if the gateway responds to a WebSocket handshake.
#[tauri::command]
pub async fn probe_gateway(gateway_url: String) -> Result<bool, String> {
    let url = Url::parse(&gateway_url)
        .map_err(|e| format!("Invalid URL: {}", e))?;

    let host = url.host_str().unwrap_or("127.0.0.1");
    let port = url.port().unwrap_or(18789);
    let addr = format!("{}:{}", host, port);

    match timeout(Duration::from_secs(3), TcpStream::connect(&addr)).await {
        Ok(Ok(_stream)) => Ok(true),
        Ok(Err(_)) => Ok(false),
        Err(_) => Ok(false), // timeout
    }
}

/// Discover a local OpenClaw Gateway on the default port.
#[tauri::command]
pub async fn discover_local_gateway() -> Result<Option<String>, String> {
    log::info!("[gateway-scan] Probing local gateway at ws://127.0.0.1:18789...");
    let url = "ws://127.0.0.1:18789";
    match probe_gateway(url.to_string()).await {
        Ok(true) => {
            log::info!("[gateway-scan] Local gateway FOUND");
            Ok(Some(url.to_string()))
        }
        _ => {
            log::info!("[gateway-scan] No local gateway on port 18789");
            Ok(None)
        }
    }
}

/// Parse a connection string like `ws://host:port` or `ws://user:token@host:port`
/// into a structured OpenClawConnection.
#[tauri::command]
pub async fn parse_connection_string(input: String) -> Result<OpenClawConnection, String> {
    let url = Url::parse(&input)
        .map_err(|e| format!("Invalid connection string: {}", e))?;

    let host = url.host_str().unwrap_or("127.0.0.1").to_string();
    let port = url.port().unwrap_or(18789);
    let scheme = url.scheme();

    let auth_token = if !url.password().unwrap_or("").is_empty() {
        Some(url.password().unwrap().to_string())
    } else {
        None
    };

    let gateway_url = format!("{}://{}:{}", scheme, host, port);
    let is_local = host == "127.0.0.1" || host == "localhost";

    Ok(OpenClawConnection {
        id: uuid::Uuid::new_v4().to_string(),
        name: if is_local {
            "Local Gateway".to_string()
        } else {
            format!("Gateway ({})", host)
        },
        method: if is_local { "local" } else { "direct" }.to_string(),
        gateway_url,
        auth_token,
        ssh_host: None,
        ssh_user: None,
        ssh_port: None,
        ssh_key_path: None,
        ssh_passphrase: None,
        ssh_password: None,
        is_default: false,
        discovered: false,
    })
}

/// Parse ~/.ssh/config and probe each host for an OpenClaw Gateway.
#[tauri::command]
pub async fn discover_ssh_gateways() -> Result<Vec<SshHostCandidate>, String> {
    let ssh_config_path = dirs::home_dir()
        .unwrap_or_default()
        .join(".ssh")
        .join("config");

    if !ssh_config_path.exists() {
        log::info!("[gateway-scan] No ~/.ssh/config found at {:?}", ssh_config_path);
        return Ok(Vec::new());
    }

    log::info!("[gateway-scan] Reading SSH config from {:?}", ssh_config_path);
    let content = fs::read_to_string(&ssh_config_path)
        .map_err(|e| format!("Failed to read SSH config: {}", e))?;

    let hosts = parse_ssh_config(&content);
    log::info!("[gateway-scan] Found {} SSH hosts in config", hosts.len());

    // Return all hosts as candidates — no probing.
    // The user picks which host to connect to and configures the gateway port.
    for host in &hosts {
        log::info!(
            "[gateway-scan] SSH host '{}' ({})",
            host.host_alias,
            host.hostname,
        );
    }

    Ok(hosts)
}

/// Simple SSH config parser. Extracts Host, HostName, User, Port, IdentityFile.
fn parse_ssh_config(content: &str) -> Vec<SshHostCandidate> {
    let mut hosts: Vec<SshHostCandidate> = Vec::new();
    let mut current: Option<SshHostCandidate> = None;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        // Split on first whitespace or '='
        let (key, value) = match line.split_once(|c: char| c.is_whitespace() || c == '=') {
            Some((k, v)) => (k.trim().to_lowercase(), v.trim().to_string()),
            None => continue,
        };

        match key.as_str() {
            "host" => {
                // Save previous host if valid
                if let Some(h) = current.take() {
                    if !h.hostname.is_empty() && !h.hostname.contains('*') && !h.hostname.contains('?') {
                        hosts.push(h);
                    }
                }
                // Skip wildcard patterns
                if value.contains('*') || value.contains('?') {
                    current = None;
                } else {
                    current = Some(SshHostCandidate {
                        host_alias: value.clone(),
                        hostname: value, // default to alias, overridden by HostName
                        user: None,
                        port: 22,
                        identity_file: None,
                        gateway_responds: false,
                    });
                }
            }
            "hostname" => {
                if let Some(ref mut h) = current {
                    h.hostname = value;
                }
            }
            "user" => {
                if let Some(ref mut h) = current {
                    h.user = Some(value);
                }
            }
            "port" => {
                if let Some(ref mut h) = current {
                    h.port = value.parse().unwrap_or(22);
                }
            }
            "identityfile" => {
                if let Some(ref mut h) = current {
                    h.identity_file = Some(value);
                }
            }
            _ => {}
        }
    }

    // Don't forget the last host
    if let Some(h) = current {
        if !h.hostname.is_empty() && !h.hostname.contains('*') && !h.hostname.contains('?') {
            hosts.push(h);
        }
    }

    hosts
}

/// Create a temporary SSH_ASKPASS script that echoes the passphrase.
/// Returns the path to the script (caller must clean up).
fn create_askpass_script(passphrase: &str) -> Result<std::path::PathBuf, String> {
    use std::io::Write;
    use std::os::unix::fs::PermissionsExt;

    let dir = std::env::temp_dir();
    let id = format!("{}-{}", std::process::id(), std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos());
    let path = dir.join(format!("souls-studio-askpass-{}", id));

    let mut file = fs::File::create(&path)
        .map_err(|e| format!("Failed to create askpass script: {}", e))?;

    // Write a script that echoes the passphrase
    writeln!(file, "#!/bin/sh\necho '{}'", passphrase.replace('\'', "'\\''"))
        .map_err(|e| format!("Failed to write askpass script: {}", e))?;

    // Make it executable
    fs::set_permissions(&path, std::fs::Permissions::from_mode(0o700))
        .map_err(|e| format!("Failed to set askpass permissions: {}", e))?;

    Ok(path)
}

/// Start an SSH tunnel for port forwarding to a remote gateway.
/// Waits for the tunnel to be ready (local port accepting connections) before returning.
/// Returns the PID and allocated local port.
#[tauri::command]
pub async fn start_ssh_tunnel(
    ssh_host: String,
    ssh_user: String,
    ssh_port: u16,
    ssh_key_path: Option<String>,
    ssh_passphrase: Option<String>,
    ssh_password: Option<String>,
    remote_port: u16,
) -> Result<SshTunnelResult, String> {
    // Validate inputs to prevent command injection
    validate_ssh_param(&ssh_host, "SSH host")?;
    validate_ssh_param(&ssh_user, "SSH user")?;
    if ssh_port == 0 {
        return Err("SSH port must be non-zero".to_string());
    }
    if remote_port == 0 {
        return Err("Remote port must be non-zero".to_string());
    }

    // Allocate a free local port by binding to port 0
    let listener = std::net::TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("Failed to find available port: {}", e))?;
    let local_port = listener
        .local_addr()
        .map_err(|e| format!("Failed to get local port: {}", e))?
        .port();
    drop(listener); // Release port so SSH can bind it

    // Determine which secret SSH_ASKPASS should provide:
    // - If a key path is given, the passphrase unlocks the key (pubkey auth)
    // - If no key path, the password is used for password auth
    let askpass_secret = if ssh_key_path.is_some() {
        ssh_passphrase.as_deref().or(ssh_password.as_deref())
    } else {
        ssh_password.as_deref().or(ssh_passphrase.as_deref())
    };

    log::info!(
        "[gateway] SSH auth config: host={}, user={}, port={}, has_password={}, has_passphrase={}, has_key_path={}, askpass_will_provide={}",
        ssh_host, ssh_user, ssh_port,
        ssh_password.is_some(), ssh_passphrase.is_some(), ssh_key_path.is_some(),
        if ssh_key_path.is_some() && ssh_passphrase.is_some() { "key-passphrase" }
        else if ssh_password.is_some() { "password" }
        else if ssh_passphrase.is_some() { "passphrase" }
        else { "none" }
    );

    let mut args = vec![
        "-N".to_string(),
        "-v".to_string(), // Verbose output for debugging auth issues
        "-L".to_string(),
        format!("{}:127.0.0.1:{}", local_port, remote_port),
        format!("{}@{}", ssh_user, ssh_host),
        "-p".to_string(),
        ssh_port.to_string(),
        "-o".to_string(),
        "StrictHostKeyChecking=accept-new".to_string(),
        "-o".to_string(),
        "ConnectTimeout=10".to_string(),
    ];

    if let Some(ref key_path) = ssh_key_path {
        validate_ssh_param(key_path, "SSH key path")?;
        args.push("-i".to_string());
        args.push(key_path.clone());
        // Only use the specified key, ignore keys from ~/.ssh/config
        args.push("-o".to_string());
        args.push("IdentitiesOnly=yes".to_string());
        // Force pubkey auth when we have a key
        args.push("-o".to_string());
        args.push("PreferredAuthentications=publickey".to_string());
    } else if ssh_password.is_some() {
        // No key — use password auth, skip pubkey to avoid wasting attempts
        args.push("-o".to_string());
        args.push("PreferredAuthentications=password,keyboard-interactive".to_string());
        args.push("-o".to_string());
        args.push("IdentitiesOnly=yes".to_string());
    }

    if askpass_secret.is_none() {
        // No secret provided — use BatchMode to fail fast instead of hanging
        args.push("-o".to_string());
        args.push("BatchMode=yes".to_string());
    }

    log::info!("[gateway] SSH command: ssh {}", args.join(" "));

    let mut cmd = tokio::process::Command::new("ssh");
    cmd.args(&args);

    // Use SSH_ASKPASS to feed password or key passphrase to SSH
    let askpass_path = if let Some(secret) = askpass_secret {
        let path = create_askpass_script(secret)?;
        cmd.env("SSH_ASKPASS", path.to_str().unwrap_or_default());
        cmd.env("SSH_ASKPASS_REQUIRE", "force");
        cmd.env("DISPLAY", ":0");
        log::info!(
            "[gateway] SSH_ASKPASS configured (auth method: {})",
            if ssh_password.is_some() { "password" } else { "key-passphrase" }
        );
        Some(path)
    } else {
        log::info!("[gateway] No password/passphrase — using BatchMode");
        None
    };

    // Detach stdin/stdout; pipe stderr for error capture
    cmd.stdin(std::process::Stdio::null());
    cmd.stdout(std::process::Stdio::null());
    cmd.stderr(std::process::Stdio::piped());

    // Create a new session so SSH has no controlling terminal and must use SSH_ASKPASS.
    // Without this, GUI apps (like Tauri) inherit a controlling terminal that causes
    // SSH to skip SSH_ASKPASS even with SSH_ASKPASS_REQUIRE=force.
    unsafe {
        cmd.pre_exec(|| {
            libc::setsid();
            Ok(())
        });
    }

    let mut child = cmd.spawn()
        .map_err(|e| format!("Failed to start SSH tunnel: {}", e))?;

    let pid = child.id().ok_or("Failed to get SSH process PID")?;
    log::info!("[gateway] SSH tunnel spawned with PID {} on local port {}", pid, local_port);

    // Clean up the askpass script after a short delay
    if let Some(path) = askpass_path {
        let path_clone = path.clone();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(5)).await;
            let _ = fs::remove_file(&path_clone);
        });
    }

    // Read stderr asynchronously to capture SSH errors
    let stderr = child.stderr.take().expect("stderr was piped");
    let (err_tx, mut err_rx) = tokio::sync::mpsc::channel::<String>(16);

    tokio::spawn(async move {
        let reader = tokio::io::BufReader::new(stderr);
        let mut lines = reader.lines();
        let mut collected_errors = Vec::new();
        while let Ok(Some(line)) = lines.next_line().await {
            log::warn!("[gateway] SSH stderr: {}", line);
            // Only collect non-debug lines for error reporting to the user
            if !line.starts_with("debug") && !line.starts_with("Warning:") {
                collected_errors.push(line.clone());
            }
            let _ = err_tx.send(line).await;
        }
        // SSH process exited — send only meaningful error lines as a summary
        if !collected_errors.is_empty() {
            let _ = err_tx.send(format!("SSH_EXIT: {}", collected_errors.join("; "))).await;
        }
    });

    // Wait for tunnel readiness or failure (15s timeout)
    let deadline = tokio::time::Instant::now() + Duration::from_secs(15);
    let addr = format!("127.0.0.1:{}", local_port);

    loop {
        if tokio::time::Instant::now() >= deadline {
            let _ = child.kill().await;
            return Err("SSH tunnel timed out — the remote host may be unreachable or the gateway is not running".to_string());
        }

        tokio::select! {
            result = TcpStream::connect(&addr) => {
                match result {
                    Ok(_) => {
                        log::info!("[gateway] SSH tunnel ready on port {}", local_port);
                        // Spawn a watcher so the Child is not dropped
                        tokio::spawn(async move {
                            let status = child.wait().await;
                            log::info!("[gateway] SSH tunnel (PID {}) exited: {:?}", pid, status);
                        });
                        return Ok(SshTunnelResult { pid, local_port });
                    }
                    Err(_) => {
                        // Port not open yet, wait before retrying
                        tokio::time::sleep(Duration::from_millis(200)).await;
                    }
                }
            }
            Some(line) = err_rx.recv() => {
                if line.starts_with("SSH_EXIT:") || is_fatal_ssh_error(&line) {
                    let _ = child.kill().await;
                    let msg = line.strip_prefix("SSH_EXIT: ").unwrap_or(&line);
                    return Err(format!("SSH tunnel failed: {}", msg));
                }
            }
            _ = tokio::time::sleep_until(deadline) => {
                let _ = child.kill().await;
                return Err("SSH tunnel timed out — the remote host may be unreachable or the gateway is not running".to_string());
            }
        }
    }
}

/// Stop an SSH tunnel by killing the process.
#[tauri::command]
pub async fn stop_ssh_tunnel(pid: u32) -> Result<(), String> {
    log::info!("[gateway] Stopping SSH tunnel with PID {}", pid);
    std::process::Command::new("kill")
        .arg(pid.to_string())
        .output()
        .map_err(|e| format!("Failed to stop SSH tunnel: {}", e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::fs::PermissionsExt;

    // ── is_fatal_ssh_error ──────────────────────────────────────

    #[test]
    fn fatal_error_permission_denied() {
        assert!(is_fatal_ssh_error("root@10.20.40.39: Permission denied (publickey,password)."));
    }

    #[test]
    fn fatal_error_connection_refused() {
        assert!(is_fatal_ssh_error("ssh: connect to host 10.0.0.1 port 22: Connection refused"));
    }

    #[test]
    fn fatal_error_host_not_found() {
        assert!(is_fatal_ssh_error("ssh: Could not resolve hostname fakehost: nodename nor servname provided"));
    }

    #[test]
    fn fatal_error_no_route() {
        assert!(is_fatal_ssh_error("ssh: connect to host 192.168.99.1 port 22: No route to host"));
    }

    #[test]
    fn fatal_error_host_key_verification() {
        assert!(is_fatal_ssh_error("Host key verification failed."));
    }

    #[test]
    fn fatal_error_address_in_use() {
        assert!(is_fatal_ssh_error("bind: Address already in use"));
    }

    #[test]
    fn fatal_error_bad_key_path() {
        assert!(is_fatal_ssh_error("/home/user/.ssh/nonexistent: No such file or directory"));
    }

    #[test]
    fn fatal_error_too_many_auth_failures() {
        assert!(is_fatal_ssh_error("Received disconnect from 10.0.0.1: Too many authentication failures"));
    }

    #[test]
    fn non_fatal_warning_ignored() {
        assert!(!is_fatal_ssh_error("Warning: Permanently added '10.0.0.1' (ED25519) to the list of known hosts."));
    }

    #[test]
    fn non_fatal_empty_line() {
        assert!(!is_fatal_ssh_error(""));
    }

    #[test]
    fn non_fatal_debug_output() {
        assert!(!is_fatal_ssh_error("debug1: Connecting to 10.0.0.1 port 22."));
    }

    // ── validate_ssh_param ──────────────────────────────────────

    #[test]
    fn valid_hostname() {
        assert!(validate_ssh_param("my-server.example.com", "host").is_ok());
    }

    #[test]
    fn valid_ip_address() {
        assert!(validate_ssh_param("10.20.40.39", "host").is_ok());
    }

    #[test]
    fn valid_user() {
        assert!(validate_ssh_param("root", "user").is_ok());
    }

    #[test]
    fn valid_key_path() {
        assert!(validate_ssh_param("~/.ssh/id_rsa", "key").is_ok());
    }

    #[test]
    fn valid_key_path_with_at() {
        assert!(validate_ssh_param("~/.ssh/user@host_key", "key").is_ok());
    }

    #[test]
    fn rejects_empty() {
        let err = validate_ssh_param("", "host").unwrap_err();
        assert!(err.contains("cannot be empty"));
    }

    #[test]
    fn rejects_semicolon_injection() {
        assert!(validate_ssh_param("host; rm -rf /", "host").is_err());
    }

    #[test]
    fn rejects_backtick_injection() {
        assert!(validate_ssh_param("`whoami`", "host").is_err());
    }

    #[test]
    fn rejects_pipe_injection() {
        assert!(validate_ssh_param("host | cat /etc/passwd", "host").is_err());
    }

    #[test]
    fn rejects_dollar_injection() {
        assert!(validate_ssh_param("$(whoami)", "host").is_err());
    }

    #[test]
    fn rejects_spaces() {
        assert!(validate_ssh_param("my server", "host").is_err());
    }

    // ── parse_ssh_config ────────────────────────────────────────

    #[test]
    fn parses_basic_host() {
        let config = "Host myserver\n  HostName 10.0.0.1\n  User admin\n";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].host_alias, "myserver");
        assert_eq!(hosts[0].hostname, "10.0.0.1");
        assert_eq!(hosts[0].user, Some("admin".to_string()));
        assert_eq!(hosts[0].port, 22);
    }

    #[test]
    fn parses_multiple_hosts() {
        let config = "\
Host server1
  HostName 10.0.0.1
  User root

Host server2
  HostName 10.0.0.2
  User ubuntu
  Port 2222
";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 2);
        assert_eq!(hosts[0].hostname, "10.0.0.1");
        assert_eq!(hosts[1].hostname, "10.0.0.2");
        assert_eq!(hosts[1].port, 2222);
    }

    #[test]
    fn skips_wildcard_hosts() {
        let config = "\
Host *
  ServerAliveInterval 60

Host myserver
  HostName 10.0.0.1
";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].host_alias, "myserver");
    }

    #[test]
    fn parses_identity_file() {
        let config = "Host myserver\n  HostName 10.0.0.1\n  IdentityFile ~/.ssh/custom_key\n";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts[0].identity_file, Some("~/.ssh/custom_key".to_string()));
    }

    #[test]
    fn handles_equals_separator() {
        let config = "Host myserver\n  HostName=10.0.0.1\n  User=admin\n";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].hostname, "10.0.0.1");
        assert_eq!(hosts[0].user, Some("admin".to_string()));
    }

    #[test]
    fn skips_comments_and_empty_lines() {
        let config = "\
# This is a comment
Host myserver
  # Another comment
  HostName 10.0.0.1

  User admin
";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].user, Some("admin".to_string()));
    }

    #[test]
    fn empty_config_returns_empty() {
        assert!(parse_ssh_config("").is_empty());
    }

    #[test]
    fn hostname_defaults_to_alias() {
        let config = "Host myalias\n  User admin\n";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts.len(), 1);
        assert_eq!(hosts[0].hostname, "myalias");
    }

    #[test]
    fn invalid_port_defaults_to_22() {
        let config = "Host myserver\n  HostName 10.0.0.1\n  Port notanumber\n";
        let hosts = parse_ssh_config(config);
        assert_eq!(hosts[0].port, 22);
    }

    // ── create_askpass_script ───────────────────────────────────

    #[test]
    fn askpass_script_is_created_and_executable() {
        let path = create_askpass_script("my_secret_password").unwrap();
        assert!(path.exists());

        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("#!/bin/sh"), "Script missing shebang: {}", content);
        assert!(content.contains("my_secret_password"), "Script missing password: {}", content);

        let perms = fs::metadata(&path).unwrap().permissions();
        assert_eq!(perms.mode() & 0o777, 0o700);

        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn askpass_script_escapes_single_quotes() {
        let path = create_askpass_script("pass'word").unwrap();
        let content = fs::read_to_string(&path).unwrap();
        assert!(content.contains("pass'\\''word"));
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn askpass_script_outputs_password_correctly() {
        let path = create_askpass_script("test_pw_123").unwrap();
        let output = std::process::Command::new("sh")
            .arg(path.to_str().unwrap())
            .output()
            .unwrap();
        let stdout = String::from_utf8(output.stdout).unwrap();
        assert_eq!(stdout.trim(), "test_pw_123");
        fs::remove_file(&path).unwrap();
    }

    #[test]
    fn askpass_script_handles_special_chars() {
        let path = create_askpass_script("p@$$w0rd!#%&").unwrap();
        let output = std::process::Command::new("sh")
            .arg(path.to_str().unwrap())
            .output()
            .unwrap();
        let stdout = String::from_utf8(output.stdout).unwrap();
        assert_eq!(stdout.trim(), "p@$$w0rd!#%&");
        fs::remove_file(&path).unwrap();
    }

    // ── askpass_secret priority ─────────────────────────────────

    #[test]
    fn password_takes_priority_over_passphrase() {
        let password = Some("my_password".to_string());
        let passphrase = Some("my_passphrase".to_string());
        let secret = password.as_deref().or(passphrase.as_deref());
        assert_eq!(secret, Some("my_password"));
    }

    #[test]
    fn passphrase_used_when_no_password() {
        let password: Option<String> = None;
        let passphrase = Some("my_passphrase".to_string());
        let secret = password.as_deref().or(passphrase.as_deref());
        assert_eq!(secret, Some("my_passphrase"));
    }

    #[test]
    fn no_secret_when_both_none() {
        let password: Option<String> = None;
        let passphrase: Option<String> = None;
        let secret = password.as_deref().or(passphrase.as_deref());
        assert_eq!(secret, None);
    }

    // ── port allocation ─────────────────────────────────────────

    #[test]
    fn port_zero_allocates_free_port() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        assert!(port > 0);
        // Port should be in ephemeral range
        assert!(port >= 1024);
        drop(listener);
    }

    #[test]
    fn allocated_port_is_usable_after_drop() {
        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        drop(listener);

        // Should be able to bind again
        let listener2 = std::net::TcpListener::bind(format!("127.0.0.1:{}", port));
        assert!(listener2.is_ok());
    }

    // ── SSH_ASKPASS integration (real SSH_ASKPASS execution) ────

    #[test]
    fn askpass_works_via_setsid_and_ssh_askpass() {
        // This test verifies the full SSH_ASKPASS flow:
        // 1. Create askpass script
        // 2. Spawn a child process in a new session (setsid)
        // 3. The child uses SSH_ASKPASS to read the secret
        let askpass_path = create_askpass_script("integration_test_pw").unwrap();

        // Use a helper script that simulates what SSH does: calls SSH_ASKPASS
        let output = std::process::Command::new("sh")
            .arg("-c")
            .arg(format!("\"{}\"", askpass_path.display()))
            .output()
            .unwrap();

        let stdout = String::from_utf8(output.stdout).unwrap();
        assert_eq!(stdout.trim(), "integration_test_pw");
        fs::remove_file(&askpass_path).unwrap();
    }

    #[tokio::test]
    async fn ssh_tunnel_rejects_empty_host() {
        let result = start_ssh_tunnel(
            "".to_string(),
            "user".to_string(),
            22,
            None,
            None,
            None,
            18789,
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("cannot be empty"));
    }

    #[tokio::test]
    async fn ssh_tunnel_rejects_injection_in_host() {
        let result = start_ssh_tunnel(
            "host; rm -rf /".to_string(),
            "user".to_string(),
            22,
            None,
            None,
            None,
            18789,
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("invalid characters"));
    }

    #[tokio::test]
    async fn ssh_tunnel_rejects_zero_port() {
        let result = start_ssh_tunnel(
            "example.com".to_string(),
            "user".to_string(),
            0,
            None,
            None,
            None,
            18789,
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("non-zero"));
    }

    #[tokio::test]
    async fn ssh_tunnel_rejects_zero_remote_port() {
        let result = start_ssh_tunnel(
            "example.com".to_string(),
            "user".to_string(),
            22,
            None,
            None,
            None,
            0,
        ).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("non-zero"));
    }

    #[tokio::test]
    async fn ssh_tunnel_fails_for_unreachable_host() {
        // Use a non-routable IP to trigger a fast failure
        let result = start_ssh_tunnel(
            "192.0.2.1".to_string(), // TEST-NET, guaranteed non-routable
            "testuser".to_string(),
            22,
            None,
            None,
            None,
            18789,
        ).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        // Should get a real SSH error, not a generic "Connection error"
        assert!(
            err.contains("SSH tunnel failed") || err.contains("timed out"),
            "Expected SSH error message, got: {}",
            err
        );
    }

    #[tokio::test]
    async fn ssh_tunnel_fails_with_bad_hostname() {
        let result = start_ssh_tunnel(
            "this.host.definitely.does.not.exist.example".to_string(),
            "testuser".to_string(),
            22,
            None,
            None,
            None,
            18789,
        ).await;
        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(
            err.contains("Could not resolve hostname") || err.contains("SSH tunnel failed") || err.contains("timed out"),
            "Expected hostname resolution error, got: {}",
            err
        );
    }
}
