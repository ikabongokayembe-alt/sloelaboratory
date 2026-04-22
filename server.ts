import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { systemPrompt } from './systemPrompt';

const app = express();
app.use(express.json());

const PORT = 3000;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ──────────────────────────────────────────────────────────────
// URL + Social handle detection
// ──────────────────────────────────────────────────────────────

// Matches http(s) URLs
const URL_REGEX = /https?:\/\/[^\s)"']+/gi;

// Matches @handles that look like instagram/twitter/x handles
const HANDLE_REGEX = /(?:^|\s)@([a-zA-Z0-9._]{2,30})(?:\s|$|[.,!?])/g;

// Matches linkedin.com/in/... or linkedin.com/company/...
const LINKEDIN_REGEX = /(?:linkedin\.com\/(?:in|company)\/[a-zA-Z0-9\-_]+)/gi;

// Matches bare domains like sportnaa.com, impactestate.bh, etc. — with optional path
const BARE_DOMAIN_REGEX = /(?:^|\s)((?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}\.)+(?:com|co|net|org|io|ai|app|bh|ae|sa|qa|kw|om|xyz|tech|agency|studio|global)(?:\/[^\s]*)?)/gi;

interface FetchTarget {
  type: 'url' | 'instagram' | 'linkedin' | 'bare_domain';
  raw: string;
  fetchUrl: string;
}

function detectFetchTargets(text: string): FetchTarget[] {
  const targets: FetchTarget[] = [];
  const seen = new Set<string>();

  // Full URLs
  const urls = text.match(URL_REGEX) || [];
  for (const u of urls) {
    const cleaned = u.replace(/[.,!?]$/, '');
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);

    if (cleaned.includes('linkedin.com')) {
      targets.push({ type: 'linkedin', raw: cleaned, fetchUrl: cleaned });
    } else if (cleaned.includes('instagram.com')) {
      targets.push({ type: 'instagram', raw: cleaned, fetchUrl: cleaned });
    } else {
      targets.push({ type: 'url', raw: cleaned, fetchUrl: cleaned });
    }
  }

  // @handles (assume instagram as most common in GCC context)
  const handleMatches = Array.from(text.matchAll(HANDLE_REGEX));
  for (const m of handleMatches) {
    const handle = m[1];
    const url = `https://www.instagram.com/${handle}/`;
    if (seen.has(url)) continue;
    seen.add(url);
    targets.push({ type: 'instagram', raw: `@${handle}`, fetchUrl: url });
  }

  // Bare domains
  const domainMatches = Array.from(text.matchAll(BARE_DOMAIN_REGEX));
  for (const m of domainMatches) {
    const domain = m[1];
    const url = `https://${domain}`;
    if (seen.has(url) || seen.has(`https://www.${domain}`)) continue;
    seen.add(url);
    targets.push({ type: 'bare_domain', raw: domain, fetchUrl: url });
  }

  return targets;
}

// ──────────────────────────────────────────────────────────────
// Fetch content for a target — returns clean text or null
// ──────────────────────────────────────────────────────────────

async function fetchTargetContent(target: FetchTarget): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(target.fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NdayaBot/1.0; +https://sloelabs.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return null;
    }

    const html = await response.text();

    // Very basic text extraction: strip scripts, styles, and HTML tags
    const cleaned = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();

    // Cap to 5,000 characters — Ndaya doesn't need more to form a hypothesis
    const truncated = cleaned.length > 5000 ? cleaned.substring(0, 5000) + '...[truncated]' : cleaned;

    if (truncated.length < 50) return null; // Too little to be useful

    return truncated;
  } catch (err) {
    console.error(`Fetch failed for ${target.fetchUrl}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Augment prospect's latest message with fetched content
// ──────────────────────────────────────────────────────────────

async function augmentMessagesWithFetches(messages: Array<{ role: string; content: string }>): Promise<Array<{ role: string; content: string }>> {
  // Only look at the latest user message for fetch targets — avoids re-fetching on every turn
  const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
  if (lastUserIdx === -1) return messages;

  const lastUserMsg = messages[lastUserIdx];
  const targets = detectFetchTargets(lastUserMsg.content);
  if (targets.length === 0) return messages;

  // Limit to 3 fetches per turn to avoid runaway
  const toFetch = targets.slice(0, 3);
  const fetchResults = await Promise.all(toFetch.map(async t => {
    const content = await fetchTargetContent(t);
    return { target: t, content };
  }));

  const usefulFetches = fetchResults.filter(r => r.content !== null);

  if (usefulFetches.length === 0) {
    // Append a note so Ndaya knows fetching was attempted and failed
    const augmentedContent = `${lastUserMsg.content}\n\n[SYSTEM NOTE: A link or handle was detected in this message, but the content could not be retrieved. Gracefully pivot to asking the prospect to describe the business in their own words. Do not mention the fetch failure technically.]`;
    const augmented = [...messages];
    augmented[lastUserIdx] = { ...lastUserMsg, content: augmentedContent };
    return augmented;
  }

  // Build the augmented content
  let augmentedContent = lastUserMsg.content;
  for (const { target, content } of usefulFetches) {
    augmentedContent += `\n\n[FETCHED CONTENT FROM ${target.raw}]\n${content}\n[END FETCHED]`;
  }

  const augmented = [...messages];
  augmented[lastUserIdx] = { ...lastUserMsg, content: augmentedContent };
  return augmented;
}

// ──────────────────────────────────────────────────────────────
// API Route
// ──────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, galleryContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Augment the latest user message with fetched content if any URLs/handles present
    const augmentedMessages = await augmentMessagesWithFetches(messages);

    // If the prospect came from the Gallery, prepend the inherited context to
    // the first user message so the Architect knows where they came from.
    let finalMessages = augmentedMessages;
    if (galleryContext && finalMessages.length > 0) {
      const firstUserIdx = finalMessages.findIndex(m => m.role === 'user');
      if (firstUserIdx !== -1) {
        const contextBlock = `[GALLERY CONTEXT]
${Object.entries(galleryContext).map(([k, v]) =>
  `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
).join('\n')}
[END CONTEXT]

`;
        finalMessages = [...finalMessages];
        finalMessages[firstUserIdx] = {
          ...finalMessages[firstUserIdx],
          content: contextBlock + finalMessages[firstUserIdx].content,
        };
      }
    }

    const contents = finalMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    const text = response.text || '';
    res.json({ reply: text });

  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ndaya v3 server running on http://localhost:${PORT}`);
  });
}

startServer();
