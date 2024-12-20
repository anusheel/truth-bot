import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
const execPromise = util.promisify(exec);

export async function extractTextWithPdftotext(pdfPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(pdfPath)) {
        return reject(new Error("PDF file does not exist"));
      }

      // Print file stats
      const stats = fs.statSync(pdfPath);
      console.log(`File Size: ${stats.size} bytes`);
      
      // Print first 100 bytes of the file for inspection
      const fileContents = fs.readFileSync(pdfPath).toString("utf8", 0, 100);
      console.log("First 100 bytes of file:");
      console.log(fileContents);

      // Validate the file type
      const fileTypeResult = await execPromise(`file --brief --mime-type "${pdfPath}"`);
      console.log(`File Type: ${fileTypeResult.stdout.trim()}`);

      if (!fileTypeResult.stdout.trim().startsWith("application/pdf")) {
        return reject(new Error("File is not a valid PDF"));
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
    } catch (error:any) {
      reject(new Error(`Error processing file: ${error.message}`));
    }
  });
}
