/*global define*/
define(function(require) {
    'use strict';

    var Backbone = require('backbone'),
        $ = require('jquery'),
        mapbox = require('mapbox'),
        d3 = require('d3'),
        nv = require('nv'),
        width = 1000, height = 1000;

    return {
        initialize: function() {
            $('#page-layout').html(
                '<div id="map"></div>' +
                '<div id="d3-container"></div>' +
                '<div id="charts-shim"></div>' +
                '<div id="charts" class="with-transitions"></div>'
            );

            var div = d3.select('#d3-container')
                    .append('div')
                    .attr('class', 'd3-vec'),
                svg = div.append('svg'),
                g = svg.append('g'),
                connectors = g.append('g').attr('class', 'connectors'),
                points = g.append('g').attr('class', 'points'),
                getter = function(attr) {
                    return function(d) { return d[attr]; };
                };

            function d3_layer() {
                var f = {}, groups, data, color, lineFunction;

                lineFunction = d3.svg.line()
                    .x(getter('x'))
                    .y(getter('y'))
                    .interpolate('linear');


                f.parent = div.node();

                f.project = function(x) {
                    var point = f.map.locationPoint({ lat: x[1], lon: x[0] });
                    return [point.x, point.y];
                };

                var first = true;
                f.draw = function() {
                    if (first) {
                        var bounds = f.map.extent(),
                            bl = bounds.southWest(),
                            tr = bounds.northEast(),
                            bottomLeft = f.project([bl.lon, bl.lat]),
                            topRight = f.project([tr.lon, tr.lat]);

                        svg.attr('width', topRight[0] - bottomLeft[0])
                            .attr('height', bottomLeft[1] - topRight[1])
                            .style('margin-left', bottomLeft[0] + 'px')
                            .style('margin-top', topRight[1] + 'px');

                        g.attr(
                            'transform',
                            'translate(' +
                                (-1 * bottomLeft[0]) + ',' +
                                (-1 * topRight[1]) +
                            ')'
                        );

                        first = true;
                    }

                    groups.each(function(d) {
                        var coords = f.map.locationPoint({
                            lat: d.latitude,
                            lon: d.longitude
                        });
                        d.x = coords.x;
                        d.y = coords.y;
                    });

                    svg.selectAll('path')
                        .attr('stroke', getter('gradientUrl'))
                        .attr('d', function(d) {
                            if (d.previous) {
                                return lineFunction([d, d.previous]);
                            }
                        });

                    svg.selectAll('circle')
                        .attr('fill', getter('color'))
                        .attr('cx', getter('x'))
                        .attr('cy', getter('y'));

                    svg.selectAll('text')
                        .attr('x', getter('x'))
                        .attr('y', getter('y'));
                };

                f.data = function(collection) {
                    data = collection;

                    groups = points.selectAll('g.sample').data(data)
                        .enter().append('g')
                        .attr('class', 'sample');

                    groups.append('path')
                        .each(function() { connectors.node().appendChild(this); });

                    groups.append('circle')
                        .attr('r', 10);

                    groups.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'middle')
                        .attr('fill', 'black')
                        .text(getter('index'));

                    return f;
                };

                return f;
            }

            mapbox.auto('map', 'examples.map-vyofok3q', function(map) {
                d3.csv('src/data/measurements.csv', function(data) {
                    var layer, midPoint, previous = null, index = 1,
                        color = d3.scale.linear().domain([
                            d3.min(data, getter('temperature')),
                            d3.mean(data, getter('temperature')),
                            d3.max(data, getter('temperature'))
                        ]).range(['green', 'yellow', 'red']);

                    _(data).each(function(d) {
                        d.datetime = new Date(parseInt(d.timestamp, 10));
                        d.color = color(d.temperature);
                        d.index = index;
                        if (previous) {
                            var gradient;

                            d.previous = previous;
                            d.gradient = 'gradient' + d.timestamp;
                            d.gradientUrl = 'url(#' + d.gradient + ')';

                            gradient = svg.append('linearGradient')
                                    .attr('id', d.gradient);

                            gradient.append('stop')
                                    .attr('stop-color', d.color)
                                    .attr('offset', '0%');
                            gradient.append('stop')
                                    .attr('stop-color', d.previous.color)
                                    .attr('offset', '100%');
                        }
                        previous = d;
                        index += 1;
                    });

                    nv.addGraph(function() {
                        var chartData = [
                                {
                                    key: 'Temperature',
                                    bar: true,
                                    values: _(data).map(function(x) {
                                        return {
                                            x: x.datetime,
                                            y: x['temperature']
                                        };
                                    })
                                },
                                {
                                    key: 'Acceleration X',
                                    values: _(data).map(function(x) {
                                        return {
                                            x: x.datetime,
                                            y: x['acceleration-x']
                                        };
                                    })
                                },
                                {
                                    key: 'Acceleration Y',
                                    values: _(data).map(function(x) {
                                        return {
                                            x: x.datetime,
                                            y: x['acceleration-y']
                                        };
                                    })
                                }
                            ],
                            chart = nv.models.linePlusBarChart()
                                .x(function(d,i) { return i })
                                .color(d3.scale.category10().range());

                        chart.xAxis
                            .axisLabel('Time (UTC)')
                            .tickFormat(function(d) {
                                var dx = chartData[0].values[d] && chartData[0].values[d].x || 0;
                                if (dx !== 0) {
                                    return d3.time.format('%Y-%m-%d %H:%M')(new Date(dx));
                                }
                            });

                        chart.y1Axis
                            .tickFormat(function(d) { return d3.format('.02f')(d) + '°F'; });

                        chart.y2Axis
                            .tickFormat(function(d) { return d3.format('.02f')(d) + ' m/s²'; });

                        d3.select('#charts').append('svg')
                            .datum(chartData)
                            .transition().duration(500)
                            .call(chart);

                        nv.utils.windowResize(chart.update);

                        return chart;
                    });

                    layer = d3_layer().data(data);
                    map.addLayer(layer);

                    midPoint = data[Math.floor(data.length / 2)];
                    map.zoom(13).center({
                        lat: midPoint.latitude,
                        lon: midPoint.longitude
                    });
                });
            });
        }
    };
});
