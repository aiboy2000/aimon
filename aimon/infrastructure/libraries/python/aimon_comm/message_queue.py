"""Message Queue abstraction for microservice communication."""

import asyncio
import json
import logging
from typing import Callable, Optional, Dict, Any
from abc import ABC, abstractmethod

import aio_pika
from aio_pika import ExchangeType

logger = logging.getLogger(__name__)


class MessageQueueClient(ABC):
    """Abstract base class for message queue clients."""
    
    @abstractmethod
    async def connect(self) -> None:
        """Connect to the message queue."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Disconnect from the message queue."""
        pass
    
    @abstractmethod
    async def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """Publish a message to the queue."""
        pass
    
    @abstractmethod
    async def consume(self, queue: str, callback: Callable) -> None:
        """Consume messages from a queue."""
        pass


class RabbitMQClient(MessageQueueClient):
    """RabbitMQ implementation of MessageQueueClient."""
    
    def __init__(self, url: str = "amqp://aimon:aimon123@localhost:5672/"):
        self.url = url
        self.connection: Optional[aio_pika.Connection] = None
        self.channel: Optional[aio_pika.Channel] = None
        self.exchanges: Dict[str, aio_pika.Exchange] = {}
    
    async def connect(self) -> None:
        """Connect to RabbitMQ."""
        try:
            self.connection = await aio_pika.connect_robust(self.url)
            self.channel = await self.connection.channel()
            logger.info("Connected to RabbitMQ")
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from RabbitMQ."""
        if self.connection and not self.connection.is_closed:
            await self.connection.close()
            logger.info("Disconnected from RabbitMQ")
    
    async def declare_exchange(self, name: str, exchange_type: str = "topic") -> aio_pika.Exchange:
        """Declare an exchange."""
        if name not in self.exchanges:
            exchange = await self.channel.declare_exchange(
                name,
                ExchangeType[exchange_type.upper()],
                durable=True
            )
            self.exchanges[name] = exchange
        return self.exchanges[name]
    
    async def publish(self, exchange: str, routing_key: str, message: Dict[str, Any]) -> None:
        """Publish a message to RabbitMQ."""
        if not self.channel:
            raise RuntimeError("Not connected to RabbitMQ")
        
        exchange_obj = await self.declare_exchange(exchange)
        
        await exchange_obj.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                content_type="application/json",
            ),
            routing_key=routing_key,
        )
        
        logger.debug(f"Published message to {exchange}/{routing_key}")
    
    async def consume(self, queue: str, callback: Callable) -> None:
        """Consume messages from a queue."""
        if not self.channel:
            raise RuntimeError("Not connected to RabbitMQ")
        
        queue_obj = await self.channel.declare_queue(queue, durable=True)
        
        async def process_message(message: aio_pika.IncomingMessage):
            async with message.process():
                try:
                    data = json.loads(message.body.decode())
                    await callback(data)
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    # Message will be rejected and requeued
                    raise
        
        await queue_obj.consume(process_message)
        logger.info(f"Started consuming from queue: {queue}")


class MessagePublisher:
    """High-level message publisher."""
    
    def __init__(self, client: MessageQueueClient):
        self.client = client
    
    async def publish_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Publish an event to the activity events exchange."""
        await self.client.publish(
            exchange="activity_events",
            routing_key=f"input.{event_type}",
            message={
                "type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time(),
            }
        )
    
    async def publish_system_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Publish a system event."""
        await self.client.publish(
            exchange="system_events",
            routing_key=f"system.{event_type}",
            message={
                "type": event_type,
                "data": data,
                "timestamp": asyncio.get_event_loop().time(),
            }
        )


class MessageConsumer:
    """High-level message consumer."""
    
    def __init__(self, client: MessageQueueClient):
        self.client = client
        self.handlers: Dict[str, Callable] = {}
    
    def register_handler(self, event_type: str, handler: Callable) -> None:
        """Register a handler for a specific event type."""
        self.handlers[event_type] = handler
    
    async def start_consuming(self, queue: str) -> None:
        """Start consuming messages from a queue."""
        async def handle_message(message: Dict[str, Any]):
            event_type = message.get("type")
            if event_type in self.handlers:
                await self.handlers[event_type](message.get("data", {}))
            else:
                logger.warning(f"No handler registered for event type: {event_type}")
        
        await self.client.consume(queue, handle_message)