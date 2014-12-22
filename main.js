var http = require('http'),
	host = '0.0.0.0';

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('This is to test host > vagrant > docker > node TCP stack for PLW devs');
}).listen(8080, host);

console.log('Server running at http://' + host + ':8080/');