Tym Script Loader
========================

This JS Vanilla script is designed to load other JS scripts by handling dependencies. It lets you load an JS file only once one or a couple of other scripts are loaded.

1) How to use
----------------------------------

You can either include this script directly on your page or link it as a JS file.

### Include the script

This solution allows you to start loading your script faster as the code will be executed as soon as the page has been parsed by the browser. You won't have to wait for the JS file to load. The downside is that it won't be cached and your HTML page will be a bit heavier (a few Ko max).

TO DO: add code

### Link it as a JS File

This solution allows for a small HTML page but it will probably be a bit longer to get all your dependencies loaded as we need to wait for the browser to load this JS file before loading the others. On the bright size, the library will be cached, meaning that consequent loads will be faster.

TO DO: add code
