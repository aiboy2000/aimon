use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum InputEvent {
    KeyPress {
        #[serde(flatten)]
        metadata: EventMetadata,
        key: String,
        modifiers: Vec<String>,
    },
    KeyRelease {
        #[serde(flatten)]
        metadata: EventMetadata,
        key: String,
        modifiers: Vec<String>,
    },
    MouseClick {
        #[serde(flatten)]
        metadata: EventMetadata,
        button: MouseButton,
        position: Position,
    },
    MouseMove {
        #[serde(flatten)]
        metadata: EventMetadata,
        position: Position,
    },
    MouseScroll {
        #[serde(flatten)]
        metadata: EventMetadata,
        delta: ScrollDelta,
        position: Position,
    },
    Screenshot {
        #[serde(flatten)]
        metadata: EventMetadata,
        data: String, // Base64 encoded image
        format: String,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventMetadata {
    pub timestamp: DateTime<Utc>,
    pub session_id: String,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollDelta {
    pub x: f64,
    pub y: f64,
}

impl InputEvent {
    pub fn new_key_press(key: String, modifiers: Vec<String>) -> Self {
        InputEvent::KeyPress {
            metadata: EventMetadata::new(),
            key,
            modifiers,
        }
    }

    pub fn new_key_release(key: String, modifiers: Vec<String>) -> Self {
        InputEvent::KeyRelease {
            metadata: EventMetadata::new(),
            key,
            modifiers,
        }
    }

    pub fn new_mouse_click(button: MouseButton, x: f64, y: f64) -> Self {
        InputEvent::MouseClick {
            metadata: EventMetadata::new(),
            button,
            position: Position { x, y },
        }
    }

    pub fn new_mouse_move(x: f64, y: f64) -> Self {
        InputEvent::MouseMove {
            metadata: EventMetadata::new(),
            position: Position { x, y },
        }
    }

    pub fn new_mouse_scroll(delta_x: f64, delta_y: f64, x: f64, y: f64) -> Self {
        InputEvent::MouseScroll {
            metadata: EventMetadata::new(),
            delta: ScrollDelta { x: delta_x, y: delta_y },
            position: Position { x, y },
        }
    }

    pub fn new_screenshot(data: String, format: String) -> Self {
        InputEvent::Screenshot {
            metadata: EventMetadata::new(),
            data,
            format,
        }
    }
}

impl EventMetadata {
    pub fn new() -> Self {
        Self {
            timestamp: Utc::now(),
            session_id: get_session_id(),
            device_id: get_device_id(),
        }
    }
}

fn get_session_id() -> String {
    // In a real implementation, this would generate or retrieve a unique session ID
    std::env::var("SESSION_ID").unwrap_or_else(|_| "default_session".to_string())
}

fn get_device_id() -> String {
    // In a real implementation, this would get a unique device identifier
    std::env::var("DEVICE_ID").unwrap_or_else(|_| "default_device".to_string())
}