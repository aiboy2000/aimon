#!/usr/bin/env python3
"""Basic tests for activity-db module structure."""

import sys
import os
from pathlib import Path

def test_module_structure():
    """Test that all required files and directories exist."""
    base_path = Path(__file__).parent
    
    required_files = [
        "activity_db/__init__.py",
        "activity_db/main.py", 
        "activity_db/config.py",
        "activity_db/models.py",
        "activity_db/schemas.py",
        "activity_db/database.py",
        "activity_db/api/__init__.py",
        "activity_db/api/events.py",
        "activity_db/services/__init__.py",
        "activity_db/services/event_service.py",
        "tests/__init__.py",
        "tests/test_api.py",
        "requirements.txt",
        "pyproject.toml",
        "README.md"
    ]
    
    missing_files = []
    for file_path in required_files:
        full_path = base_path / file_path
        if not full_path.exists():
            missing_files.append(file_path)
    
    if missing_files:
        print(f"✗ Missing files: {missing_files}")
        return False
    
    print("✓ All required files exist")
    return True

def test_python_syntax():
    """Test that all Python files have valid syntax."""
    base_path = Path(__file__).parent
    python_files = []
    
    # Find all Python files
    for root, dirs, files in os.walk(base_path / "activity_db"):
        for file in files:
            if file.endswith(".py"):
                python_files.append(Path(root) / file)
    
    for root, dirs, files in os.walk(base_path / "tests"):
        for file in files:
            if file.endswith(".py"):
                python_files.append(Path(root) / file)
    
    syntax_errors = []
    for py_file in python_files:
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
            compile(content, py_file, 'exec')
        except SyntaxError as e:
            syntax_errors.append(f"{py_file}: {e}")
        except Exception as e:
            syntax_errors.append(f"{py_file}: {e}")
    
    if syntax_errors:
        print(f"✗ Syntax errors: {syntax_errors}")
        return False
    
    print(f"✓ All {len(python_files)} Python files have valid syntax")
    return True

def test_requirements_format():
    """Test that requirements.txt is properly formatted."""
    base_path = Path(__file__).parent
    req_file = base_path / "requirements.txt"
    
    try:
        with open(req_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Check for common requirements
        required_packages = ['fastapi', 'uvicorn', 'sqlalchemy', 'pydantic']
        found_packages = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#'):
                package_name = line.split('==')[0].split('[')[0].lower()
                if package_name in required_packages:
                    found_packages.append(package_name)
        
        missing_packages = set(required_packages) - set(found_packages)
        if missing_packages:
            print(f"✗ Missing required packages: {missing_packages}")
            return False
        
        print(f"✓ Requirements file contains all required packages")
        return True
        
    except Exception as e:
        print(f"✗ Error reading requirements.txt: {e}")
        return False

def test_api_endpoints():
    """Test that API endpoints are defined."""
    base_path = Path(__file__).parent
    events_api = base_path / "activity_db/api/events.py"
    
    try:
        with open(events_api, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for required endpoints
        endpoints = [
            '@router.post("/"',  # Create event
            '@router.get("/"',   # List events
            '@router.get("/{event_id}"',  # Get event
            '@router.put("/{event_id}"',  # Update event
            '@router.delete("/{event_id}"'  # Delete event
        ]
        
        missing_endpoints = []
        for endpoint in endpoints:
            if endpoint not in content:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            print(f"✗ Missing API endpoints: {missing_endpoints}")
            return False
        
        print("✓ All required API endpoints are defined")
        return True
        
    except Exception as e:
        print(f"✗ Error checking API endpoints: {e}")
        return False

def main():
    """Run all tests."""
    print("Running activity-db module validation tests...\n")
    
    tests = [
        test_module_structure,
        test_python_syntax,
        test_requirements_format,
        test_api_endpoints
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        print(f"\nRunning {test.__name__}:")
        if test():
            passed += 1
        else:
            print(f"Failed: {test.__name__}")
    
    print(f"\n{'='*50}")
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("✓ activity-db module validation PASSED")
        return 0
    else:
        print("✗ activity-db module validation FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())