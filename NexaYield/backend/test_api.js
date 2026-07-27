const fetch = require('node-fetch'); // or just use http

const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/withdrawals',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + process.argv[2]
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});
req.on('error', e => console.error(e));
req.end();
