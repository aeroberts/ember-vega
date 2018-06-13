'use strict';

const path = require('path');
const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');

// Taken from https://github.com/ef4/ember-browserify/blob/cea390845f15e70eedbe8530ed12f04126928459/lib/index.js
function findHost() {
    let current = this;
    let app;

    // Keep iterating upward until we don't have a grandparent.
    // Has to do this grandparent check because at some point we hit the project.
    // Stop at lazy engine boundaries.
    do {
        if (current.lazyLoading === true) {
            return current;
        }
        app = current.app || app;
    } while (current.parent && current.parent.parent && (current = current.parent));

    return app;
}

module.exports = {
    name: 'ember-vega',

    isDevelopingAddon: function() {
        return true;
    },

    included: function(app) {
        this._super.included && this._super.included.apply(this, arguments);

        app = findHost.call(this);

        this.app = app;

        app.import(path.join('vendor', 'vega', 'vega.js'), {
            using: [{
                transformation: 'amd',
                as: 'vega'
            }]
        });
    },

    treeForVendor: function(tree) {
        let trees = [];

        if (tree) {
            trees.push(tree);
        }

        let resolvedPath;

        try {
            resolvedPath = require.resolve('vega');
            this.ui.writeDeprecateLine('`vega` dependency was found. Use `vega-lib`, which excludes `node-canvas` dependencies to remove compilation steps and associated overhead.');
        } catch (e) {
            resolvedPath = require.resolve('vega-lib');
        }

        const vegaPath = path.dirname(resolvedPath);
        const vegaTree = new Funnel(vegaPath, {
            destDir: 'vega'
        });

        trees.push(vegaTree);

        return mergeTrees(trees);
    }
};