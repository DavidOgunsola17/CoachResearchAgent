### **SKOUT | Start the Recruitment Process FAST**

**Find Coaches. Save Contacts. Reach Out Fast.**

**SKOUT** is a streamlined AI platform that removes the friction from college recruiting. For less than the cost of lunch, **SKOUT** replaces manual detective work with high-speed automation, giving athletes the tools to discover programs and build a contact base they control.

The platform operates through two core modules:

### **Discovery and Search Module**

Stop wasting hours on search engines. **SKOUT** uses AI to instantly map out your target programs.

- Enter a school and sport to pull the top 10 coaching staff members.
- Get instant access to **Names, Roles, Email Addresses,** and **Twitter handles**.
- Build your "Board"—save and organize programs into a centralized, action-ready list.

### **Outreach and Messaging Module**

Consistency is what gets you recruited. **SKOUT** automates the heavy lifting of communication.

- Select multiple coaches from your contact list and engage.
- Send batch outreach via email or Twitter with one click.
- Maintain a fast, professional, and scalable presence in coaches' inboxes.

---

### **Why SKOUT?**

- **Speed:** Automated discovery eliminates the manual detective work of finding staff.
- **Control:** Build a private database of contacts that you own and manage.
- **Scale:** Automated outreach ensures you stay consistent with outreach while others fall behind.

**SKOUT: Simple. Searchable. Action-Ready.**

---

## Installation

### Prerequisites

- Python 3.8 or higher
- An OpenAI API key

### Setup Steps

1. **Clone the repository** (if you haven't already)

2. **Install Python dependencies:**
```bash
   pip install -r requirements.txt
```
   
   
   > **Note:** If you're using a DevContainer or Codespaces, browsers are installed automatically during container setup.

4. **Set up environment variables:**
   
   Create a `.env` file in the project root with your OpenAI API key:
```bash
   echo "OPENAI_API_KEY=your_api_key_here" > .env
```
   
   Replace `your_api_key_here` with your actual OpenAI API key.

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
- Coach names
- Positions/titles
- Email addresses (when available on directory page)
- Phone numbers (when available on directory page)
- Social media handles (when available on directory page)
- Source URL

The CSV file is saved in the project directory with a name like `duke_football_coaches.csv`.

### How It Works

1. **Discovery**: Finds official athletics staff directory pages using AI-powered web search
2. **Extraction**: Scrapes contact information from directory pages using GPT-4
3. **Normalization**: Cleans and standardizes all data
4. **CSV Export**: Outputs clean, organized data ready for outreach

**Expected runtime**: 30-60 seconds per school

---

## Project Structure
```
├── agents/
│   ├── discovery.py       # Finds staff directory pages
│   ├── extraction.py      # Extracts coach data from HTML
│   └── normalization.py   # Cleans and standardizes data
├── utils/
│   ├── web_scraper.py     # Playwright-based web scraping
│   └── csv_writer.py      # CSV file generation
├── main.py                # CLI entry point
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

---

## Troubleshooting

**"No coaches found"**: The school's athletics website structure may be unusual. Try different variations of the school name.

**Timeout errors**: Some athletics websites are slow. The scraper will retry automatically.

**Missing contact info**: Not all schools publish email/phone on their directory pages. The tool extracts whatever is publicly available.

---

## Future Development

- **AGT Module**: Automated email and social media outreach
- **Web Interface**: No-code UI for non-technical users
- **Database Storage**: Save and organize multiple schools
- **Advanced Filtering**: Filter by position, sport, conference

---

**SKOUT: Simple. Searchable. Action-Ready.**
