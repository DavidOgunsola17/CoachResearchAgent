# CoachResearchAgent

**Recruiting Agent** is a streamlined tool that makes it easy for athletes to discover and contact college coaches.

You enter a **school name** and **select your sport** — the agent automatically pulls the **top 10 coaching staff members**, including:

- **Names & roles**
- **Email addresses**
- **Twitter accounts**

From there, you can:

- **Save coaches** to your personal list by school
- **Organize contacts** as you explore programs
- **Select multiple coaches** and send outreach in batches
    
    *(email or Twitter — fast, consistent, scalable)*
    

The goal:

make the recruiting process **simple**, **searchable**, and **action-ready** — no manual detective work, no scattered notes.

---

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
   playwright install chromium
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

---

### **Why it exists**

Finding coaches takes time. Tracking them takes effort.

Outreach usually happens too late — or not at all.

Recruiting Agent removes friction so you can:

- **Discover programs quickly**
- **Build a contact base you control**
- **Stay consistent with outreach**
