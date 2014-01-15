var page = require('webpage').create(),
    system = require('system'),
    address, output, size, done=false;

    address = system.args[1];
    output = system.args[2];



   page.viewportSize = { width: 600, height: 300 };
   page.clipRect = { top: 0, left: 0, width: 600, height: 300 };
    page.open(address, function (status) {
        if (status !== 'success') {
            phantom.exit();
        } else {
            window.setTimeout(function () {
               if (!done) {
                  page.render(output);
                  phantom.exit();
                  done = true;
                }
            }, 100);
        }
    });

   window.setTimeout(function () {
       if (!done) {
         page.render(output);
         phantom.exit();
         done = true;
         }
   }, 4000);
   //Force maximum time of 4 seconds

