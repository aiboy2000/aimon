"""AI Activity Monitor Communication Library for Python."""

from .message_queue import MessageQueueClient, MessagePublisher, MessageConsumer
from .service_discovery import ServiceDiscovery
from .config_client import ConfigClient
from .metrics import MetricsCollector

__version__ = "0.1.0"
__all__ = [
    "MessageQueueClient",
    "MessagePublisher", 
    "MessageConsumer",
    "ServiceDiscovery",
    "ConfigClient",
    "MetricsCollector",
]