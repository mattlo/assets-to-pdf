var sizeOf = require('image-size'),
	Q = require('q'),
	http = require('http'),
	exec = require('child_process').exec,
	fs = require('fs'),
    path = require('path'),
    Base62 = require('base62'),
    port = 8080;

// spawn server
http.createServer(function (req, res) {
	// enable socket keep-alive
	req.socket.setKeepAlive(true);

	// argument stream: /fetch/filename hash/file name to download as
	var pdfExp = /^\/fetch\/(.*)\/(.*)/;

	// resolve route
	if (req.url === '/create-pdf') {
		// request validation
		validateRequest(req)
			// parse body stream and convert to JSON
			.then(getJsonRequestBody)
			// prepare files and merge
			.then(responseHandler(req, res))
			// success handler
			.then(function (data) {
				outputResponse(res, 200, {
					url: 'http://' + req.headers.host + '/fetch/' + data.hash + '/' + encodeURIComponent(data.name)
				});
			})
			// fail handler
			.catch(function (e) {
				outputResponse(res, 500, {data: e.toString()});
			});
	} else if (pdfExp.test(req.url)) {
		// get path and stream out data
		pdfExists(req.url.match(pdfExp)[1])
			.then(function (path) {
				// get file stat
				var stat = fs.statSync(path);

				// headers
				res.writeHead(200, {
					'Content-Type': 'application/pdf',
					'Content-Length': stat.size,
					// force download the file
					'Content-Disposition': 'attachment; filename="' + (req.url.match(pdfExp)[2]) + '.pdf"'
				});

				// stream out file
				fs.createReadStream(path).pipe(res);
			})
			.catch(function (e) {
				outputResponse(res, 500, {data: e.toString()});
			});
	} else {
		outputResponse(res, 404, {data: 'page does not exist'});
	}
}).listen(port, '0.0.0.0');

/**
 * Validates PDF
 * @todo  probably overkill to use a defer for this, but I may need to do additional checks
 *        in the future if files are off loaded to external server
 * @param  {String} fileName
 * @return {Object} promise
 */
function pdfExists(fileName) {
	var deferred = Q.defer(),
		// construct path
		filePath = path.join(__dirname, 'output', fileName + '.pdf');

	try {
		// check if file exists
		if (!fs.existsSync(filePath)) {
			throw new Error('PDF does not exist');
		}	

		deferred.resolve(filePath);
	} catch (e) {
		deferred.reject(e);
	}

	return deferred.promise;
}

/**
 * Outputs HTTP response
 * @param  {Object} res    
 * @param  {Number} status 
 * @param  {Object} data   
 * @return {undefined}        
 */
function outputResponse(res, status, data) {
	res.writeHead(status, {
		'Content-Type': 'application/json'
	});

	// resolve to provided response, if non provide generic
	res.end(JSON.stringify(data || {'data': 'OK'}));
}

/**
 * Validates Request
 * @param  {Object} req 
 * @return {Object}
 */
function validateRequest(req) {
	var deferred = Q.defer();

	try {
		// post check
		if (req.method !== 'POST') {
			throw new Error('HTTP method must be a POST');
		}

		deferred.resolve(req);
	} catch (e) {
		deferred.reject(e);
	}

	return deferred.promise;
}

/**
 * Parses raw body stream into JSON
 * @param  {Object} req
 * @return {Function}
 */
function getJsonRequestBody(req) {
	var deferred = Q.defer();

	var responseBody = '';

	req.on('data', function (data) {
		responseBody += data;
	});

	req.on('end', function () {
		deferred.resolve(JSON.parse(responseBody));
	});

	return deferred.promise;
}

/**
 * Handles executing PDF actions
 * @param  {Object} req 
 * @param  {Object} res 
 * @return {Function}     
 */
function responseHandler(req, res) {
	return function (data) {
		return prepareFiles(data.inputFiles)
			.then(mergePdfs)
			.then(function (hash) {
				return {
					"name": data.uniquePkgName,
					"hash": hash
				}
			});
	};
}

/**
 * Execute PhantomJS to PDF service
 * Arguments are forwarded onto execution args
 * 
 * @return {Object} promise
 */
function phantom() {
	var deferred = Q.defer();

	exec(['phantomjs', __dirname + '/rasterize.js'].concat([].slice.call(arguments)).join(' '), function (err) {
		// error handler
		if (err) {
			console.log('endpoint failed to translate to PDF');
			deferred.reject(err);
		}

		deferred.resolve(arguments[0]); // return output path
	});

	return deferred.promise;
}

