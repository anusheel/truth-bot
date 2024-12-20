import fetch from 'node-fetch';
import fs from 'fs';
import PDFParser from 'pdf2json';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

async function extractTextFromPDF(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(pdfPath)) {
      return resolve("");
    }

    const pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      let extractedText = "";
      pdfData.formImage.Pages.forEach((page: any) => {
        page.Texts.forEach((textObj: any) => {
          const textChunk = textObj.R.map((r: any) => decodeURIComponent(r.T)).join("");
          extractedText += textChunk + " ";
        });
        extractedText += "\n";
      });
      resolve(extractedText.trim());
    });

    pdfParser.loadPDF(pdfPath);
  });
}

async function main() {
  const apiKey = process.argv[2];
  const base64Prompt = process.argv[3];
  const pdfPath = process.argv[4];

  if (!apiKey) {
    console.error("Missing OpenAI API key");
    process.exit(1);
  }

  if (!base64Prompt) {
    console.error("Missing prompt");
    process.exit(1);
  }

  // Decode the base64-encoded prompt
  const prompt = Buffer.from(base64Prompt, 'base64').toString('utf8');
  let pdfText = "";

  // Extract text if a valid PDF is provided
  if (pdfPath && pdfPath.trim() !== "" && fs.existsSync(pdfPath)) {
    try {
      pdfText = await extractTextFromPDF(pdfPath);
    } catch (error) {
      console.error("Error reading PDF:", error);
      process.exit(1);
    }
  } else {
    console.log("No valid PDF path provided. Skipping PDF content.");
  }

  // Combine the prompt with the extracted PDF content, if any
  const combinedPrompt = pdfText
    ? `${prompt}\n\n---\n\nExtracted PDF Content:\n${pdfText}`
    : prompt;

  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const requestBody = {
    model: 'gpt-4',
    messages: [{ role: 'user', content: combinedPrompt }],
    max_tokens: 16000,
    temperature: 0.7,
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const completion = data.choices?.[0]?.message?.content || "No response from the model.";
    process.stdout.write(completion.replace(/\r?\n/g, ' ').trim());
  } catch (error: any) {
    console.error("Error calling OpenAI:", error);
    process.exit(1);
  }
}

main();
