# Development Modes

This project now supports multiple development modes for testing and running the visibility report generator.

## Available Scripts

### `npm run dev` - Interactive Development Mode ⚡
**Fastest option for testing!**

This runs an interactive CLI that lets you:
1. Enter a business website URL directly
2. Choose between two extraction modes:
   - **Fast Mode (GPT)**: Uses GPT with web search to extract business info (faster)
   - **Browser Use Mode**: Uses Browser Use SDK for more accurate extraction (slower but more thorough)

The report is generated and saved to the `reports/` directory as HTML and text files.

**Usage:**
```bash
npm run dev
```

Then follow the prompts:
- Choose mode (1 for Fast, 2 for Browser Use)
- Enter the business URL (e.g., https://fits-app.com)
- Wait for the report to generate

**Output:**
- `reports/report-{business-name}-{timestamp}.html`
- `reports/report-{business-name}-{timestamp}.txt`
- `logs/debug-{business-name}-{timestamp}.json`
- `logs/debug-{business-name}-{timestamp}.txt`

---

### `npm run dev-agent` - Email Agent Mode 📧
**Full production flow with email handling**

Runs the complete email agent that:
1. Connects to AgentMail via WebSocket
2. Listens for incoming emails
3. Extracts URL from email body
4. Uses Browser Use to extract business info
5. Generates visibility report
6. Sends report back via email

**Usage:**
```bash
npm run dev-agent
```

---

### `npm run start` - Production Mode 🚀
Same as `dev-agent` but runs the compiled JavaScript from `dist/`

**Usage:**
```bash
npm run build
npm run start
```

---

## Comparison

| Feature | `npm run dev` | `npm run dev-agent` |
|---------|--------------|-------------------|
| Speed | ⚡ Fast | 🐌 Slower |
| Email handling | ❌ No | ✅ Yes |
| URL input | 🖊️ Manual | 📧 From email |
| Business extraction | Choice: GPT or Browser Use | Browser Use only |
| Report delivery | 💾 Saved to files | 📧 Sent via email |
| Best for | Quick testing & iteration | Full integration testing |

---

## Current Configuration

### Prompt Generation
- Currently set to generate **2 prompts** (for fast testing)
- Each prompt runs **4 times** to calculate mention probability
- Total: 8 web searches per report

### Web Search
- Forced to always use web search (not training data)
- Uses OpenAI's `gpt-4o` with `web_search` tool
- 1.5 second delay between runs to avoid rate limits

### Debug Logging
All modes save detailed debug logs to:
- `logs/debug-{business-name}-{timestamp}.json` - Full structured data
- `logs/debug-{business-name}-{timestamp}.txt` - Human-readable format

---

## Tips

1. **For fastest testing**: Use `npm run dev` with Fast Mode (option 1)
2. **For accurate extraction**: Use `npm run dev` with Browser Use Mode (option 2)
3. **For email testing**: Use `npm run dev-agent`
4. **To increase prompts**: Edit `src/services/openai.ts` line 19, change `2` to `7-10`
