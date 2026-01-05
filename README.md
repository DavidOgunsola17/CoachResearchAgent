### **SKOUT | Start the Recruitment Process FAST**

**Find Coaches. Save Contacts. Reach Out Fast.**

**SKOUT** (stylized as **SKT**) is a streamlined AI platform that removes the friction from college recruiting. For less than the cost of lunch, **SKOUT** replaces manual detective work with high-speed automation, giving athletes the tools to discover programs and build a contact base they control.

The platform operates through two core modules:

### **FND | Discovery Module**

Stop wasting hours on search engines. **FND** uses AI to instantly map out your target programs.

- Enter a school and sport to pull the top 10 coaching staff members.
- Get instant access to **Names, Roles, Email Addresses,** and **Twitter handles**.
- Build your "Board"—save and organize programs into a centralized, action-ready list.

### **AGT | Outreach Module**

Consistency is what gets you recruited. **AGT** automates the heavy lifting of communication.

- Select multiple coaches from your **FND** list and engage.
- Send batch outreach via email or Twitter with one click.
- Maintain a fast, professional, and scalable presence in coaches' inboxes.

---

### **Why SKOUT?**

## Installation

### Prerequisites

- Python 3.8 or higher
- A Google Gemini API key

### Setup Steps

1. **Clone the repository** (if you haven't already)

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Playwright browsers:**
   
   This is required for web scraping. After installing the Python packages, run:
   ```bash
   sudo apt-get update && sudo apt-get install -y \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libcups2t64 \
    libdrm2 \
    libxkbcommon0 \
    libatspi2.0-0t64 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2t64 \
    libxcb1 \
    libxshmfence1 \
    libglib2.0-0t64 \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libexpat1 \
    libx11-6 \
    libxcb-shm0 \
    libxcb-shape0 \
    libxext6 \
    libxrender1 \
    libxtst6 \
    libxi6 \
    libpango-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0
   ```
   
   > **Note:** If you're using a DevContainer or Codespaces, browsers are installed automatically during container setup.

4. **Set up environment variables:**
   
   Create a `.env` file in the project root with your Gemini API key:
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```
   
   Replace `your_api_key_here` with your actual Google Gemini API key.

---

## Usage

### Basic Usage

Run the agent with a school name and sport:

```bash
python main.py "School Name" "Sport"
```

### Examples

```bash
# Football coaches at Duke
python main.py "duke" "football"

# Men's Basketball coaches at Clemson
python main.py "Clemson University" "Men's Basketball"

# Women's Soccer coaches at Stanford
python main.py "Stanford University" "Women's Soccer"
```

### Command-Line Options

- `--output` or `-o`: Specify a custom output CSV filename (auto-generated if not provided)
- `--headless`: Run browser in headless mode (default: True)
- `--verbose` or `-v`: Enable verbose logging for debugging

### Output

The agent generates a CSV file with coaching staff information including:
- Names and roles
- Email addresses (when available)
- Twitter handles (when available)

The CSV file is saved in the project directory with a name like `Duke_Football_Coaches.csv`.


- **Speed:** **FND** eliminates the manual detective work of finding staff.
- **Control:** Build a private database of contacts that you own and manage.
- **Scale:** **AGT** ensures you stay consistent with outreach while others fall behind.

**SKOUT: Simple. Searchable. Action-Ready.**
