Tym Dependency Loader
========================

This JS Vanilla script is designed to load dependencies by creating "batch" of files to load. It lets you load a JS/CSS/Image file only once one or a couple of other files are loaded.

# 1) How to use

## Step 1: include the script in your code

You can either include this script directly on your page or link it as a JS file.

### Include the script

This solution allows you to start loading your script faster as the code will be executed as soon as the page has been parsed by the browser. You won't have to wait for the library file to load. The downside is that it won't be cached and your HTML page will be a bit heavier (a few Ko max).


    <html>
        <head>[...]</head>
        <body>
            [...]
            <script>
            // Copy the minified tym dependency loader here
            (function() {
                // Tym loader: a smart loader to get your assets on time
                var scripts = {
                    jquery: {
                        source: '//code.jquery.com/jquery-1.11.0.min.js',
                        type: 'js',
                        groups: ['firstbatch']
                    },
                    tweenMax: {
                        source: '//cdnjs.cloudflare.com/ajax/libs/gsap/1.14.1/TweenMax.min.js',
                        type: 'js',
                        groups: ['firstbatch']
                    },
                    myCode: {
                        source: 'js/topAnimation.js',
                        type: 'js',
                        requires: ['firstbatch']
                    }
                };
                window.tymScriptLoader(scripts);
            }());
            </script>
        </body>
    </html>

### Link it as a JS File

This solution allows for a small HTML page but it will probably be a bit longer to get all your dependencies loaded as we need to wait for the browser to load this JS file before loading the others. On the bright size, the library will be cached, meaning that consequent loads will be faster.

    <html>
        <head>[...]</head>
        <body>
            [...]
            <script src="./libs/tymdependencyloader.js"/>
            <script>
            (function() {
                // Tym loader: a smart loader to get your assets on time
                var scripts = {
                    jquery: {
                        source: '//code.jquery.com/jquery-1.11.0.min.js',
                        type: 'js',
                        groups: ['firstbatch']
                    },
                    tweenMax: {
                        source: '//cdnjs.cloudflare.com/ajax/libs/gsap/1.14.1/TweenMax.min.js',
                        type: 'js',
                        groups: ['firstbatch']
                    },
                    myCode: {
                        source: 'js/topAnimation.js',
                        type: 'js',
                        requires: ['firstbatch']
                    }
                };
                window.tymDependencyLoader(scripts);
            </script>
        </body>
    </html>

## Step 2: define your dependencies object
The Tym Dependency Loader takes only one parameter: an object explaining the order of the files.

This object should look like this:

    var scripts = {
        jquery: {
            source: '//code.jquery.com/jquery-1.11.0.min.js',
            type: 'js',
            groups: ['firstbatch']
        },
        tweenMax: {
            source: '//cdnjs.cloudflare.com/ajax/libs/gsap/1.14.1/TweenMax.min.js',
            type: 'js',
            groups: ['firstbatch']
        },
        myCode: {
            source: 'js/topAnimation.js',
            type: 'js',
            requires: ['firstbatch']
        }
    };

The keys can be any string as long as they are unique.

The allowed properties are

| Property          |  Description                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------- |
| source (required) | The URL of the given resource (absolute or relative)                                        |
| type (required)   | One of the three types of content supported: `js`, `link`, `image`                          |
| groups            | An array of strings representing the groups this resource is part of                        |
| requires          | An array of either keys and/or groups that the given resource needs before being downloaded |

## Step 3: call the script
Once your dependencies object is correctly created, simple call the tymeDependencyLoader function as shown bellow

    window.tymDependencyLoader(scripts);


# 2) Event system

TymDependencyLoader has an event system allowing developers to act at precise moments of the loading process.

To listen to an event, do as follow:
    window.tymDependencyLoader.listen('eventName', callback);
Callback is a function receiving one or no argument, depending on the event. It will be called when the event fires.

There are three events available: `loaded`, `error` and `complete`.

`loaded` is fired when once dependency has been loaded. The callback receives the resource definition in argument.

`error` is fired when once dependency failed to load. The callback receives the resource definition in argument.

`complete` is fired when all the resources have been loaded. The callback receives no argument.