/**
 * Translates all files to individual PDFs then moves them to `tmp`
 * @todo  abstract out PDFer and let this resolve moving files
 * @param  {Array} files 
 * @return {Object} promise
 */
function prepareFiles(files) {
	console.log('...preparing files for normalization', files);

	function basename(file) {
		return file.substr(0, file.lastIndexOf('.'));
	}

	function isPdf(file) {
		return file.substr(-4) === '.pdf';
	}

	function isHttpProtocol(file) {
		return file.substr(0, 7) === 'http://' || file.substr(0, 8) === 'https://';
	}

    function fileProcess(file) {
        var deferred = Q.defer();

        function resolve(inputPath) {
            deferred.resolve(inputPath);
        }

        // PDF a website
        if (isHttpProtocol(file)) {
            var ouputFilename = guidGenerator() + '.pdf';

            phantom(file, ouputFilename, '2000px*3000px').then(function () {
                resolve(ouputFilename);
            });

            // if its a PDF, skip it
            // we are assuming all input files are JPG or PNG
        } else if (!isPdf(file)) {
            // configurations
            var sourcePath = __dirname + '/input/' + file,
                outputBase = __dirname + '/tmp/' + basename(file),
                size = sizeOf(sourcePath),
                xAxisLarger = size.width > size.height,
                scale = 2000,
                aspectRatio = xAxisLarger ? (size.width / size.height) : (size.height / size.width),
                errorPx = 5,
                width = (xAxisLarger ? scale : scale / aspectRatio) + errorPx,
                height = (xAxisLarger ? scale / aspectRatio : scale) + errorPx;

            // validate path
            if (!fs.existsSync(sourcePath)) {
                deferred.reject(sourcePath + ' does not exist!');

                // break loop
                return false;
            }

            // create PDF
            phantom(sourcePath, outputBase + '.pdf', width +'px*' + height + 'px').then(function () {
                exec(['pdftk', outputBase + '.pdf', 'cat', '1-1', 'output', outputBase + 'x.pdf'].join (' '), function (err) {
                    // ignore errors for this one, pdftk will fail if there isn't 2 pages
                    if (err) {
                        resolve(outputBase + '.pdf');
                    } else {
                        resolve(outputBase + 'x.pdf');
                        fs.unlinkSync(outputBase + '.pdf');
                    }
                });
            });
        } else {
            // copy it to tmp directory
            fs.createReadStream(__dirname + '/input/' + file)
                .pipe(fs.createWriteStream(__dirname + '/tmp/' + file));

            resolve(__dirname + '/tmp/' + file);
        }

        return deferred.promise;
    }


    return (function (processes) {
        return processes.reduce(Q.when, Q([]));
    }(files.map(function (file) {
        return function (list) {
            var d = Q.defer();

            fileProcess(file).then(function (path) {
                list.push(path);

                d.resolve(list);

                console.log('processed file ' + path + ' on ', new Date);
            }).catch(function () {
                d.reject('file failed');
            });

            return d.promise;
        };
    })));
}

/**
 * Merges PDFs into a single PDF from given list
 * @param  {Array} pdfList 
 * @return {Object}  promise
 */
function mergePdfs(pdfList) {
	var deferred = Q.defer(),
		fileName = Base62.encode((new Date).getTime()),
		outputFile = __dirname + '/output/' + fileName + '.pdf';

	console.log('preparing to merge PDFs')

	pdfList.forEach(function (sourcePath) {
		if (!fs.existsSync(sourcePath)) {
			console.log('...  ' + sourcePath + ' does not existxxx!');
		} else {
			console.log('...  ' + sourcePath + ' exists!');
		}
	});

	// merge PDFs
	exec(['pdftk', pdfList.join(' '), 'cat', 'output', outputFile].join(' '), function (err) {
		if (err) {
			console.log('');
			console.log(err);
			deferred.reject(err);
		} else {
			// removes files in tmp
			pdfList.forEach(function (file) {
                try {
				    fs.unlinkSync(file);
                } catch (e) {
                    console.log('could not unlink ' + file);
                }
			});

			console.log('...PDFs merged: ' + outputFile);

			// return hash
			deferred.resolve(fileName);
		}
	});

	return deferred.promise;
}

function guidGenerator() {
    var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}