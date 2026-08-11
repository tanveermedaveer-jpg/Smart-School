const fs = require('fs');
const path = require('path');

function search(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      search(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('type="password"') || line.includes("type='password'") || (line.includes('password') && line.includes('type='))) {
          console.log(`${fullPath}:${i + 1}:${line.trim()}`);
        }
      }
    }
  }
}

search('src');
