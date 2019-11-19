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

            // Define your dependencies and start the loader
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
                var tdl = new window.TymDependencyLoader(scripts);
                tdl.load();
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
                var tdl = new window.TymDependencyLoader(scripts);
                tdl.load();
            }())
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
| type (required)   | One of the four types of content supported: `js`, `link`, `image`, `picture`                          |
| groups            | An array of strings representing the groups this resource is part of                        |
| requires          | An array of either keys and/or groups that the given resource needs before being downloaded |
| options           | *For link only* An array of objects to add additional attributes to the tag (like `title`). |
| srcset            | *For pictures only* - srcset attribute applied to the `<img>` tag to allow for responsive images |
| sources           | *For pictures only* - An array of objects describing each source for the `<picture>` tag. Supported properties are `srcset`, `type`, `media` and `sizes`. The order of the table is preserved and will reflect the order of the `<source>` tag. |

## Step 3: call the script
Once your dependencies object is correctly created, simple create a tymDependencyLoader instance and call the load function as shown bellow

    var tdl = new window.TymDependencyLoader(scripts);
    tdl.load();

# 2) Supported assets
Different kind of assets can be loaded with TymDependencyLoader.
## JS
With the `js` type, a `<script>` tag will be created at the bottom of the body.

## CSS
With the `css` type, a `<link>` tag will be created at the bottom of the head with the `rel`attribute set to `stylesheet` and `type` to `text/css`.

Additional attributes can be set on the `<link>` tag by using the `options` property in the dependency object. You can also use `options` if you want to change the `rel` or `type` of the link tag.

Example:

    var links = {
        style: {
            source: '/styles/style.css',
            type: 'link',
            groups: ['firstbatch'],
            options: {
                title: 'My styles'
            }
        },
        styleAlt: {
            source: '/styles/style-alt.css',
            type: 'link',
            groups: ['firstbatch'],
            options: {
                rel: 'alternate stylesheet'
            }
        }
    };

## &lt;img&gt;
The `img` type will preload some images by creating a `<img>` tag at the bottom of the body and removing it once it's loaded. This will store the images in the browser cache, making your image load almost instantaneously.
You can create img tag with a `data-src` attribute matching the `source` value so that the script will automatically set the `src` attribute of this image once it's available.

For example:

    <html>
        <head>[...]</head>
        <body>
            [...]
            <img class="myimg" data-src="myimg.jpeg">
            <script src="./libs/tymdependencyloader.js"/>
            <script>
            (function() {
                var dependencies = {
                    myImg: {
                        source: 'myimg.jpeg',
                        type: 'img'
                    }
                };
                var tdl = new window.TymDependencyLoader(scripts);
                tdl.load();
            }())
            </script>
        </body>
    </html>

Once the image is loaded, the `<img>` tag will be modified to include the right source:

    <img class="mypicture" src="mypicture.jpeg">

Note that only the `data-src` is changed into `src`, the other attributes aren't affected.

If you have multiple images with the same `data-src`, they will all be impacted.

## &lt;picture&gt;
TymDependencyLoader also handles the more modern `<picture>` tag. Similarly to the `img` type, it will create a `<picture>` tag at the bottom of the body, allowing the browser to fetch the right image based on the format it supports and the size of the window.
`source` should contain the URL to the `<img>` tag. `srcset` will also be used for the `<img>` tag.
`sources` is an array of object representing the different other `<source>` inside the `<picture>` tag.
Each source must have a `srcset` attribute, containing the different URLs and format of the picture it describes. It can also have a `type`, a `media` and a `sizes` property. These properties will be included in the `<source>` tag directly.
The order of the sources in this array is preserved and will be reflected in the order of the `<source>` inside the `<picture>` tag.

You can create `<img>` tags in your page with a `data-picture` attribute set to the `source` of the dependency so that the TymDependencyLoader will move the `<img>` tag in the picture tag with the appropriate `<source>` once the picture is loaded.

For example:

    <html>
        <head>[...]</head>
        <body>
            [...]
            <img class="mypicture" data-picture="mypicture.jpg">
            <script src="./libs/tymdependencyloader.js"/>
            <script>
            (function() {
                var dependencies = {
                    myPicture: {
                        source: 'mypicture.jpg',
                        srcset: 'mypicture.jpg 1x, mypicture2x.jpg 2x'
                        type: 'picture',
                        sources: [{
                            srcset: 'mypicture.webp 1x, mypicture2x.webp 2x',
                            type: 'image/webp'
                        }]
                    }
                };
                var tdl = new window.TymDependencyLoader(scripts);
                tdl.load();
            }())
            </script>
        </body>
    </html>

Once the right image will be loaded, the `<img>`tag will become:

    <picture>
        <source srcset="mypicture.webp 1x, mypicture2x.webp 2x" type="image/webp">
        <img class="mypicture" src="mypicture.jpg" srcset="mypicture.jpg 1x, mypicture2x.jpg 2x">
    </picture>

Note that we keep the original `<img>` tag, which means that all its attributes are kept (except for data-picture).

# 3) Event system

TymDependencyLoader has an event system allowing developers to act at precise moments of the loading process.

To listen to an event, do as follow:

    var tdl = new window.TymDependencyLoader(assets);
    tdl.listen('eventName', callback);
    
Callback is a function receiving one or no argument, depending on the event. It will be called when the event fires.

There are three events available: `loaded`, `error` and `complete`.

`loaded` is fired when once dependency has been loaded. The callback receives the resource definition in argument.

`error` is fired when once dependency failed to load. The callback receives the resource definition in argument.

`complete` is fired when all the resources have been loaded. The callback receives no argument.
