/**
 * Copyright 2017 Théotime Loiseau
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
    var assets = {};
    var groups = {};
    var nbAssetsToLoad = 0;
    var nbAssetsLoaded = 0;
    var supportedEvents = ['loaded', 'error', 'complete'];
    var callbacks = {
        'loaded': [],
        'error': [],
        'complete': []
    };

    var createGroup = function(groupName) {
        groups[groupName] = {
            notifyOnLoad: [],
            loadedDependencies: [],
            members: []
        };
    };

    var createAsset = function(asset) {
        nbAssetsToLoad++;

        if (asset.type === 'js') {
            createScript(asset);
        } else if (asset.type === 'link') {
            createLink(asset);
        } else if (asset.type === 'img') {
            createImg(asset);
        } else if (asset.type === 'picture') {
            createPicture(asset);
        }
    }

    var prepareLoad = function(noDependencyAssets) {
        var requiredAssetId;
        var groupId;

        for (var asset in assets) {
            // Create props
            assets[asset].id = asset;
            assets[asset].notifyOnLoad = [];
            assets[asset].loadedDependencies = [];

            if (!assets[asset].requires) {
                // The script doesn't have dependencies
                noDependencyAssets.push(asset);
            } else {
                for (var require in assets[asset].requires) {
                    requiredAssetId = assets[asset].requires[require];
                    if (assets[requiredAssetId]) {
                        // It's a signe asset
                        assets[requiredAssetId].notifyOnLoad.push(asset);
                    } else if (groups[requiredAssetId]) {
                        // It's an existing group
                        groups[requiredAssetId].notifyOnLoad.push(asset);
                    } else {
                        // It's a new group
                        createGroup(requiredAssetId);
                        groups[requiredAssetId].notifyOnLoad.push(asset);
                    }
                }
            }

            // If the script belongs to a group add script to group's members
            if (assets[asset].groups) {
                for (var group in assets[asset].groups) {
                    groupId = assets[asset].groups[group];
                    if (!groups[groupId]) {
                        createGroup(groupId);
                    }
                    groups[groupId].members.push(asset);
                }
            }
        }
    };

    var onAssetLoad = function(asset) {
        var toNotifyId;
        var groupId;

        // Insert asset that requires it
        for (var toNotify in asset.notifyOnLoad) {
            toNotifyId = asset.notifyOnLoad[toNotify];
            assets[toNotifyId].loadedDependencies.push(asset.id);

            if (assets[toNotifyId].loadedDependencies.length === assets[toNotifyId].requires.length) {
                // All dependencies are loaded
                createAsset(assets[toNotifyId]);
            }

        }
        // Check groups
        if (asset.groups) {
            for (var group in asset.groups) {
                groupId = asset.groups[group];
                groups[groupId].loadedDependencies.push(asset.id);
                if (groups[groupId].loadedDependencies.length === groups[groupId].members.length) {
                    // It's the last asset of the group, create dependencies
                    onAssetLoad(groups[groupId]);
                }
            }
        }

        // It's not a group
        if (asset.id) {
            nbAssetsLoaded++;
            fireEvent('loaded', { asset: asset });
        }

        if (nbAssetsLoaded === nbAssetsToLoad) {
            // We loaded all the listed assets
            fireEvent('complete');
        }
    };

    var onAssetError = function(asset) {
        fireEvent('error', asset);
    };

    var createScript = function(asset) {
        var el = document.createElement('script');
        el.addEventListener('load', function() {
            onAssetLoad(asset);
        });
        el.addEventListener('error', function() {
            onAssetError(asset);
        });
        el.src = asset.source;

        document.body.appendChild(el);
    }

    var createLink = function(asset) {
        var el = document.createElement('link');
        el.addEventListener('load', function() {
            onAssetLoad(asset);
        });
        el.addEventListener('error', function() {
            onAssetError(asset);
        });
        el.href = asset.source;
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('type','text/css');

        if (asset.options) {
            for (option in asset.options) {
                el.setAttribute('option', asset.options[option]);
            }
        }

        document.head.appendChild(el);
    }

    var createImg = function(asset) {
        var el = document.createElement('img');
        el.addEventListener('load', function() {
            var imgs;
            var forEach = Array.prototype.forEach;
            onAssetLoad(asset);
            // Remove img tag
            el.parentNode.removeChild(el);
            // Set src attribute on imgs
            imgs = document.querySelectorAll('img[data-src="' + asset.source + '"]');
            forEach.call(imgs, function(img) {
                img.setAttribute('src', asset.source);
                img.removeAttribute('data-src');
            });
        });
        el.addEventListener('error', function() {
            onAssetError(asset);
        });
        el.src = asset.source;
        el.style.cssText = "display: none;";

        document.body.appendChild(el);
    }

    var onPictureLoad = function(asset, pictureEl) {
        var imgs;
        var forEach = Array.prototype.forEach;

        onAssetLoad(asset);
        // Replace img with picture elements
        imgs = document.querySelectorAll('img[data-picture="' + asset.source + '"]');
        forEach.call(imgs, function(img) {
            var newPictureEl = pictureEl.cloneNode(true);
            newPictureEl.removeChild(newPictureEl.querySelector('img'));
            img.insertAdjacentElement('afterend', newPictureEl);
            newPictureEl.appendChild(img);
            img.setAttribute('src', asset.source);
            if (asset.srcset) {
                img.setAttribute('srcset', asset.srcset);
            }
            img.removeAttribute('data-picture');
            newPictureEl.style.cssText = '';
        });
        // Remove picture tag
        pictureEl.parentNode.removeChild(pictureEl);
    };

    var createPicture = function(asset) {
        var pictureEl = document.createElement('picture');
        var imgEl = document.createElement('img');
        var imgElLoad = function() {
            imgEl.removeEventListener('load', imgElLoad);
            return onPictureLoad(asset, pictureEl);
        };
        var sourceEl;
        imgEl.addEventListener('load', imgElLoad);
        pictureEl.addEventListener('error', function() {
            onAssetError(asset);
        });

        pictureEl.style.cssText = "display: none;";
        if (asset.sources) {
            asset.sources.forEach(function(source) {
                sourceEl = document.createElement('source');
                sourceEl.srcset = source.srcset;
                if (source.type) {
                    sourceEl.type = source.type;
                }
                if (source.media) {
                    sourceEl.media = source.media;
                }
                if (source.sizes) {
                    sourceEl.sizes = source.sizes;
                }
                pictureEl.appendChild(sourceEl);
            });
        }
        imgEl.src = asset.source;
        if (asset.srcset) {
            imgEl.srcset = asset.srcset;
        }
        pictureEl.appendChild(imgEl);

        document.body.appendChild(pictureEl);
    }

    var loadAssets = function() {
        // Array with all the assets that don't have any dependencies (= can be loaded immediatly)
        var noDependencyAssets = [];
        prepareLoad(noDependencyAssets);
        for (var i = 0, l = noDependencyAssets.length; i < l; i++) {
            createAsset(assets[noDependencyAssets[i]]);
        }
    };

    var fireEvent = function(name, data) {
        if (!callbacks[name] || callbacks[name].length === 0) {
            return;
        }
        for (var i = 0, l = callbacks[name].length; i < l; i++) {
            callbacks[name][i](data);
        }
    };

    window.tymDependencyLoader = function(a) {
        // Deep clone
        assets = JSON.parse(JSON.stringify(a));

        loadAssets();
    };
    window.tymDependencyLoader.listen = function(event, cb) {
        if (supportedEvents.indexOf(event) >= 0) {
            callbacks[event].push(cb);
        } else {
            console.warn('Event ' + event + ' not supported by tymDependencyLoader');
        }
    };
})();