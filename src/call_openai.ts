import fetch from 'node-fetch';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

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
    model: 'gpt-o1',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 16000,
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

    // Explicitly type the response
    const data = (await response.json()) as OpenAIResponse;

    const completion = data.choices?.[0]?.message?.content || "No response from the model.";

    process.stdout.write(completion.replace(/\r?\n/g, ' ').trim());
} catch (error: any) {
    console.error('Error calling OpenAI:', error);
    process.exit(1);
  }
}

main();
