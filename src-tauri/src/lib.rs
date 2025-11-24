mod audio_processor;
use serde::{Serialize, Deserialize};
use log::info;

#[derive(Debug, Serialize, Deserialize)]
struct AudioMetadata {
    title: Option<String>,
    artist: Option<String>,
    album_art_base64: Option<String>,
}

#[tauri::command]
async fn get_audio_metadata(path: String) -> Result<AudioMetadata, String> {
    let (title, artist) = audio_processor::get_metadata(&path)?;
    let album_art_base64 = match audio_processor::extract_album_art(&path) {
        Ok(v) => v,
        Err(e) => {
            info!("Failed to extract album art: {}", e);
            None
        }
    };

    Ok(AudioMetadata {
        title,
        artist,
        album_art_base64,
    })
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_audio_metadata])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
