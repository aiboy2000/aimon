"""Service discovery client for microservices."""

import logging
from typing import List, Dict, Any, Optional
import aiohttp
import json

logger = logging.getLogger(__name__)


class ServiceDiscovery:
    """Consul-based service discovery client."""
    
    def __init__(self, consul_url: str = "http://localhost:8500"):
        self.consul_url = consul_url
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def register_service(
        self,
        service_id: str,
        name: str,
        address: str,
        port: int,
        tags: List[str] = None,
        check_url: str = None,
        check_interval: str = "10s"
    ) -> bool:
        """Register a service with Consul."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        service_data = {
            "ID": service_id,
            "Name": name,
            "Tags": tags or [],
            "Address": address,
            "Port": port,
        }
        
        if check_url:
            service_data["Check"] = {
                "HTTP": check_url,
                "Interval": check_interval,
            }
        
        try:
            async with self.session.put(
                f"{self.consul_url}/v1/agent/service/register",
                json=service_data
            ) as response:
                if response.status == 200:
                    logger.info(f"Service {name} registered successfully")
                    return True
                else:
                    logger.error(f"Failed to register service: {await response.text()}")
                    return False
        except Exception as e:
            logger.error(f"Error registering service: {e}")
            return False
    
    async def deregister_service(self, service_id: str) -> bool:
        """Deregister a service from Consul."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        try:
            async with self.session.put(
                f"{self.consul_url}/v1/agent/service/deregister/{service_id}"
            ) as response:
                return response.status == 200
        except Exception as e:
            logger.error(f"Error deregistering service: {e}")
            return False
    
    async def discover_service(self, service_name: str, tags: List[str] = None) -> List[Dict[str, Any]]:
        """Discover services by name and optional tags."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        try:
            url = f"{self.consul_url}/v1/health/service/{service_name}"
            params = {"passing": True}
            
            if tags:
                params["tag"] = tags
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    services = await response.json()
                    return [
                        {
                            "id": s["Service"]["ID"],
                            "address": s["Service"]["Address"],
                            "port": s["Service"]["Port"],
                            "tags": s["Service"]["Tags"],
                        }
                        for s in services
                    ]
                else:
                    logger.error(f"Failed to discover service: {await response.text()}")
                    return []
        except Exception as e:
            logger.error(f"Error discovering service: {e}")
            return []
    
    async def get_service_url(self, service_name: str) -> Optional[str]:
        """Get the URL of a healthy service instance."""
        services = await self.discover_service(service_name)
        if services:
            # Return the first healthy service
            service = services[0]
            return f"http://{service['address']}:{service['port']}"
        return None
    
    async def watch_service(self, service_name: str, callback: callable, index: int = 0) -> None:
        """Watch for changes to a service."""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        while True:
            try:
                url = f"{self.consul_url}/v1/health/service/{service_name}"
                params = {"index": index, "wait": "5m"}
                
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        services = await response.json()
                        new_index = int(response.headers.get("X-Consul-Index", index))
                        
                        if new_index != index:
                            await callback(services)
                            index = new_index
                    else:
                        logger.error(f"Watch failed: {await response.text()}")
                        await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error watching service: {e}")
                await asyncio.sleep(5)