import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { systemPrompt } from '../systemPrompt';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ──────────────────────────────────────────────────────────────
// URL + Social handle detection
// ──────────────────────────────────────────────────────────────

const URL_REGEX = /https?:\/\/[^\s)"']+/gi;
const HANDLE_REGEX = /(?:^|\s)@([a-zA-Z0-9._]{2,30})(?:\s|$|[.,!?])/g;
const BARE_DOMAIN_REGEX = /(?:^|\s)((?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}\.)+(?:com|co|net|org|io|ai|app|bh|ae|sa|qa|kw|om|xyz|tech|agency|studio|global)(?:\/[^\s]*)?)/gi;

interface FetchTarget {
  type: 'url' | 'instagram' | 'linkedin' | 'bare_domain';
  raw: string;
  fetchUrl: string;
}

function detectFetchTargets(text: string): FetchTarget[] {
  const targets: FetchTarget[] = [];
  const seen = new Set<string>();

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

  const handleMatches = Array.from(text.matchAll(HANDLE_REGEX));
  for (const m of handleMatches) {
    const handle = m[1];
    const url = `https://www.instagram.com/${handle}/`;
    if (seen.has(url)) continue;
    seen.add(url);
    targets.push({ type: 'instagram', raw: `@${handle}`, fetchUrl: url });
  }

  const domainMatches = Array.from((' ' + text).matchAll(BARE_DOMAIN_REGEX));
  for (const m of domainMatches) {
    const domain = m[1];
    const url = `https://${domain}`;
    if (seen.has(url) || seen.has(`https://www.${domain}`)) continue;
    seen.add(url);
    targets.push({ type: 'bare_domain', raw: domain, fetchUrl: url });
  }

  return targets;
}

async function fetchTargetContent(target: FetchTarget): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(target.fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArchitectBot/1.0; +https://sloelabs.com)',
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

    const truncated = cleaned.length > 5000 ? cleaned.substring(0, 5000) + '...[truncated]' : cleaned;
    if (truncated.length < 50) return null;
    return truncated;
  } catch (err) {
    console.error(`Fetch failed for ${target.fetchUrl}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function augmentMessagesWithFetches(messages: Array<{ role: string; content: string }>): Promise<Array<{ role: string; content: string }>> {
  const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
  if (lastUserIdx === -1) return messages;

  const lastUserMsg = messages[lastUserIdx];
  const targets = detectFetchTargets(lastUserMsg.content);
  if (targets.length === 0) return messages;

  const toFetch = targets.slice(0, 3);
  const fetchResults = await Promise.all(toFetch.map(async t => {
    const content = await fetchTargetContent(t);
    return { target: t, content };
  }));

  const usefulFetches = fetchResults.filter(r => r.content !== null);

  if (usefulFetches.length === 0) {
    const augmentedContent = `${lastUserMsg.content}\n\n[SYSTEM NOTE: A link or handle was detected in this message, but the content could not be retrieved. Gracefully pivot to asking the prospect to describe the business in their own words. Do not mention the fetch failure technically.]`;
    const augmented = [...messages];
    augmented[lastUserIdx] = { ...lastUserMsg, content: augmentedContent };
    return augmented;
  }

  let augmentedContent = lastUserMsg.content;
  for (const { target, content } of usefulFetches) {
    augmentedContent += `\n\n[FETCHED CONTENT FROM ${target.raw}]\n${content}\n[END FETCHED]`;
  }

  const augmented = [...messages];
  augmented[lastUserIdx] = { ...lastUserMsg, content: augmentedContent };
  return augmented;
}

// ──────────────────────────────────────────────────────────────
// Vercel handler
// ──────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, galleryContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const augmentedMessages = await augmentMessagesWithFetches(messages);

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
    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}

// Vercel function config — allow up to 30s for Gemini response + URL fetches
export const config = {
  maxDuration: 30,
};
