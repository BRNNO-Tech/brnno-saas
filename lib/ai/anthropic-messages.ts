const MAX_MESSAGES = 24
const MAX_CONTENT_LEN = 4000

/** Anthropic requires the first message in messages[] to be from the user. */
export function toAnthropicMessages(
  raw: Array<{ role: string; content: string }>
): { role: 'user' | 'assistant'; content: string }[] {
  const cleaned = raw
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.slice(0, MAX_CONTENT_LEN),
    }))

  let start = 0
  while (start < cleaned.length && cleaned[start].role !== 'user') {
    start++
  }
  const sliced = cleaned.slice(start)
  const merged: { role: 'user' | 'assistant'; content: string }[] = []
  for (const m of sliced) {
    const last = merged[merged.length - 1]
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`.slice(0, MAX_CONTENT_LEN * 2)
    } else {
      merged.push({ ...m })
    }
  }
  return merged
}

export function sliceMessages<T>(raw: T[], max = MAX_MESSAGES): T[] {
  return raw.slice(-max)
}
