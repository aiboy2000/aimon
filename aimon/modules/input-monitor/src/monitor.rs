use crate::events::{InputEvent, MouseButton};
use crate::config::Config;
use crate::screenshot;
use anyhow::Result;
use log::{error, info, debug};
use rdev::{listen, Event, EventType, Key, Button};
use std::sync::Arc;
use tokio::sync::mpsc::Sender;
use tokio::runtime::Runtime;
use std::time::{Duration, Instant};
use std::collections::HashSet;

pub fn start_monitoring(tx: Sender<InputEvent>, config: Arc<Config>) -> Result<()> {
    info!("Starting input monitoring");
    
    let rt = Runtime::new()?;
    let mut last_screenshot = Instant::now();
    let screenshot_interval = Duration::from_secs(config.screenshot_interval_secs);
    let mut active_modifiers = HashSet::new();
    
    // Clone for the closure
    let tx_clone = tx.clone();
    let config_clone = config.clone();
    
    listen(move |event: Event| {
        debug!("Received event: {:?}", event.event_type);
        
        // Handle screenshot timing
        if config_clone.screenshot_enabled && last_screenshot.elapsed() >= screenshot_interval {
            last_screenshot = Instant::now();
            let tx = tx_clone.clone();
            rt.spawn(async move {
                if let Ok(event) = screenshot::capture_screenshot().await {
                    if let Err(e) = tx.send(event).await {
                        error!("Failed to send screenshot event: {}", e);
                    }
                }
            });
        }
        
        // Convert rdev event to our InputEvent
        let input_event = match event.event_type {
            EventType::KeyPress(key) => {
                update_modifiers(&mut active_modifiers, &key, true);
                Some(InputEvent::new_key_press(
                    key_to_string(&key),
                    get_active_modifiers(&active_modifiers),
                ))
            }
            EventType::KeyRelease(key) => {
                update_modifiers(&mut active_modifiers, &key, false);
                Some(InputEvent::new_key_release(
                    key_to_string(&key),
                    get_active_modifiers(&active_modifiers),
                ))
            }
            EventType::ButtonPress(button) => {
                let (x, y) = (event.position.x, event.position.y);
                Some(InputEvent::new_mouse_click(
                    button_to_mouse_button(&button),
                    x,
                    y,
                ))
            }
            EventType::MouseMove { x, y } => {
                if config_clone.track_mouse_movement {
                    Some(InputEvent::new_mouse_move(x, y))
                } else {
                    None
                }
            }
            EventType::Wheel { delta_x, delta_y } => {
                let (x, y) = (event.position.x, event.position.y);
                Some(InputEvent::new_mouse_scroll(delta_x, delta_y, x, y))
            }
            _ => None,
        };
        
        // Send event if we created one
        if let Some(event) = input_event {
            let tx = tx_clone.clone();
            rt.spawn(async move {
                if let Err(e) = tx.send(event).await {
                    error!("Failed to send input event: {}", e);
                }
            });
        }
    })?;
    
    Ok(())
}

