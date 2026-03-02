const http = require('http');
http.get('http://localhost:3000/health', function (r) {
    var d = '';
    r.on('data', function (c) { d += c; });
    r.on('end', function () { console.log('STATUS:', r.statusCode); console.log('BODY:', d); });
}).on('error', function (e) { console.log('ERROR:', e.message); });
