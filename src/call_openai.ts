import fetch from 'node-fetch';

async function main() {
  const apiKey = process.argv[2];
  const base64Prompt = process.argv[3];

  if (!apiKey) {
    console.error("Missing OpenAI API key");
    process.exit(1);
  }

  if (!base64Prompt) {
    console.error("Missing prompt");
    process.exit(1);
  }

  const prompt = Buffer.from(base64Prompt, 'base64').toString('utf8');

  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.7
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const completion = data.choices?.[0]?.message?.content || "No response from the model.";

    // Print only the completion so the workflow can capture it
    process.stdout.write(completion);
  } catch (error: any) {
    console.error('Error calling OpenAI:', error);
    process.exit(1);
  }
}

main();