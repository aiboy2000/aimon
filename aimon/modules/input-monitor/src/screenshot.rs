use crate::events::InputEvent;
use anyhow::Result;
use log::{error, info};

#[cfg(all(feature = "screenshots", feature = "image"))]
use screenshots::Screen;
#[cfg(feature = "image")]
use image::ImageOutputFormat;
use base64::{Engine as _, engine::general_purpose};
#[cfg(feature = "image")]
use std::io::Cursor;

pub async fn capture_screenshot() -> Result<InputEvent> {
    info!("Capturing screenshot");
    
    #[cfg(all(feature = "screenshots", feature = "image"))]
    {
        // Get available screens
        let screens = Screen::all()?;
        
        if screens.is_empty() {
            error!("No screens found");
            return Err(anyhow::anyhow!("No screens available"));
        }
        
        // Capture from primary screen
        let screen = &screens[0];
        let image = screen.capture()?;
        
        // Convert to PNG and encode as base64
        let mut buffer = Cursor::new(Vec::new());
        image.write_to(&mut buffer, ImageOutputFormat::Png)?;
        
        let encoded = general_purpose::STANDARD.encode(buffer.into_inner());
        
        Ok(InputEvent::new_screenshot(encoded, "png".to_string()))
    }
    
    #[cfg(not(all(feature = "screenshots", feature = "image")))]
    {
        // Placeholder screenshot for testing
        let dummy_data = general_purpose::STANDARD.encode("dummy_screenshot_data");
        Ok(InputEvent::new_screenshot(dummy_data, "png".to_string()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    #[ignore] // Ignore in CI environments without display
    async fn test_screenshot_capture() {
        let result = capture_screenshot().await;
        assert!(result.is_ok());
        
        if let Ok(InputEvent::Screenshot { data, format, .. }) = result {
            assert!(!data.is_empty());
            assert_eq!(format, "png");
        }
    }
}