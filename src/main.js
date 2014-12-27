var http = require('http'),
	host = '0.0.0.0',
	address, output, size, sizeRaw,
	scissors = require('scissors'),
	sizeOf = require('image-size'),
	exec = require('child_process').exec

http.createServer(function (req, res) {    

	// mergePdfs([
	// 	__dirname + '/test2.pdf',
	// 	__dirname + '/input.pdf',
	// 	__dirname + '/test10.pdf',
	// 	__dirname + '/test4.pdf'
	// ], res);
	
	
	// imageToPdf(res);

	// try {
	// 	imageToPdf(res);
	// } catch (e) {
	// 	res.writeHead(500, {'Content-Type': 'text/plain'});
	// 	res.end('fail\n');
	// }

}).listen(8080, host);

function imageToPdf(res) {
	var sourcePath = __dirname + '/test4.png',
		outputPath = __dirname + '/test4.pdf',
		size = sizeOf(sourcePath),
		xAxisLarger = size.width > size.height,
		scale = 1000,
		aspectRatio = xAxisLarger ? (size.width / size.height) : (size.height / size.width),
		errorPx = 5,
		width = (xAxisLarger ? scale : scale / aspectRatio) + errorPx,
		height = (xAxisLarger ? scale / aspectRatio : scale) + errorPx;

	// 1000*562.50
	exec(['phantomjs', __dirname + '/rasterize.js', sourcePath, outputPath, width +'px*' + height + 'px'].join(' '), function () {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('rendered\n');
	});
}

function mergePdfs(pdfList) {
	exec(['pdftk', pdfList.join(' '), 'cat', 'output', __dirname + '/done.pdf'].join(' '), function () {
		console.log(arguments);
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.end('pdf concats\n');
	});
}

console.log('Server running at http://' + host + ':8080/');