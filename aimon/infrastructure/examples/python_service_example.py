#!/usr/bin/env python3
"""Example microservice using the AI Activity Monitor communication framework."""

import asyncio
import logging
from typing import Dict, Any

from aimon_comm import (
    RabbitMQClient,
    MessagePublisher,
    MessageConsumer,
    ServiceDiscovery,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExampleMicroservice:
    """Example microservice demonstrating the communication framework."""
    
    def __init__(self, service_name: str, service_id: str):
        self.service_name = service_name
        self.service_id = service_id
        self.mq_client = RabbitMQClient()
        self.publisher = MessagePublisher(self.mq_client)
        self.consumer = MessageConsumer(self.mq_client)
        self.discovery = ServiceDiscovery()
    
    async def setup(self):
        """Initialize the microservice."""
        # Connect to message queue
        await self.mq_client.connect()
        
        # Register service with Consul
        async with self.discovery as sd:
            await sd.register_service(
                service_id=self.service_id,
                name=self.service_name,
                address="localhost",
                port=8000,
                tags=["example", "python"],
                check_url="http://localhost:8000/health",
            )
        
        # Register message handlers
        self.consumer.register_handler("KeyPress", self.handle_keypress)
        self.consumer.register_handler("MouseClick", self.handle_mouse_click)
    
    async def handle_keypress(self, data: Dict[str, Any]):
        """Handle keyboard press events."""
        logger.info(f"Received KeyPress event: {data}")
        
        # Process the event
        processed_data = {
            "original": data,
            "processed_by": self.service_name,
            "key_count": len(data.get("key", "")),
        }
        
        # Publish processed event
        await self.publisher.publish_event("ProcessedKeyPress", processed_data)
    
    async def handle_mouse_click(self, data: Dict[str, Any]):
        """Handle mouse click events."""
        logger.info(f"Received MouseClick event: {data}")
        
        # Example: Check if click is in a specific region
        x = data.get("position", {}).get("x", 0)
        y = data.get("position", {}).get("y", 0)
        
        if x > 500 and y > 500:
            await self.publisher.publish_system_event(
                "ImportantRegionClicked",
                {"x": x, "y": y}
            )
    
    async def run(self):
        """Run the microservice."""
        await self.setup()
        
        # Start consuming messages
        logger.info(f"Starting {self.service_name}...")
        await self.consumer.start_consuming("example_queue")
        
        # Keep the service running
        try:
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources."""
        # Deregister from Consul
        async with self.discovery as sd:
            await sd.deregister_service(self.service_id)
        
        # Disconnect from message queue
        await self.mq_client.disconnect()


async def main():
    """Main entry point."""
    service = ExampleMicroservice(
        service_name="example-service",
        service_id="example-service-001"
    )
    await service.run()


if __name__ == "__main__":
    asyncio.run(main())