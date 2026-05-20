const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function callClaude(
  system: string,
  messages: Message[],
  maxTokens = 300,
  model = 'claude-haiku-4-5'
): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Claude error: ${data.error?.message}`)
  return data.content?.[0]?.text ?? ''
}
