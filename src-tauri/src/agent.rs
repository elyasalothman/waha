use tauri::Manager;
use std::fs;
static SAVE_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

fn data_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("mohsen.json"))
}
#[tauri::command]
pub fn agent_load(app: tauri::AppHandle) -> Result<String, String> {
    let path = data_path(&app)?;
    match fs::read_to_string(path) {
        Ok(s) => Ok(s),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(String::new()),
        Err(e) => Err(e.to_string()),
    }
}
#[tauri::command]
pub fn agent_save(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let _guard = SAVE_LOCK.lock().map_err(|_| "تعذر قفل التخزين".to_string())?;
    if json.len() > 4_000_000 { return Err("البيانات أكبر من الحد المسموح".into()); }
    serde_json::from_str::<serde_json::Value>(&json).map_err(|e| e.to_string())?;
    let path = data_path(&app)?;
    // A failed write leaves the previous valid document intact.
    let temp = path.with_extension("tmp");
    fs::write(&temp, json).map_err(|e| e.to_string())?;
    fs::rename(temp, path).map_err(|e| e.to_string())
}
#[tauri::command]
pub fn agent_system(app: tauri::AppHandle, target: String) -> Result<(), String> {
    use std::process::Command;
    // No executable, argument, path or command string is supplied by a model/user.
    if target == "downloads" || target == "documents" {
        let path = if target == "downloads" {app.path().download_dir()} else {app.path().document_dir()}.map_err(|e|e.to_string())?;
        #[cfg(target_os = "windows")]
        let result = Command::new(r"C:\Windows\explorer.exe").arg(path).spawn();
        #[cfg(target_os = "macos")]
        let result = Command::new("/usr/bin/open").arg(path).spawn();
        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        let result = Command::new("/usr/bin/xdg-open").arg(path).spawn();
        return result.map(|_|()).map_err(|_|"تعذّر فتح المجلد على هذا النظام".into());
    }
    #[cfg(target_os = "windows")]
    let result = match target.as_str() {
        "calculator" => Command::new(r"C:\Windows\System32\calc.exe").spawn(),
        "notepad" => Command::new(r"C:\Windows\System32\notepad.exe").spawn(),
        _ => return Err("التطبيق خارج قائمة السماح".into()),
    };
    #[cfg(target_os = "macos")]
    let result = match target.as_str() {
        "calculator" => Command::new("/usr/bin/open").args(["-a", "Calculator"]).spawn(),
        "notepad" => Command::new("/usr/bin/open").args(["-a", "TextEdit"]).spawn(),
        _ => return Err("التطبيق خارج قائمة السماح".into()),
    };
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    return Err("فتح تطبيقات النظام غير متاح بأمان هنا؛ استخدم الحاسبة المحلية".into());
    #[cfg(any(target_os = "windows", target_os = "macos"))]
    result.map(|_|()).map_err(|_|"تعذّر فتح التطبيق على هذا النظام".into())
}
