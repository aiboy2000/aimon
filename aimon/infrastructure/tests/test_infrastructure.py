#!/usr/bin/env python3
"""Test script to validate infrastructure components."""

import asyncio
import aiohttp
import sys
from typing import Dict, List, Tuple


class InfrastructureTest:
    """Test infrastructure components availability."""
    
    def __init__(self):
        self.results: List[Tuple[str, bool, str]] = []
    
    async def test_service(self, name: str, url: str, expected_status: int = 200) -> None:
        """Test if a service is accessible."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=5) as response:
                    if response.status == expected_status:
                        self.results.append((name, True, "OK"))
                    else:
                        self.results.append((name, False, f"Status: {response.status}"))
        except Exception as e:
            self.results.append((name, False, str(e)))
    
    async def test_rabbitmq_api(self) -> None:
        """Test RabbitMQ management API."""
        try:
            async with aiohttp.ClientSession() as session:
                auth = aiohttp.BasicAuth('aimon', 'aimon123')
                async with session.get(
                    'http://localhost:15672/api/overview',
                    auth=auth,
                    timeout=5
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        version = data.get('rabbitmq_version', 'Unknown')
                        self.results.append(("RabbitMQ API", True, f"Version: {version}"))
                    else:
                        self.results.append(("RabbitMQ API", False, f"Status: {response.status}"))
        except Exception as e:
            self.results.append(("RabbitMQ API", False, str(e)))
    
    async def run_tests(self) -> None:
        """Run all infrastructure tests."""
        print("Testing AI Activity Monitor Infrastructure...\n")
        
        # Define services to test
        services = [
            ("Traefik Dashboard", "http://localhost:8080/api/overview"),
            ("Consul UI", "http://localhost:8500/v1/status/leader"),
            ("Vault", "http://localhost:8200/v1/sys/health"),
            ("Prometheus", "http://localhost:9090/-/healthy"),
            ("Grafana", "http://localhost:3000/api/health"),
            ("Elasticsearch", "http://localhost:9200/_cluster/health"),
            ("Kibana", "http://localhost:5601/api/status"),
        ]
        
        # Test each service
        tasks = [self.test_service(name, url) for name, url in services]
        tasks.append(self.test_rabbitmq_api())
        
        await asyncio.gather(*tasks)
        
        # Test Redis separately (requires redis-py)
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, decode_responses=True)
            r.ping()
            self.results.append(("Redis", True, "OK"))
        except Exception as e:
            self.results.append(("Redis", False, str(e)))
    
    def print_results(self) -> None:
        """Print test results."""
        print("\nInfrastructure Test Results:")
        print("=" * 60)
        
        for service, success, message in self.results:
            status = "✓" if success else "✗"
            print(f"{status} {service:<20} {message}")
        
        # Summary
        total = len(self.results)
        passed = sum(1 for _, success, _ in self.results if success)
        
        print("=" * 60)
        print(f"Total: {total}, Passed: {passed}, Failed: {total - passed}")
        
        if passed == total:
            print("\n✓ All infrastructure components are running!")
            return True
        else:
            print("\n✗ Some infrastructure components are not available.")
            print("  Run './scripts/setup.sh' to start all services.")
            return False


async def main():
    """Main entry point."""
    tester = InfrastructureTest()
    await tester.run_tests()
    success = tester.print_results()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())