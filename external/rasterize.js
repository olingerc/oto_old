var page = require('webpage').create(),
    system = require('system'),
    address, output, size;

    address = system.args[1];
    output = system.args[2];

   page.viewportSize = { width: 600, height: 300 };
   page.clipRect = { top: 0, left: 0, width: 600, height: 300 };
    page.open(address, function (status) {
        if (status !== 'success') {
            phantom.exit();
        } else {
            window.setTimeout(function () {
                page.render(output);
                phantom.exit();
            }, 100);
        }
    });

   window.setTimeout(function () {
       page.render(output);
       phantom.exit();
   }, 2500);
   //Force maximum time of 2.5 seconds

