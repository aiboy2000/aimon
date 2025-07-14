use input_monitor::events::{InputEvent, MouseButton};
use input_monitor::config::Config;

#[cfg(any(feature = "reqwest", feature = "lapin"))]
use input_monitor::output::OutputHandler;
#[cfg(any(feature = "reqwest", feature = "lapin"))]
use std::sync::Arc;

#[tokio::test]
async fn test_event_creation() {
    let event = InputEvent::new_key_press("A".to_string(), vec!["Shift".to_string()]);
    
    match event {
        InputEvent::KeyPress { key, modifiers, .. } => {
            assert_eq!(key, "A");
            assert_eq!(modifiers, vec!["Shift"]);
        }
        _ => panic!("Expected KeyPress event"),
    }
}

#[tokio::test]
async fn test_mouse_event_creation() {
    let event = InputEvent::new_mouse_click(MouseButton::Left, 100.0, 200.0);
    
    match event {
        InputEvent::MouseClick { button, position, .. } => {
            assert!(matches!(button, MouseButton::Left));
            assert_eq!(position.x, 100.0);
            assert_eq!(position.y, 200.0);
        }
        _ => panic!("Expected MouseClick event"),
    }
}

#[tokio::test]
#[cfg(any(feature = "reqwest", feature = "lapin"))]
async fn test_output_handler_initialization() {
    let config = Arc::new(Config::default());
    let handler = OutputHandler::new(config).await;
    assert!(handler.is_ok());
}

#[tokio::test]
async fn test_event_serialization() {
    let event = InputEvent::new_key_press("A".to_string(), vec!["Shift".to_string()]);
    let json = serde_json::to_string(&event);
    assert!(json.is_ok());
    
    let parsed: Result<InputEvent, _> = serde_json::from_str(&json.unwrap());
    assert!(parsed.is_ok());
}

#[tokio::test]
async fn test_config_validation() {
    let config = Config::default();
    assert!(!config.output_url.is_empty());
    assert!(config.batch_size > 0);
    assert!(config.max_retries > 0);
    assert!(config.screenshot_interval_secs > 0);
}