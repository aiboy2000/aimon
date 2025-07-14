use crate::events::InputEvent;
use crate::config::Config;
use anyhow::Result;
use log::{error, info, warn};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::mpsc::Receiver;
use tokio::time::{timeout, sleep};

#[cfg(feature = "reqwest")]
use reqwest::Client;

#[cfg(feature = "lapin")]
use lapin::{Connection, ConnectionProperties, BasicProperties, options::*};

pub struct OutputHandler {
    config: Arc<Config>,
    #[cfg(feature = "reqwest")]
    http_client: Option<Client>,
    #[cfg(feature = "lapin")]
    rabbitmq_channel: Option<lapin::Channel>,
}

impl OutputHandler {
    pub async fn new(config: Arc<Config>) -> Result<Self> {
        #[cfg(feature = "reqwest")]
        let http_client = Some(Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?);
        
        // Initialize RabbitMQ connection if configured
        #[cfg(feature = "lapin")]
        let rabbitmq_channel = if let Some(rabbitmq_url) = &config.rabbitmq_url {
            match Self::init_rabbitmq(rabbitmq_url, &config.rabbitmq_exchange).await {
                Ok(channel) => Some(channel),
                Err(e) => {
                    warn!("Failed to initialize RabbitMQ: {}. Falling back to HTTP only.", e);
                    None
                }
            }
        } else {
            None
        };
        
        Ok(Self {
            config,
            #[cfg(feature = "reqwest")]
            http_client,
            #[cfg(feature = "lapin")]
            rabbitmq_channel,
        })
    }
    
    #[cfg(feature = "lapin")]
    async fn init_rabbitmq(url: &str, exchange: &str) -> Result<lapin::Channel> {
        let conn = Connection::connect(url, ConnectionProperties::default()).await?;
        let channel = conn.create_channel().await?;
        
        // Declare exchange
        channel.exchange_declare(
            exchange,
            lapin::ExchangeKind::Topic,
            ExchangeDeclareOptions::default(),
            Default::default(),
        ).await?;
        
        info!("RabbitMQ connection established");
        Ok(channel)
    }
    
    pub async fn send_event(&self, event: &InputEvent) -> Result<()> {
        let mut last_error = None;
        
        // Try RabbitMQ first if available
        #[cfg(feature = "lapin")]
        if let Some(channel) = &self.rabbitmq_channel {
            match self.send_to_rabbitmq(channel, event).await {
                Ok(_) => return Ok(()),
                Err(e) => {
                    error!("Failed to send to RabbitMQ: {}", e);
                    last_error = Some(e);
                }
            }
        }
        
        // Fallback to HTTP
        #[cfg(feature = "reqwest")]
        if let Some(client) = &self.http_client {
            for attempt in 1..=self.config.max_retries {
                match self.send_to_http(client, event).await {
                    Ok(_) => return Ok(()),
                    Err(e) => {
                        error!("HTTP send attempt {} failed: {}", attempt, e);
                        last_error = Some(e);
                        
                        if attempt < self.config.max_retries {
                            sleep(Duration::from_millis(self.config.retry_delay_ms)).await;
                        }
                    }
                }
            }
        }
        
        // If no output methods are available, just log
        #[cfg(not(any(feature = "reqwest", feature = "lapin")))]
        {
            info!("Event (no output configured): {}", serde_json::to_string(event).unwrap_or_default());
            return Ok(());
        }
        
        if let Some(e) = last_error {
            Err(e)
        } else {
            Err(anyhow::anyhow!("All output methods failed"))
        }
    }
    
    #[cfg(feature = "lapin")]
    async fn send_to_rabbitmq(&self, channel: &lapin::Channel, event: &InputEvent) -> Result<()> {
        let payload = serde_json::to_vec(event)?;
        
        channel.basic_publish(
            &self.config.rabbitmq_exchange,
            &self.config.rabbitmq_routing_key,
            BasicPublishOptions::default(),
            &payload,
            BasicProperties::default().with_content_type("application/json".into()),
        ).await?;
        
        Ok(())
    }
    
    #[cfg(feature = "reqwest")]
    async fn send_to_http(&self, client: &Client, event: &InputEvent) -> Result<()> {
        let mut request = client
            .post(&self.config.output_url)
            .json(event);
        
        if let Some(api_key) = &self.config.api_key {
            request = request.header("Authorization", format!("Bearer {}", api_key));
        }
        
        let response = request.send().await?;
        
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "HTTP request failed with status: {}",
                response.status()
            ));
        }
        
        Ok(())
    }
}

pub async fn process_events(
    mut rx: Receiver<InputEvent>,
    handler: OutputHandler,
) -> Result<()> {
    let mut batch = Vec::with_capacity(handler.config.batch_size);
    let batch_timeout = Duration::from_millis(handler.config.batch_timeout_ms);
    
    info!("Starting event processing");
    
    loop {
        // Try to receive events with timeout
        match timeout(batch_timeout, rx.recv()).await {
            Ok(Some(event)) => {
                batch.push(event);
                
                // Process batch if it's full
                if batch.len() >= handler.config.batch_size {
                    process_batch(&handler, &mut batch).await;
                }
            }
            Ok(None) => {
                // Channel closed
                info!("Event channel closed");
                break;
            }
            Err(_) => {
                // Timeout - process any pending events
                if !batch.is_empty() {
                    process_batch(&handler, &mut batch).await;
                }
            }
        }
    }
    
    // Process any remaining events
    if !batch.is_empty() {
        process_batch(&handler, &mut batch).await;
    }
    
    Ok(())
}

async fn process_batch(handler: &OutputHandler, batch: &mut Vec<InputEvent>) {
    info!("Processing batch of {} events", batch.len());
    
    for event in batch.drain(..) {
        if let Err(e) = handler.send_event(&event).await {
            error!("Failed to send event: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    
    #[tokio::test]
    async fn test_output_handler_creation() {
        let config = Arc::new(Config::default());
        let handler = OutputHandler::new(config).await;
        assert!(handler.is_ok());
    }
}