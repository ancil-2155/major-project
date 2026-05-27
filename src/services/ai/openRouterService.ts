export type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-chat-v3-0324:free';

export const askOpenRouter = async (
  apiKey: string,
  messages: OpenRouterMessage[],
  model = DEFAULT_OPENROUTER_MODEL,
) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://acams.local',
      'X-OpenRouter-Title': 'ACAMS Assistant',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    const message =
      json?.error?.message ||
      json?.message ||
      `OpenRouter request failed with status ${response.status}`;
    throw new Error(message);
  }

  const content = json?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  return content.trim();
};
