(function() {
    'use strict';

    var root = this,
        require = root.require;

    require.config({
        packages: [
            'charting'
        ],

        hbs: {
            disableI18n: true,
            disableHelpers: true
        },

        paths: {
            'backbone':            '../components/backbone/backbone',
            'bootstrap-tooltip':   '../components/bootstrap/js/bootstrap-tooltip',
            'd3':                  '../components/d3/d3',
            'nv':                  '../components/nvd3/nv.d3',
            'mapbox':              'lib/mapbox',
            'handlebars':          '../components/require-handlebars-plugin/Handlebars',
            'hbs':                 '../components/require-handlebars-plugin/hbs',
            'i18nprecompile':      '../components/require-handlebars-plugin/hbs/i18nprecompile',
            'jquery':              '../components/jquery/jquery',
            'json':                '../components/requirejs-plugins/src/json',
            'json2':               '../components/require-handlebars-plugin/hbs/json2',
            'text':                '../components/requirejs-plugins/lib/text',
            'underscore':          '../components/underscore/underscore'
        },

        pragmasOnSave: {
            excludeHbsParser: true,
            excludeHbs: true,
            excludeAfterBuild: true
        },

        skipModuleInsertion: false,
        wrap: true,

        shim: {
            mapbox: {
                exports: 'mapbox'
            },
            'bootstrap-tooltip': {
                deps: ['jquery'],
                exports: 'jQuery.fn.tooltip'
            },
            nv: {
                deps: ['d3', 'bootstrap-tooltip'],
                exports: 'nv'
            },
            backbone: {
                deps: ['underscore', 'jquery'],
                exports: 'Backbone'
            },
            d3: {
                exports: 'd3'
            },
            underscore: {
                exports: '_'
            }
        },

        deps: [
            'hbs'
        ],

        enforceDefine: true
    });

    var count = 0,
        updateModuleProgress = function(context, map, depMaps) {
            count += 1;
            var fetched = Object.keys(context.urlFetched).length,
                el = root.document.getElementById('requirejs-progress'),
                percentLoaded;

            if (el && fetched > 0) {
                percentLoaded = Math.min(100, (count / fetched) * 100);
                el.style.width = percentLoaded + '%';
            }
        };

    var onError = require.onError;
    require.onError = function(requireType, requireModules) {
        var progressEl = root.document.getElementById('requirejs-progress'),
            statusEl = root.document.getElementById('requirejs-status');

        if (progressEl) {
            progressEl.parentNode.className = progressEl.parentNode.className +
                ' progress-danger';
        }

        if (statusEl) {
            statusEl.innerHTML = 'Error loading application...';
        }

        if (onError) {
            onError.apply(this, arguments);
        }
    };


    require.onResourceLoad = function(context, map, depMaps) {
        if (map.parentMap) {
            updateModuleProgress(context, map, depMaps);
        }
    };

    define(function(require) {
        var _ = require('underscore'),
            Charting = require('charting');

        Charting.initialize();
    });
}).call(this);
