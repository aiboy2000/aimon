use serde::{Serialize, Deserialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    // Server configuration
    pub output_url: String,
    pub api_key: Option<String>,
    
    // RabbitMQ configuration
    pub rabbitmq_url: Option<String>,
    pub rabbitmq_exchange: String,
    pub rabbitmq_routing_key: String,
    
    // Monitoring configuration
    pub track_mouse_movement: bool,
    pub screenshot_enabled: bool,
    pub screenshot_interval_secs: u64,
    pub screenshot_quality: u8,
    
    // Performance configuration
    pub batch_size: usize,
    pub batch_timeout_ms: u64,
    pub max_retries: u32,
    pub retry_delay_ms: u64,
    
    // Privacy configuration
    pub filter_passwords: bool,
    pub excluded_apps: Vec<String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            output_url: "http://localhost:8080/api/events".to_string(),
            api_key: None,
            rabbitmq_url: None,
            rabbitmq_exchange: "activity_events".to_string(),
            rabbitmq_routing_key: "input.events".to_string(),
            track_mouse_movement: false,
            screenshot_enabled: true,
            screenshot_interval_secs: 300, // 5 minutes
            screenshot_quality: 75,
            batch_size: 100,
            batch_timeout_ms: 5000,
            max_retries: 3,
            retry_delay_ms: 1000,
            filter_passwords: true,
            excluded_apps: vec![
                "KeePass".to_string(),
                "1Password".to_string(),
                "Bitwarden".to_string(),
            ],
        }
    }
}

pub fn load_config() -> anyhow::Result<Config> {
    // Start with default configuration
    let mut config = Config::default();
    
    // Load from config.toml if it exists
    if let Ok(contents) = fs::read_to_string("config.toml") {
        if let Ok(file_config) = toml::from_str::<Config>(&contents) {
            config = file_config;
        }
    }
    
    // Override with environment variables
    if let Ok(url) = std::env::var("INPUT_MONITOR_OUTPUT_URL") {
        config.output_url = url;
    }
    if let Ok(api_key) = std::env::var("INPUT_MONITOR_API_KEY") {
        config.api_key = Some(api_key);
    }
    if let Ok(track_mouse) = std::env::var("INPUT_MONITOR_TRACK_MOUSE_MOVEMENT") {
        config.track_mouse_movement = track_mouse.parse().unwrap_or(false);
    }
    if let Ok(screenshot_enabled) = std::env::var("INPUT_MONITOR_SCREENSHOT_ENABLED") {
        config.screenshot_enabled = screenshot_enabled.parse().unwrap_or(true);
    }
    
    Ok(config)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.output_url, "http://localhost:8080/api/events");
        assert!(!config.track_mouse_movement);
        assert!(config.screenshot_enabled);
    }
}