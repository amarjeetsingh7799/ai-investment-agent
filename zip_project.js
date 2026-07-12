const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, '..', 'AI_Investment_Agent_Submission.zip'));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Zip file created successfully.');
});

archive.on('error', function(err) { throw err; });

archive.pipe(output);

archive.glob('**/*', {
  cwd: __dirname,
  ignore: ['node_modules/**', 'client/node_modules/**', 'server/node_modules/**', '.git/**', '.gemini/**', 'tmp/**']
});

archive.finalize();
