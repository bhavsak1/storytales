const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/cloud-metadata') {
    console.log('SSRF Hit from:', req.socket.remoteAddress);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('cloud metadata response');
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(4000, () => {
  console.log('Mock metadata server running on 4000');
  
  const payload = {
    childName: 'Test',
    age: '5',
    interests: 'dogs',
    mode: 'abc',
    photoUrl: 'http://localhost:4000/cloud-metadata'
  };

  fetch('http://localhost:3000/api/generate-colorbook-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(data => {
    console.log('Response from API:', data.error ? data.error : 'Success (Check server logs for SSRF hit)');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
});
