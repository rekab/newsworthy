# Newsworthy

A news anxiety dashboard. Scrapes headlines, runs them through GPT, and scores
each category by the probability that a psychologist will have clients in tears
about it in their next session. Categories scoring above 40% are shown
prominently; lower-scoring ones are collapsed and can be expanded.

## How it works

1. **Headline scraping** — `fetch.py` pulls headlines from [68k.news](http://68k.news/) using `curl` and parses them with BeautifulSoup.
2. **Scoring** — The headlines are sent to GPT (currently `gpt-5.2`) with a prompt that asks it to score each news category (POLITICAL, GLOBAL, WAR / CONFLICT, ECONOMY, etc.) by the probability of causing client tears tomorrow, and to describe *why* people will be stressed about it.
3. **JSON output** — GPT returns a JSON blob with a `[score, description]` pair per category, plus an OVERALL score. This is written to `news.json`.
4. **Refresh logic** — `news.json` is considered stale after 5 minutes. A background process watches a FIFO; when the HTTP server detects a stale file, it signals the FIFO, and the background worker fetches fresh headlines and regenerates the JSON. The file is swapped atomically via rename.
5. **HTTP server** — A simple Python `http.server` serves `index.html`, `style.css`, `script.js`, and `/news.json` on port 8000.
6. **Frontend** — `script.js` fetches `/news.json` and renders:
   - A full-width summary banner at the top with the OVERALL score, a vibe label ("cancel your lunch break", "quiet day in the waiting room", etc.), the OVERALL description, and a clean underwear advisory scaled to severity.
   - Category tiles for anything scoring above 40%, colored green→red by score.
   - Collapsed `<details>` rows for lower-scoring categories, expandable on click.
   - The page auto-reloads every 2 minutes while the tab is focused.

## Setup

**Requirements:** Python 3.9+, an OpenAI API key.

```bash
git clone <repo>
cd newsworthy

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set API_KEY=your_openai_api_key
```

## Running locally

```bash
source venv/bin/activate
python fetch.py
```

Open [http://localhost:8000](http://localhost:8000).

On first run, `news.json` won't exist yet. The server will return an empty
dashboard until the background worker finishes its first GPT request (usually
10–30 seconds).

## Deploying to a VPS

A `deploy.sh` script sets up a systemd service and starts it:

```bash
# On the VPS, as a non-root user with sudo access:
./deploy.sh
```

The script will:
- Create a virtualenv and install dependencies
- Bootstrap an empty `news.json` so the app doesn't crash on first request
- Write and enable a systemd service that runs `fetch.py` and restarts on failure

The dashboard will be available at `http://<server-ip>:8000`.

Useful commands after deploying:

```bash
sudo journalctl -u newsworthy -f      # live logs
sudo systemctl restart newsworthy     # restart
sudo systemctl stop newsworthy        # stop
```

## Files

| File | Purpose |
|---|---|
| `fetch.py` | Scraping, GPT scoring, HTTP server, refresh logic |
| `index.html` | Page shell; triggers auto-reload every 2 minutes |
| `script.js` | Fetches `/news.json`, renders summary banner and tiles |
| `style.css` | Mobile-friendly layout, tile and banner styles |
| `deploy.sh` | Systemd deploy script for Linux VPS |
| `.env.example` | Environment variable template |
| `requirements.txt` | Python dependencies |
