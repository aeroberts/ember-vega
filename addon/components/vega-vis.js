import { getOwner } from '@ember/application';
import Component from '@ember/component';
import $ from 'jquery';
import { run } from '@ember/runloop';
import { isArray } from '@ember/array';
import { assert } from '@ember/debug';
import {
  computed,
  getProperties,
  get
} from '@ember/object';
import { isPresent } from '@ember/utils';
import vg from 'vega';
import layout from '../templates/components/vega-vis';
import diffAttrs from 'ember-diff-attrs';

export default Component.extend({
    classNames: ['vega-vis'],

    layout,

    rendererType: 'svg',

    logLevel: 'Warn',

    background: null,

    padding: null,

    aspectRatio: null,

    isVisible: true,

    isResizable: true,

    /**
     * Events to add to vega view instance.
     * @type {object}
     */
    events: null,

    /**
     * Signal events to add to vega view instance.
     * @type {object|null}
     */
    signalEvents: null,

    fastboot: computed(function() {
        let owner = getOwner(this);

        return owner.lookup('service:fastboot');
    }),

    didUpdateAttrs: diffAttrs('isVisible', 'aspectRatio', function(changedAttrs, ...args) {
        this._super(...args);

        if (changedAttrs) {
            const {
                isVisible,
                aspectRatio
            } = changedAttrs;

            /*
            Resize when isVisible is true.
             */
            if (isVisible) {
                const [oldIsVisible, newIsVisible] = isVisible;

                if (newIsVisible && oldIsVisible !== newIsVisible) {
                    this.scheduleOnceResize();
                }
            }

            /*
            Resize when aspectRatio changes.
             */
            if (aspectRatio) {
                const [oldAspectRatio, newAspectRatio] = aspectRatio;

                if (oldAspectRatio !== newAspectRatio) {
                    this.scheduleOnceResize();
                }
            }
        }
    }),

    didInsertElement() {
        this._setupWindowResize();

        let {
            data,
            spec,
            config,
            rendererType,
            padding,
            background,
            logLevel,
            events,
            signalEvents
        } = getProperties(this, 'data', 'spec', 'rendererType', 'padding', 'background', 'logLevel', 'events', 'signalEvents');

        assert('spec property must be defined', !!spec);

        // if spec does not contain a data property, set the data object on it.
        if (isArray(data) && !('data' in spec)) {
            spec.data = data;
        }

        const runtime = vg.parse(spec, config);
        const vis = new vg.View(runtime);

        // Only initialize if not in fastboot.
        if (!get(this, 'fastboot')) {
            vis.initialize(this.element);
        }

        // TODO: Insert the data instead of setting it on the spec.
        // if (isArray(data)) {
        //     data.forEach((item) => {
        //         const {
        //             name,
        //             values
        //         } = item;
        //         if (name && values) {
        //             vis.insert(name, values);
        //         }
        //     });
        // }

        this._sizeVis(vis);

        // Optional.
        if(padding) {
            vis.padding(padding);
        }

        if (background) {
            vis.background(background);
        }

        vis.logLevel(vg[logLevel || 'Warn']);
        vis.renderer(rendererType);
        vis.hover();
        this.visRun(vis);

        this.set('vis', vis);

        this._addEvents(events);
        this._addSignalEvents(signalEvents);

        return this._super(...arguments);
    },

    willDestroyElement() {
        this._teardownWindowResize();

        let vis = this.get('vis');

        if (vis) {
            const {
                events,
                signalEvents
            } = getProperties(this, 'events', 'signalEvents');

            this._removeEvents(events);
            this._removeSignalEvents(signalEvents);
            vis.finalize();
            this.set('vis', undefined);
        }

        return this._super(...arguments);
    },

    visRun(vis, encode) {
        let {
            isDestroyed,
            isDestroying,
            isVisible
        } = getProperties(this, 'isDestroyed', 'isDestroying', 'isVisible');

        isVisible = isVisible !== false;

        if (vis && (!isDestroyed || !isDestroying) && isVisible) {
            vis.run(encode);
        }
    },

    windowResize() {
        let {
            isVisible,
            isResizable
        } = getProperties(this, 'isVisible', 'isResizable');

        isVisible = isVisible !== false;

        if (isVisible && isResizable) {
            const vis = get(this, 'vis');

            if (vis) {
                // TODO: Check subtract height and width from padding before setting?
                this._sizeVis(vis);
                this.visRun(vis, 'enter');
            }
        }

        return this;
    },

    scheduleOnceResize() {
        run.scheduleOnce('afterRender', this, 'windowResize');

        return this;
    },

    _invokeEventMethod(method, events) {
        const vis = get(this, 'vis');

        if (vis && events) {
            for (let [event, handler] of Object.entries(events)) {
                vis[method](event, handler);
            }
        }

        return this;
    },

    _addEvents(events = {}) {
        return this._invokeEventMethod('addEventListener', events);
    },

    _removeEvents(events = {}) {
        return this._invokeEventMethod('removeEventListener', events);
    },

    _addSignalEvents(signalEvents = {}) {
        return this._invokeEventMethod('addSignalListener', signalEvents);
    },

    _removeSignalEvents(signalEvents = {}) {
        return this._invokeEventMethod('removeSignalListener', signalEvents);
    },

    _sizeVis(vis) {
        const aspectRatio = get(this, 'aspectRatio');
        const element = this.$();
        const width = element.width();
        // Check that aspectRatio is not null or undefined.
        const height = isPresent(aspectRatio) ? aspectRatio * width : element.height();

        // TODO: Check subtract height and width from padding before setting?
        vis.width(width).height(height);

        return this;
    },

    _setupWindowResize() {
        if (!get(this, 'fastboot')) {
            this._onWindowResize = () => {
                run.debounce(this, 'scheduleOnceResize', 50);
            };

            $(window).on('resize', this._onWindowResize);
        }
    },

    _teardownWindowResize() {
        if (!get(this, 'fastboot')) {
            $(window).off('resize', this._onWindowResize);
        }
    }
});
