from setuptools import setup, find_packages

setup(
    name="aimon-comm",
    version="0.1.0",
    description="Communication library for AI Activity Monitor microservices",
    author="AI Activity Monitor",
    packages=find_packages(),
    install_requires=[
        "aio-pika>=9.3.0",
        "aiohttp>=3.9.0",
        "prometheus-client>=0.19.0",
        "python-consul>=1.1.0",
    ],
    python_requires=">=3.8",
)