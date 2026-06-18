const fs = require('fs');
const path = require('path');

const logPath = '/Users/wavesiddhartha/.gemini/antigravity/brain/46935955-67c7-428d-8a6a-9799e260727d/.system_generated/logs/transcript_full.jsonl';
const outputPath = '/Users/wavesiddhartha/Developer/echo/echo-implementation-guide.md';

function extract() {
  const fileContent = fs.readFileSync(logPath, 'utf8');
  const lines = fileContent.split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      // We look for the step index 1424, which we identified as containing the guide
      if (obj.step_index === 1424) {
        let text = obj.content;
        
        // Strip out user request tags
        text = text.replace('<USER_REQUEST>\n', '');
        text = text.replace('\n</USER_REQUEST>', '');
        text = text.replace('</USER_REQUEST>', '');
        
        const prefix = 'add all this with the new design"';
        if (text.startsWith(prefix)) {
          text = text.slice(prefix.length);
        }
        
        fs.writeFileSync(outputPath, text, 'utf8');
        console.log(`Successfully extracted guide to ${outputPath}`);
        return;
      }
    } catch (e) {
      // Ignore parsing errors on incomplete/other lines
    }
  }
  console.log('Failed to find step 1424 in log.');
}

extract();
