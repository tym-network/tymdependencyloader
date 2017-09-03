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
    var scripts = {};
    var groups = {};

    var createGroup = function(groupName) {
        groups[groupName] = {
            notifyOnLoad: [],
            loadedDependencies: [],
            members: []
        };
    };

    var prepareLoad = function(noDependencyScripts) {
        var requiredScriptId;
        var groupId;

        for (var script in scripts) {
            // Create props
            scripts[script].id = script;
            scripts[script].notifyOnLoad = [];
            scripts[script].loadedDependencies = [];

            if (!scripts[script].requires) {
                // The script doesn't have dependencies
                noDependencyScripts.push(script);
            } else {
                for (var require in scripts[script].requires) {
                    requiredScriptId = scripts[script].requires[require];
                    if (scripts[requiredScriptId]) {
                        // It's a script
                        scripts[requiredScriptId].notifyOnLoad.push(script);
                    } else if (groups[requiredScriptId]) {
                        // It's an existing group
                        groups[requiredScriptId].notifyOnLoad.push(script);
                    } else {
                        // It's a new group
                        createGroup(requiredScriptId);
                        groups[requiredScriptId].notifyOnLoad.push(script);
                    }
                }
            }

            // If the script belongs to a group add script to group's members
            if (scripts[script].groups) {
                for (var group in scripts[script].groups) {
                    groupId = scripts[script].groups[group];
                    if (!groups[groupId]) {
                        createGroup(groupId);
                    }
                    groups[groupId].members.push(script);
                }
            }
        }
    };

    var onScriptLoad = function(script) {
        var toNotifyId;
        var groupId;

        for (var toNotify in script.notifyOnLoad) {
            toNotifyId = script.notifyOnLoad[toNotify];
            scripts[toNotifyId].loadedDependencies.push(script.id);

            if (scripts[toNotifyId].loadedDependencies.length === scripts[toNotifyId].requires.length) {
                // All dependencies are loaded
                createScript(scripts[toNotifyId], groups);
            }

        }
        // Check groups
        if (script.groups) {
            for (var group in script.groups) {
                groupId = script.groups[group];
                groups[groupId].loadedDependencies.push(script.id);
                if (groups[groupId].loadedDependencies.length === groups[groupId].members.length) {
                    // It's the last script of the group, create dependencies
                    onScriptLoad(groups[groupId]);
                }
            }
        }
    };

    var createScript = function(script) {
        var el = document.createElement('script');
        el.addEventListener('load', function() {
            onScriptLoad(script);
        });
        el.src = script.source;

        document.body.appendChild(el);
    }

    var createLink = function(script) {
        var el = document.createElement('link');
        el.addEventListener('load', function() {
            onScriptLoad(script);
        });
        el.href = script.source;
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('type','text/css');

        if (script.options) {
            for (option in script.options) {
                el.setAttribute('option', script.options[option]);
            }
        }

        document.head.appendChild(el);
    }

    var loadScripts = function() {
        var noDependencyScripts = [];
        prepareLoad(noDependencyScripts);
        for (var i = 0, l = noDependencyScripts.length; i < l; i++) {
            if (scripts[noDependencyScripts[i]].type === 'js') {
                createScript(scripts[noDependencyScripts[i]]);
            } else if (scripts[noDependencyScripts[i]].type === 'link') {
                createLink(scripts[noDependencyScripts[i]]);
            }
        }
    };

    window.tymScriptLoader = function(s) {
        scripts = s;
        loadScripts();
    };
})();