export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { feature, input, image, feedback, previous_result, iteration, category, preset } = req.body

  if (!feature || !input) {
    return res.status(400).json({ error: 'feature and input required' })
  }

  try {
    const messages = [{ role: 'user', content: input }]

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages,
      }),
    })

    const data = await response.json()
    res.status(200).json({ success: true, result: data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
