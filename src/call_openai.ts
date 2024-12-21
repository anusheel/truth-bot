import fetch from "node-fetch"
import fs from "fs"
import { extractTextWithPdftotext } from "./extract_pdf.js"

interface OpenAIResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

async function main() {
  const apiKey = process.argv[2]
  const base64Prompt = process.argv[3]
  const pdfPath = process.argv[4]

  if (!apiKey) {
    console.error("Missing OpenAI API key")
    process.exit(1)
  }

  if (!base64Prompt) {
    console.error("Missing prompt")
    process.exit(1)
  }

  // Decode the base64-encoded prompt
  let prompt = Buffer.from(base64Prompt, "base64").toString("utf8")

  // Remove URLs from the prompt
  prompt = prompt.replace(/https?:\/\/\S+/g, "").trim()

  let pdfText = ""

  // Extract text if a valid PDF is provided
  if (pdfPath && pdfPath.trim() !== "" && fs.existsSync(pdfPath)) {
    try {
      pdfText = await extractTextWithPdftotext(pdfPath)
    } catch (error) {
      console.error("Error reading PDF:", error)
      process.exit(1)
    }
  } else {
    console.log("No valid PDF path provided. Skipping PDF content.")
  }

  // Combine the prompt with the extracted PDF content, if any
  const combinedPrompt = pdfText
    ? `${prompt}\n\n---\n\nExtracted Content:\n${pdfText}`
    : prompt

  const apiUrl = "https://api.openai.com/v1/chat/completions"
  const requestBody = {
    model: "o1-preview",
    messages: [{ role: "user", content: combinedPrompt }],
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `OpenAI API request failed: ${response.status} ${response.statusText}, Response: ${errorText}`
      )
    }

    const data = (await response.json()) as OpenAIResponse
    const completion =
      data.choices?.[0]?.message?.content || "No response from the model."

    // console.log("First API call response:");
    // console.log(completion);

    // Make the second API call to clean the response for GitHub

    const cleanRequestBody = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `I want to create a detailed GitHub comment with clean, readable Markdown formatting. The content should include:

- Headers (H1, H2, H3) using proper Markdown syntax (#, ##, ###).
- Bullet points and numbered lists for easy readability.
- **Math expressions** in standard LaTeX, with inline equations wrapped in single dollar signs (e.g., $E = mc^2$) and block equations in double dollar signs (e.g., $$a^2 + b^2 = c^2$$).
- Any bracket-style math notation (e.g., [ 7000 , \\text{ng/kg/day} ... ]) should be converted to proper LaTeX syntax.
- Tables, if needed, should be in Markdown format.
- Indented code blocks for example text or formulas that need to stand out.
- Return the final Markdown without any explanation or quotes at the start/end of output.

Here is the text to format:

${completion}

Ensure the final output is concise, uses proper Markdown, and that math expressions are clearly shown in LaTeX form. If anything is ambiguous, prioritize clarity in a professional tone.`,
        },
      ],
    }

    // Then execute the second API call as before:
    const cleanResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(cleanRequestBody),
    })

    if (!cleanResponse.ok) {
      const errorText = await cleanResponse.text()
      throw new Error(
        `OpenAI API request for cleaning failed: ${cleanResponse.status} ${cleanResponse.statusText}, Response: ${errorText}`
      )
    }

    const cleanData = (await cleanResponse.json()) as OpenAIResponse
    const cleanCompletion =
      cleanData.choices?.[0]?.message?.content || "No response from the model."

    // console.log("Cleaned and formatted response for GitHub:");
    process.stdout.write(Buffer.from(cleanCompletion).toString("base64"))
  } catch (error: any) {
    console.error(`Error during API calls:`, error)
    process.exit(1)
  }
}

main()
