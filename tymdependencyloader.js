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
    var supportedEvents = ['loaded', 'error', 'complete'];

    var createGroup = function(groupName) {
        this.groups[groupName] = {
            id: groupName,
            type: 'group',
            notifyOnLoad: [],
            loadedDependencies: [],
            members: []
        };
    };

    var createAsset = function(asset) {
        this.nbAssetsToLoad++;

        if (asset.type === 'js') {
            createScript.call(this, asset);
        } else if (asset.type === 'link') {
            createLink.call(this, asset);
        } else if (asset.type === 'img') {
            createImg.call(this, asset);
        } else if (asset.type === 'picture') {
            createPicture.call(this, asset);
        }
    }

    var prepareLoad = function(noDependencyAssets) {
        var requiredAssetId;
        var groupId;

        for (var asset in this.assets) {
            // Create props
            this.assets[asset].id = asset;
            this.assets[asset].notifyOnLoad = [];
            this.assets[asset].loadedDependencies = [];

            if (!this.assets[asset].requires) {
                // The script doesn't have dependencies
                noDependencyAssets.push(asset);
            } else {
                for (var require in this.assets[asset].requires) {
                    requiredAssetId = this.assets[asset].requires[require];
                    if (this.assets[requiredAssetId]) {
                        // It's a single asset
                        this.assets[requiredAssetId].notifyOnLoad.push(asset);
                    } else if (this.groups[requiredAssetId]) {
                        // It's an existing group
                        this.groups[requiredAssetId].notifyOnLoad.push(asset);
                    } else {
                        // It's a new group
                        createGroup.call(this, requiredAssetId);
                        this.groups[requiredAssetId].notifyOnLoad.push(asset);
                    }
                }
            }

            // If the script belongs to a group add script to group's members
            if (this.assets[asset].groups) {
                for (var group in this.assets[asset].groups) {
                    groupId = this.assets[asset].groups[group];
                    if (!this.groups[groupId]) {
                        createGroup.call(this, groupId);
                    }
                    this.groups[groupId].members.push(asset);
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
            this.assets[toNotifyId].loadedDependencies.push(asset.id);

            if (this.assets[toNotifyId].loadedDependencies.length === this.assets[toNotifyId].requires.length) {
                // All dependencies are loaded
                createAsset.call(this, this.assets[toNotifyId]);
            }

        }
        // Check groups
        if (asset.groups) {
            for (var group in asset.groups) {
                groupId = asset.groups[group];
                this.groups[groupId].loadedDependencies.push(asset.id);
                if (this.groups[groupId].loadedDependencies.length === this.groups[groupId].members.length) {
                    // It's the last asset of the group, create dependencies
                    onAssetLoad.call(this, this.groups[groupId]);
                }
            }
        }

        // It's not a group
        if (asset.id) {
            this.nbAssetsLoaded++;
        }
        fireEvent.call(this, 'loaded', asset);

        if (this.nbAssetsLoaded === this.nbAssetsToLoad) {
            // We loaded all the listed assets
            fireEvent.call(this, 'complete');
        }
    };

    var onAssetError = function(asset) {
        fireEvent.call(this, 'error', asset);
    };

    var createScript = function(asset) {
        var self = this;
        var el = document.createElement('script');
        el.addEventListener('load', function() {
            onAssetLoad.call(self, asset);
        });
        el.addEventListener('error', function() {
            onAssetError.call(self, asset);
        });
        el.src = asset.source;

        document.body.appendChild(el);
    }

    var createLink = function(asset) {
        var self = this;
        var el = document.createElement('link');
        el.addEventListener('load', function() {
            onAssetLoad.call(self, asset);
        });
        el.addEventListener('error', function() {
            onAssetError.call(self, asset);
        });
        el.href = asset.source;
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('type','text/css');

        if (asset.options) {
            for (option in asset.options) {
                el.setAttribute(option, asset.options[option]);
            }
        }

        document.head.appendChild(el);
    }

    var createImg = function(asset) {
        var self = this;
        var el = document.createElement('img');
        el.addEventListener('load', function() {
            var imgs;
            var forEach = Array.prototype.forEach;
            // Remove img tag
            el.parentNode.removeChild(el);
            // Set src attribute on imgs
            imgs = document.querySelectorAll('img[data-src="' + asset.source + '"]');
            forEach.call(imgs, function(img) {
                img.setAttribute('src', asset.source);
                img.removeAttribute('data-src');
            });
            onAssetLoad.call(self, asset);
        });
        el.addEventListener('error', function() {
            onAssetError.call(self, asset);
        });
        el.src = asset.source;
        el.style.cssText = "display: none;";

        document.body.appendChild(el);
    }

    var onPictureLoad = function(asset, pictureEl) {
        var imgs;
        var forEach = Array.prototype.forEach;

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
        onAssetLoad.call(this, asset);
    };

    var createPicture = function(asset) {
        var self = this;
        var pictureEl = document.createElement('picture');
        var imgEl = document.createElement('img');
        var imgElLoad = function() {
            imgEl.removeEventListener('load', imgElLoad);
            return onPictureLoad.call(self, asset, pictureEl);
        };
        var sourceEl;
        imgEl.addEventListener('load', imgElLoad);
        pictureEl.addEventListener('error', function() {
            onAssetError.call(self, asset);
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
        prepareLoad.call(this, noDependencyAssets);

        if (noDependencyAssets.length === 0) {
            console.warn('tymdependencyloader - All you assets have at least one "requires". At least one asset have to be loaded without dependency.');
            return;
        }

        for (var i = 0, l = noDependencyAssets.length; i < l; i++) {
            createAsset.call(this, this.assets[noDependencyAssets[i]]);
        }
    };

    var fireEvent = function(name, data) {
        if (!this.callbacks[name] || this.callbacks[name].length === 0) {
            return;
        }
        for (var i = 0, l = this.callbacks[name].length; i < l; i++) {
            this.callbacks[name][i](data);
        }
    };

    var TymDependencyLoader = function(a) {
        this.assets = {};
        this.groups = {};
        this.nbAssetsToLoad = 0;
        this.nbAssetsLoaded = 0;
        this.callbacks = {
            'loaded': [],
            'error': [],
            'complete': []
        };

        // Deep clone
        this.assets = JSON.parse(JSON.stringify(a));

        return this;
    };

    TymDependencyLoader.prototype.listen = function(event, cb) {
        if (supportedEvents.indexOf(event) >= 0) {
            this.callbacks[event].push(cb);
        } else {
            console.warn('Event ' + event + ' not supported by tymDependencyLoader');
        }
    };

    TymDependencyLoader.prototype.load = function() {
        loadAssets.call(this);
    };

    window.TymDependencyLoader = TymDependencyLoader;
})();