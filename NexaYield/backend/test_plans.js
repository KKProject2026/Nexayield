const http = require('http');
http.get('http://localhost:5000/api/plans', res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log(body));
});
