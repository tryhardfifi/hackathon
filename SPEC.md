# GPT Visibility Report Agent - Project Specification

## Overview

An AI-powered email agent that helps businesses understand their potential visibility in ChatGPT conversations. Business owners email the agent with information about their company, and receive back an automated report with customer prompt examples and visibility analysis.

## Problem Statement

Businesses want to understand:
- What prompts potential customers might use when asking ChatGPT for recommendations
- How likely their business is to be mentioned in AI-generated responses
- How to improve their visibility in AI assistant conversations

## Solution

An automated email agent that:
1. Receives business information via email
2. Uses AI to generate realistic customer prompts
3. Analyzes potential visibility in ChatGPT responses
4. Sends back a formatted HTML report with insights and recommendations

## Technical Stack
let
- **Language**: TypeScript/Node.js
- **Email Service**: AgentMail API
- **AI Service**: OpenAI API (GPT-4 or GPT-3.5-turbo)
- **Deployment**: TBD (local development initially)

## System Architecture

```
┌─────────────────┐
│  Business Owner │
│  sends email    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  AgentMail      │
│  Inbox          │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Agent Polling  │
│  (Check for     │
│   unreplied)    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Parse Email    │
│  Extract Info   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  OpenAI API     │
│  - Generate     │
│    prompts      │
│  - Analyze      │
│    visibility   │
│  - Create       │
│    recommendations│
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Format Report  │
│  (HTML + Text)  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Reply via      │
│  AgentMail      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Update Labels  │
│  unreplied →    │
│  replied        │
└─────────────────┘
```

## Core Workflow

### 1. Email Reception
- Agent inbox receives email at configured address (e.g., `reports@agentmail.to`)
- Email is automatically labeled as `unreplied`

### 2. Email Processing (Polling Loop)
- Agent polls for threads with `unreplied` label
- Retrieves thread details and last message
- Extracts business information from email body

### 3. AI Analysis
Using OpenAI API, the agent:
1. **Generates Customer Prompts** (5-10 examples)
   - Realistic questions customers might ask ChatGPT
   - Varied scenarios (comparisons, recommendations, specific needs)

2. **Analyzes Visibility**
   - Assesses likelihood of business being mentioned
   - Identifies factors affecting visibility (size, reputation, niche, location)

3. **Creates Recommendations**
   - Actionable steps to improve AI visibility
   - Content strategy suggestions
   - SEO and online presence tips

### 4. Report Generation
- Format findings into HTML and plain text versions
- Include clear sections with visual hierarchy
- Professional, actionable presentation

### 5. Email Reply
- Send report back to original sender
- Update message labels: remove `unreplied`, add `replied`

## Expected Email Input Format

Business owners should send emails with the following information (flexible format):

```
Subject: GPT Visibility Report Request

Business Name: Acme Coffee Roasters
Industry: Coffee roasting and retail
Products/Services: Specialty coffee beans, wholesale and retail,
                   coffee brewing equipment
Target Customers: Coffee enthusiasts, cafes, restaurants
Location: Portland, Oregon
Website: www.acmecoffee.example.com

Additional context:
- Family-owned business since 2015
- Focus on sustainable, direct-trade beans
- Monthly subscription service available
```

## Report Structure

### HTML Report Template

**Header:**
- Report title
- Business name
- Generation date

**Section 1: Customer Prompt Examples**
- 5-10 example prompts customers might use
- Organized by category (e.g., "Finding a roaster", "Comparing options", "Specific needs")

**Section 2: Visibility Analysis**
- Overall assessment (High/Medium/Low visibility)
- Key factors affecting visibility
- Current strengths
- Gaps and opportunities

**Section 3: Recommendations**
- Top 3-5 actionable recommendations
- Prioritized by impact
- Specific to their business type and market

**Footer:**
- Disclaimer about AI-generated content
- Contact/feedback information

### Plain Text Version
- Same content, simplified formatting
- Clear section headers with line breaks
- Bullet points and numbered lists

## Implementation Details

### Labels System
- `unreplied`: New message needs processing
- `processing`: Agent is working on it (optional, for debugging)
- `replied`: Report sent
- `error`: Processing failed (for error tracking)

### Error Handling
- Invalid email format → Send friendly error response
- API failures → Retry logic + error notification
- Parsing issues → Request clarification from sender

### Rate Limiting
- Track emails per sender
- Optional: Limit to 1 report per email/day (future enhancement)

### Processing Time
- Expected: 30-60 seconds per report
- Update labels immediately when starting processing
- Consider timeout handling for long-running requests

## Configuration

### Environment Variables
```
AGENTMAIL_API_KEY=xxx
OPENAI_API_KEY=xxx
INBOX_ID=reports@agentmail.to
POLLING_INTERVAL_MS=60000
OPENAI_MODEL=gpt-4o-mini
```

## Future Enhancements

### Phase 2 Ideas
- Webhook support instead of polling
- Actually test prompts against ChatGPT API
- Competitor comparison analysis
- Track changes over time (monthly reports)
- Dashboard with historical reports
- Support for multiple languages
- Industry-specific prompt templates

### Phase 3 Ideas
- Integration with other AI platforms (Claude, Gemini, Perplexity)
- Web interface for submitting requests
- PDF report generation
- Analytics on prompt effectiveness
- A/B testing different business descriptions

## Success Metrics

- Report generation time < 60 seconds
- Email deliverability > 95%
- Report quality (manual review initially)
- User satisfaction (optional feedback mechanism)

## Development Phases

### Phase 1: MVP (Current)
- Basic polling mechanism
- Simple email parsing
- OpenAI prompt generation
- Basic HTML report
- Reply functionality

### Phase 2: Production Ready
- Webhook integration
- Robust error handling
- Rate limiting
- Logging and monitoring
- Better email templates

### Phase 3: Enhanced Features
- Advanced analysis
- Competitor tracking
- Historical data
- Web interface

## Notes

- Start with polling for simplicity
- Focus on report quality over speed initially
- Keep email parsing flexible (people write emails differently)
- Ensure both HTML and text versions are readable
- Test with various business types and sizes