fn key_to_string(key: &Key) -> String {
    match key {
        Key::Alt => "Alt".to_string(),
        Key::AltGr => "AltGr".to_string(),
        Key::Backspace => "Backspace".to_string(),
        Key::CapsLock => "CapsLock".to_string(),
        Key::ControlLeft => "ControlLeft".to_string(),
        Key::ControlRight => "ControlRight".to_string(),
        Key::Delete => "Delete".to_string(),
        Key::DownArrow => "DownArrow".to_string(),
        Key::End => "End".to_string(),
        Key::Escape => "Escape".to_string(),
        Key::F1 => "F1".to_string(),
        Key::F2 => "F2".to_string(),
        Key::F3 => "F3".to_string(),
        Key::F4 => "F4".to_string(),
        Key::F5 => "F5".to_string(),
        Key::F6 => "F6".to_string(),
        Key::F7 => "F7".to_string(),
        Key::F8 => "F8".to_string(),
        Key::F9 => "F9".to_string(),
        Key::F10 => "F10".to_string(),
        Key::F11 => "F11".to_string(),
        Key::F12 => "F12".to_string(),
        Key::Home => "Home".to_string(),
        Key::LeftArrow => "LeftArrow".to_string(),
        Key::MetaLeft => "MetaLeft".to_string(),
        Key::MetaRight => "MetaRight".to_string(),
        Key::PageDown => "PageDown".to_string(),
        Key::PageUp => "PageUp".to_string(),
        Key::Return => "Return".to_string(),
        Key::RightArrow => "RightArrow".to_string(),
        Key::ShiftLeft => "ShiftLeft".to_string(),
        Key::ShiftRight => "ShiftRight".to_string(),
        Key::Space => "Space".to_string(),
        Key::Tab => "Tab".to_string(),
        Key::UpArrow => "UpArrow".to_string(),
        Key::PrintScreen => "PrintScreen".to_string(),
        Key::ScrollLock => "ScrollLock".to_string(),
        Key::Pause => "Pause".to_string(),
        Key::NumLock => "NumLock".to_string(),
        Key::Insert => "Insert".to_string(),
        Key::Num0 => "0".to_string(),
        Key::Num1 => "1".to_string(),
        Key::Num2 => "2".to_string(),
        Key::Num3 => "3".to_string(),
        Key::Num4 => "4".to_string(),
        Key::Num5 => "5".to_string(),
        Key::Num6 => "6".to_string(),
        Key::Num7 => "7".to_string(),
        Key::Num8 => "8".to_string(),
        Key::Num9 => "9".to_string(),
        Key::KeyA => "A".to_string(),
        Key::KeyB => "B".to_string(),
        Key::KeyC => "C".to_string(),
        Key::KeyD => "D".to_string(),
        Key::KeyE => "E".to_string(),
        Key::KeyF => "F".to_string(),
        Key::KeyG => "G".to_string(),
        Key::KeyH => "H".to_string(),
        Key::KeyI => "I".to_string(),
        Key::KeyJ => "J".to_string(),
        Key::KeyK => "K".to_string(),
        Key::KeyL => "L".to_string(),
        Key::KeyM => "M".to_string(),
        Key::KeyN => "N".to_string(),
        Key::KeyO => "O".to_string(),
        Key::KeyP => "P".to_string(),
        Key::KeyQ => "Q".to_string(),
        Key::KeyR => "R".to_string(),
        Key::KeyS => "S".to_string(),
        Key::KeyT => "T".to_string(),
        Key::KeyU => "U".to_string(),
        Key::KeyV => "V".to_string(),
        Key::KeyW => "W".to_string(),
        Key::KeyX => "X".to_string(),
        Key::KeyY => "Y".to_string(),
        Key::KeyZ => "Z".to_string(),
        _ => format!("{:?}", key),
    }
}

fn button_to_mouse_button(button: &Button) -> MouseButton {
    match button {
        Button::Left => MouseButton::Left,
        Button::Right => MouseButton::Right,
        Button::Middle => MouseButton::Middle,
        _ => MouseButton::Unknown,
    }
}

fn update_modifiers(modifiers: &mut HashSet<String>, key: &Key, pressed: bool) {
    let modifier = match key {
        Key::ShiftLeft | Key::ShiftRight => Some("Shift"),
        Key::ControlLeft | Key::ControlRight => Some("Control"),
        Key::Alt | Key::AltGr => Some("Alt"),
        Key::MetaLeft | Key::MetaRight => Some("Meta"),
        _ => None,
    };
    
    if let Some(mod_name) = modifier {
        if pressed {
            modifiers.insert(mod_name.to_string());
        } else {
            modifiers.remove(mod_name);
        }
    }
}

fn get_active_modifiers(modifiers: &HashSet<String>) -> Vec<String> {
    modifiers.iter().cloned().collect()
}