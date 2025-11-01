# GPT Visibility Report Agent

An AI-powered email agent that helps businesses understand their potential visibility in ChatGPT conversations. Business owners email the agent with information about their company, and receive back an automated report with customer prompt examples and visibility analysis.

## Features

- 📧 **Email-Based Interface**: Simple email submission via AgentMail
- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT models for intelligent analysis
- 📊 **Comprehensive Reports**: HTML and plain text reports with actionable insights
- ⚡ **Real-Time Processing**: WebSocket connection for instant notifications and processing
- 🎯 **Actionable Recommendations**: Specific steps to improve AI visibility
- 🔄 **Auto-Reconnect**: Automatic reconnection with exponential backoff

## How It Works

1. **Business owners send an email** with their company information to the agent's inbox
2. **AgentMail sends a real-time WebSocket notification** when a new message arrives
3. **The agent instantly receives and processes** the message labeled as "unreplied"
4. **AI analyzes the business** and generates:
   - 7-10 realistic customer prompts
   - Visibility assessment (High/Medium/Low)
   - Key factors, strengths, and opportunities
   - 3-5 prioritized recommendations
5. **Report is emailed back** in both HTML and plain text formats
6. **Labels are updated** to mark the message as "replied"

## Setup

### Prerequisites

- Node.js 18+ and npm
- AgentMail account and API key
- OpenAI API key

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd hackathon
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
AGENTMAIL_API_KEY=your_agentmail_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
INBOX_ID=reports@agentmail.to
OPENAI_MODEL=gpt-4o-mini
```

### Getting API Keys

#### AgentMail API Key
1. Sign up at [AgentMail](https://agentmail.to)
2. Create an inbox and note the inbox ID (e.g., `reports@agentmail.to`)
3. Generate an API key from your account settings

#### OpenAI API Key
1. Sign up at [OpenAI](https://platform.openai.com)
2. Generate an API key from the API keys section
3. Ensure you have credits/billing set up

## Usage

### Development Mode

Run with ts-node for development:
```bash
npm run dev
```

### Production Mode

Build and run the compiled JavaScript:
```bash
npm run build
npm start
```

### Sending a Request

Send an email to your configured inbox with the following format:

```
Subject: GPT Visibility Report Request

Business Name: Acme Coffee Roasters
Industry: Coffee roasting and retail
Products/Services: Specialty coffee beans, wholesale and retail, coffee brewing equipment
Target Customers: Coffee enthusiasts, cafes, restaurants
Location: Portland, Oregon
Website: www.acmecoffee.example.com

Additional context:
- Family-owned business since 2015
- Focus on sustainable, direct-trade beans
- Monthly subscription service available
```

**Required fields:**
- Business Name
- Industry

**Optional fields** (help create a better report):
- Products/Services
- Target Customers
- Location
- Website
- Additional Context

## Project Structure

```
hackathon/
├── src/
│   ├── services/
│   │   ├── agentmail.ts      # AgentMail API client
│   │   └── openai.ts          # OpenAI service for analysis
│   ├── utils/
│   │   ├── emailParser.ts     # Parse business info from emails
│   │   └── reportGenerator.ts # Generate HTML/text reports
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── agent.ts               # Main agent logic
│   ├── config.ts              # Configuration management
│   └── index.ts               # Entry point
├── dist/                      # Compiled JavaScript (generated)
├── .env                       # Environment variables (not in git)
├── .env.example               # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## Labels System

The agent uses AgentMail labels to track processing status:

- `unreplied`: New message that needs processing
- `replied`: Report has been sent
- `error`: Processing failed (invalid format or API error)

## Error Handling

If the agent cannot parse the business information from an email, it will:
1. Send a friendly error response with formatting instructions
2. Label the thread as both `replied` and `error`
3. Log the error for debugging

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENTMAIL_API_KEY` | Your AgentMail API key | Required |
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `INBOX_ID` | AgentMail inbox address | Required |
| `OPENAI_MODEL` | OpenAI model to use | gpt-4o-mini |

## Report Structure

The generated report includes:

### 1. Customer Prompt Examples
7-10 realistic prompts customers might use when asking ChatGPT, organized by category:
- Finding/discovering businesses
- Comparing options
- Specific needs
- Local recommendations
- Quality inquiries

### 2. Visibility Analysis
- Overall assessment (High/Medium/Low)
- Key factors affecting visibility
- Current strengths
- Opportunities for improvement

### 3. Recommendations
3-5 actionable recommendations prioritized by impact, specific to the business type and market.

## Development

### Build TypeScript
```bash
npm run build
```

### Watch Mode
```bash
npm run watch
```

## Future Enhancements

See [SPEC.md](./SPEC.md) for planned Phase 2 and Phase 3 features, including:
- Webhook support
- Actually testing prompts against ChatGPT API
- Competitor analysis
- Historical tracking
- Web interface
- Multi-language support

## Troubleshooting

### Agent not receiving emails
- Verify your `INBOX_ID` is correct
- Check that the AgentMail inbox is active
- Ensure the API key has proper permissions

### API errors
- Verify your OpenAI API key is valid and has credits
- Check your AgentMail API key permissions
- Review the console logs for specific error messages

### Parsing issues
- Ensure emails include at minimum: Business Name and Industry
- Use the format specified in the "Sending a Request" section
- The parser is flexible, but field names should be recognizable

## License

MIT

## Support

For issues or questions, please check the [specification document](./SPEC.md) or review the console logs for error details.
