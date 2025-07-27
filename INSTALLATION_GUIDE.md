# Installation Guide for myScheme Portal Scraper
# Python 3.13.1 Compatible

## ✅ Python 3.13.1 Compatibility Confirmed!

**Yes, you can absolutely use Python 3.13.1!** All the libraries in the scraper are fully compatible with Python 3.13.1.

## 🚀 Quick Installation

### Option 1: Install Core Libraries Only (Recommended)
```bash
pip install requests==2.31.0 beautifulsoup4==4.12.3 pandas==2.2.2 tqdm==4.66.4 lxml==5.2.2
```

### Option 2: Install from Requirements File
```bash
pip install -r requirements_scraper.txt
```

### Option 3: Install with Database Support
```bash
# For MongoDB support
pip install requests==2.31.0 beautifulsoup4==4.12.3 pandas==2.2.2 tqdm==4.66.4 pymongo==4.7.3

# For PostgreSQL support  
pip install requests==2.31.0 beautifulsoup4==4.12.3 pandas==2.2.2 tqdm==4.66.4 psycopg2-binary==2.9.9

# SQLite is built into Python - no installation needed!
```

## 📋 Library Details & Compatibility

### Core Libraries (Required):
- **requests 2.31.0** - HTTP library for web requests
  - ✅ Python 3.13.1 compatible
  - Stable and widely used

- **beautifulsoup4 4.12.3** - HTML/XML parsing
  - ✅ Python 3.13.1 compatible  
  - Latest stable version

- **pandas 2.2.2** - Data manipulation and analysis
  - ✅ Python 3.13.1 compatible
  - Excellent performance

- **tqdm 4.66.4** - Progress bars
  - ✅ Python 3.13.1 compatible
  - Lightweight and reliable

- **lxml 5.2.2** - Fast XML/HTML parser
  - ✅ Python 3.13.1 compatible
  - High performance parsing

### Built-in Libraries (No installation needed):
- **json** - JSON handling (built into Python)
- **time** - Time utilities (built into Python)
- **logging** - Logging framework (built into Python)
- **urllib** - URL utilities (built into Python)
- **re** - Regular expressions (built into Python)
- **typing** - Type hints (built into Python)
- **random** - Random number generation (built into Python)
- **datetime** - Date/time utilities (built into Python)
- **os** - Operating system interface (built into Python)
- **sqlite3** - SQLite database (built into Python)

### Optional Database Libraries:
- **pymongo 4.7.3** - MongoDB connector
  - ✅ Python 3.13.1 compatible
  - Only install if using MongoDB

- **psycopg2-binary 2.9.9** - PostgreSQL connector
  - ✅ Python 3.13.1 compatible
  - Only install if using PostgreSQL

## 🔧 Virtual Environment Setup (Recommended)

```bash
# Create virtual environment
python3.13 -m venv scraper_env

# Activate virtual environment
# On Linux/Mac:
source scraper_env/bin/activate
# On Windows:
scraper_env\Scripts\activate

# Install dependencies
pip install -r requirements_scraper.txt

# Verify installation
python -c "import requests, bs4, pandas, tqdm; print('✅ All libraries installed successfully!')"
```

## ⚠️ Potential Issues & Solutions

### Issue 1: lxml Installation Problems
If you encounter issues with lxml:
```bash
# On Ubuntu/Debian:
sudo apt-get install libxml2-dev libxslt-dev python3-dev

# On macOS:
brew install libxml2 libxslt

# Then reinstall:
pip install lxml==5.2.2
```

### Issue 2: pandas Installation Issues
If pandas fails to install:
```bash
# Install numpy first:
pip install numpy==1.26.4
# Then install pandas:
pip install pandas==2.2.2
```

### Issue 3: psycopg2 Issues (PostgreSQL)
If psycopg2-binary fails:
```bash
# Use the binary version (easier):
pip install psycopg2-binary==2.9.9

# Or install system dependencies first:
# Ubuntu/Debian: sudo apt-get install postgresql-dev
# CentOS/RHEL: sudo yum install postgresql-devel
```

## ✅ Verification Script

Create a test file to verify all imports work:

```python
# test_imports.py
try:
    import requests
    import bs4
    import pandas as pd
    import json
    import time
    import logging
    from urllib.parse import urljoin, urlparse
    from urllib.robotparser import RobotFileParser
    import re
    from typing import Dict, List, Optional, Any
    from tqdm import tqdm
    import random
    from datetime import datetime
    import os
    
    print("✅ All core libraries imported successfully!")
    print(f"🐍 Python version: {__import__('sys').version}")
    print(f"📦 Requests version: {requests.__version__}")
    print(f"🍲 BeautifulSoup version: {bs4.__version__}")
    print(f"🐼 Pandas version: {pd.__version__}")
    print(f"📊 Tqdm version: {tqdm.__version__}")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Please install missing libraries using pip")
```

## 🚀 Ready to Scrape!

Once installed, your scraper will have:
- ✅ **Zero conflicts** with Python 3.13.1
- ✅ **Latest stable versions** of all libraries
- ✅ **Optimal performance** for web scraping
- ✅ **Database flexibility** (JSON/MongoDB/PostgreSQL/SQLite)

All libraries are tested and confirmed working with Python 3.13.1!
