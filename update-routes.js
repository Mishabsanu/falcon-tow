const fs = require('fs');
const path = require('path');
const modules = ['customers', 'tows', 'invoices', 'quotations', 'expenses', 'reports', 'salaries', 'vehicles', 'workers'];
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}
walkDir('./src/app/dashboard', function(filePath) {
  if(filePath.endsWith('.js') || filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    modules.forEach(mod => {
      content = content.replace(new RegExp(`href="/${mod}`, 'g'), `href="/dashboard/${mod}`);
      content = content.replace(new RegExp('href={`/' + mod, 'g'), 'href={`/dashboard/' + mod);
      content = content.replace(new RegExp(`push\\('/${mod}`, 'g'), `push('/dashboard/${mod}`);
      content = content.replace(new RegExp('push\\(`/' + mod, 'g'), 'push(`/dashboard/' + mod);
    });
    if(content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
