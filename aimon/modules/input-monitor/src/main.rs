mod events;
mod config;

#[cfg(feature = "rdev")]
mod monitor;
#[cfg(feature = "screenshots")]
mod screenshot;
#[cfg(any(feature = "reqwest", feature = "lapin"))]
mod output;

use anyhow::Result;
use log::info;
use env_logger::Env;
use std::sync::Arc;

#[cfg(any(feature = "rdev", feature = "reqwest", feature = "lapin"))]
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();
    
    // Load configuration
    let config = Arc::new(config::load_config()?);
    info!("Starting input-monitor with config: {:?}", config);
    
    #[cfg(not(any(feature = "rdev", feature = "reqwest", feature = "lapin")))]
    {
        info!("Running in test mode - no actual monitoring enabled");
        info!("To enable full functionality, compile with --features full");
        tokio::signal::ctrl_c().await?;
        info!("Shutting down input-monitor");
        return Ok(());
    }
    
    #[cfg(any(feature = "rdev", feature = "reqwest", feature = "lapin"))]
    {
        // Create event channel
        let (tx, rx) = mpsc::channel(1000);
        
        // Initialize output handler
        #[cfg(any(feature = "reqwest", feature = "lapin"))]
        let output_handler = output::OutputHandler::new(config.clone()).await?;
        
        // Start output processor
        #[cfg(any(feature = "reqwest", feature = "lapin"))]
        let output_handle = tokio::spawn(output::process_events(rx, output_handler));
        
        // Start monitoring in a separate thread (rdev requires its own thread)
        #[cfg(feature = "rdev")]
        let monitor_handle = std::thread::spawn(move || {
            monitor::start_monitoring(tx, config)
        });
        
        // Wait for tasks
        info!("Input monitor is running. Press Ctrl+C to stop.");
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                info!("Shutdown signal received");
            }
            #[cfg(any(feature = "reqwest", feature = "lapin"))]
            _ = output_handle => {
                info!("Output handler terminated");
            }
        }
        
        info!("Shutting down input-monitor");
    }
    
    Ok(())
}