var page = require('webpage').create(),
    system = require('system'),
    address = system.args[1], 
    output = system.args[2], 
    size = system.args[3].split('*');

// page context size
page.viewportSize = {
    width: 600, 
    height: 600 
};

// pdf size
page.paperSize = {
    width: size[0], 
    height: size[1],
    margin: '0px' 
}

// begin render operation
page.open(address, function (status) {
    if (status !== 'success') {
        console.log('Unable to load the address!');
        phantom.exit(1);
    } else {
        window.setTimeout(function () {
            page.render(output);
            phantom.exit();
        }, 200);
    }
});