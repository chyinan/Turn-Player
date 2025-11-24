use ffmpeg_sidecar::command::FfmpegCommand;
// (ffprobe dependency removed)

use std::fs;
use tempfile::Builder;
use base64::{Engine as _, engine::general_purpose};


pub fn extract_album_art(path: &str) -> Result<Option<String>, String> {
    let temp_dir = Builder::new().prefix("turn-player-art").tempdir().map_err(|e| e.to_string())?;
    let temp_file_path = temp_dir.path().join("album_art.jpg");

    let status = FfmpegCommand::new()
        .input(path)
        .args([
            "-an",
            "-vcodec", "copy",
        ])
        .output(temp_file_path.to_str().unwrap())
        .spawn()
        .and_then(|mut c| c.wait())
        .map_err(|e| e.to_string())?;

    if status.success() {
        if let Ok(file_bytes) = fs::read(&temp_file_path) {
            if !file_bytes.is_empty() {
                 let base64_str = general_purpose::STANDARD.encode(&file_bytes);
                 return Ok(Some(base64_str));
            }
        }
    }

    Ok(None)
}

pub fn get_metadata(_path: &str) -> Result<(Option<String>, Option<String>), String> {
    // TODO: Implement ffprobe parsing for title/artist
    Ok((None, None))
} 