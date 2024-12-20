import { exec } from "child_process";
import fs from "fs";
import path from "path";

export async function extractTextWithPdftotext(pdfPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(pdfPath)) {
      return reject(new Error("PDF file does not exist"));
    }

    const outputTxtPath = `${path.basename(pdfPath, ".pdf")}.txt`;

    // Run the `pdftotext` command
    exec(`pdftotext "${pdfPath}" "${outputTxtPath}"`, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(`Error running pdftotext: ${stderr || error.message}`));
      }

      // Read the extracted text
      fs.readFile(outputTxtPath, "utf8", (err, data) => {
        if (err) {
          return reject(new Error(`Error reading output text file: ${err.message}`));
        }

        // Clean up the temporary text file
        fs.unlink(outputTxtPath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Warning: Unable to delete temp file: ${unlinkErr.message}`);
          }
        });

        resolve(data.trim());
      });
    });
  });
}
