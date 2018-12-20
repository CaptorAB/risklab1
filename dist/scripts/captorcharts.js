var CaptorChartsHelper = (function () {
    function setOptionValue(options, key, defaultValue) {
        if (options === undefined)
            return defaultValue;
        if (options[key] === undefined)
            return defaultValue;
        return options[key];
    }

    function appendIfNotExists(parent, emnt, cls) {
        var res = parent.select(emnt + "." + cls.replace(" ", "."));
        if (!res.empty())
            return res;
        return parent.append(emnt)
                .attr("class", cls);
    }

    //#3B96D2; blå
    //#E64C3B; röd
    //#4EB96E; grön rgb(78, 185, 110)
    //#674172; lila
    //#D2527F; rosa
    //#94A4A5; grå rgb(148, 164, 165)
    //#EFC319; gul
    var colorPalette = ["#3B96D2", "#E64C3B", "#4EB96E", "#EFC319", "#D2527F", "#94A4A5", "#674172"];

    return {
        setOptionValue: setOptionValue,
        appendIfNotExists: appendIfNotExists,
        colorPalette: colorPalette
    };
}());

function BaseChart() {
    var svg;
    var initWidth;
    var initHeight;
    var gAxises;
    var gPlotArea;
    var scales = {};

    function init(container, options) {
        widthHeightRatio = CaptorChartsHelper.setOptionValue(options, "widthHeightRatio", 1.5);

        svg = d3.select(container + " svg");
        if (svg.empty()) {
            svg = d3.select(container).append("svg")
                .attr("class", "captorchart")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("style", "display: flex;");
        }
        gAxises = CaptorChartsHelper.appendIfNotExists(svg, "g", "axises");
        gPlotArea = CaptorChartsHelper.appendIfNotExists(svg, "g", "plotarea");

        initWidth = $(container).width();
        if (!widthHeightRatio || (widthHeightRatio == 0)) {
            initHeight = $(container).height();
            if (initHeight == 0)
                initHeight = svg[0][0].height.baseVal.value;
        }
        else
            initHeight = Math.floor(initWidth / widthHeightRatio);

        svg.attr("viewBox", "0 0 " + initWidth + " " + initHeight);
    }

    function change(data, changeAxisFun, changePlotAreaFun) {
        var x0 = 0;
        var y0 = 0;
        var width = initWidth;
        var height = initHeight;
        //if (gAxises) {
        //    var bbox = gAxises.node().getBBox();
        //    x0 = -bbox.x;
        //    y0 = -bbox.y;
        //    if (bbox.width > 0)
        //        width = 2 * initWidth - bbox.width;
        //    if (bbox.height > 0)
        //        height = 2 * initHeight - bbox.height;
        //}
        var n = 0;
        while (n < 2) {
            if (changeAxisFun !== undefined)
                changeAxisFun(data, x0, y0, width, height, scales, gAxises);

            gPlotArea.attr("transform", "translate(" + (x0) + "," + (y0) + ")")

            var bbox = gAxises.node().getBBox();
            width = 2 * initWidth - bbox.width;
            height = 2 * initHeight - bbox.height;
            x0 = -bbox.x;
            y0 = -bbox.y;

            if ((Math.abs(width - initWidth) < 2.0) && (Math.abs(height - initHeight) < 2.0))
                break;
            else if (n > 0)
                var debug = true;

            n++;
        }

        if (changePlotAreaFun !== undefined)
            changePlotAreaFun(data, width, height, scales, gPlotArea);

        //var txt = gPlotArea.select("text.debug");
        //if (txt.empty())
        //    txt = gPlotArea.append("text")
        //        .attr("class", "debug");
        //txt
        //    .attr("x", "20")
        //    .attr("y", "20")
        //    .text("n = " + n.toFixed(1) + ", x0 = " + x0.toFixed(1) + ", y0 = " + y0.toFixed(1) +
        //        ", width = " + width.toFixed(1) + ", height = " + height.toFixed(1) +
        //        ", ex = " + Math.abs(width - initWidth).toFixed(1) + ", ey = " + Math.abs(height - initHeight).toFixed(1));
    }

    function getSvg() {
        return svg;
    }

    return {
        init: init,
        change: change,
        getSvg: getSvg
    };
}

function BaseChartChild() {
    var bc = new BaseChart();

    function init(container, options) {
        bc.init(container, options);
    }

    function changeAxises(data, x0, y0, width, height, scales, gAxises) {
    }

    function changePlotArea(data, width, height, scales, gPlotArea) {
    }

    function change(data) {
        bc.change(data, changeAxises, changePlotArea);
    }

    return {
        init: init,
        change: change,
    };
}

function ReturnsBarChart() {
    var bc = new BaseChart();

    function init(container, options) {
        bc.init(container, options);
    }

    function getSize(sel, key) {
        var x = $(sel).css(key);
        x = x.toLowerCase();
        x = x.replace('px', '');
        return parseInt(x);
    };

    function getMinMax() {
        return { minReturn: minReturn, maxReturn: maxReturn, minLabel: minLabel, maxLabel: maxLabel };
    }

    function returnToString(ret) {
        var txt = (100.0 * ret).toFixed(0) + '%';
        if (ret > 0.0)
            txt = '+' + txt;
        return txt;
    }

    function calcFontSize(xb) {
        if (xb >= 30)
            return 16;
        else if (xb >= 20)
            return 14;
        else if (xb >= 12)
            return 12;
        return 10;
    }

    function appendText(g, txt, cl, x, y, dx, fs) {
        var gt = g.append("g")
            .attr("class", "text")
            .attr("transform", "translate(" + x + "," + y + ")");
        gt.append("text")
            .attr("class", cl)
            .attr("transform", "rotate(90)")
            .attr('dx', dx)
            .attr('dy', "0.3em")
            .attr('font-size', fs + 'px')
            .text(txt)
            .style("opacity", "0")
            .transition()
            .duration(1400)
            .style("opacity", "1");
    }

    function addText(g, y1, h, label, ret, xscale) {
        var xb = xscale.rangeBand();
        var fs = calcFontSize(xb);
        var xx = xscale(label) + xb / 2.0;
        var txt = returnToString(ret);
        if (ret < 0.0) {
            appendText(g, txt, "negative value", xx, y1 + h, "-0.2em", fs);
            appendText(g, label, "negative date", xx, y1, "0.2em", fs);
        }
        else {
            appendText(g, txt, "positive value", xx, y1, "0.2em", fs);
            appendText(g, label, "positive date", xx, y1 + h, "-0.2em", fs);
        }
    }

    //var yearFormat = d3.time.format("%Y");

    function calcBars(data) {
        var accumulate = false;
        var res = { bars: [] };
        var r0 = 0.0;
        if (accumulate)
            r0 = 1.0;
        res.y0 = r0;
        var min = r0;
        var max = r0;
        var minr = 9e9;
        var maxr = -9e9;
        var mind = '';
        var maxd = '';
        var miny = 0;
        var maxy = 0;
        var xLabels = [];
        var dt = (data.timestamps[data.timestamps.length - 1] - data.timestamps[0]) / (data.timestamps.length - 1) / (1000 * 60 * 60 * 24);
        var dateFormat = "yyyy";
        var isLabel = function (d) { return (d.getFullYear() % 5) == 0; };
        if (dt < 45.0) {
            dateFormat = "mmm yy";
            isLabel = function (d) { return d.getMonth() == 0; };
        }
        for (var i in data.timestamps) {
            var dt = data.timestamps[i].format(dateFormat);
            if (isLabel(data.timestamps[i]))
                xLabels.push(dt);
            var ret = data.values[i];
            var r1;
            if (accumulate) {
                r1 = r0 * (1.0 + ret);
            }
            else {
                r0 = 0.0;
                r1 = ret;
            }
            if (r1 > max) {
                max = r1;
            }
            if (r1 < min) {
                min = r1;
            }
            if (ret > maxr) {
                maxr = ret;
                maxd = dt;
            }
            if (ret < minr) {
                minr = ret;
                mind = dt;
            }
            var y0 = r0;
            var y1 = r1;
            var cl = 'bar ';
            if (y1 > y0)
                cl += 'positive';
            else {
                y0 = r1;
                y1 = r0;
                cl += 'negative';
            }
            var bar = { label: dt, ret: ret, y0: y0, y1: y1, cl: cl };
            res.bars.push(bar);
            r0 = r1;
        }
        for (var i in res.bars) {
            var bar = res.bars[i];
            if (bar.label == mind)
                bar.cl += ' min';
            if (bar.label == maxd)
                bar.cl += ' max';
        }
        res.domain = [min, max];
        res.minReturn = minr;
        res.maxReturn = maxr;
        res.minDate = mind;
        res.maxDate = maxd;
        res.xLabels = xLabels;
        return res;
    }

    function changeAxises(data, x0, y0, width, height, scales, gAxises) {
        scales.x = d3.scale.ordinal()
            .rangeRoundBands([0, width], 0.18);

        scales.y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(scales.x)
            .orient("bottom")
            .tickValues(data.xLabels)
            .tickSize(-height, 3);

        var yAxis = d3.svg.axis()
            .scale(scales.y)
            .orient("left")
            .ticks(4)
            .tickSize(-width, 3)
            .tickFormat(d3.format(",.0f"));

        scales.x.domain(data.bars.map(function (v) { return v.label; }));
        scales.y.domain(data.domain);

        var gX = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "x axis");
        gX.call(xAxis);
        gX.attr("transform", "translate(" + (x0) + "," + (y0 + height) + ")")
        gX.selectAll("text").attr("dy", "0.86em");

        var gY = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "y axis");
        gY.call(yAxis);
        gY.attr("transform", "translate(" + (x0) + "," + (y0) + ")")
        gY.selectAll("text").attr("dx", "-0.15em");
    }

    function changePlotArea(data, width, height, scales, gPlotArea) {
        var barupsel = gPlotArea.selectAll("rect.bar")
            .data(data.bars);

        barupsel
            .attr("class", function (d) { return d.cl; })
            .attr("x", function (d) { return scales.x(d.label); })
            .attr("width", scales.x.rangeBand())
            .transition()
            .duration(1000)
            .attr("y", function (d) { return scales.y(d.y1); })
            .attr("height", function (d) { return scales.y(d.y0) - scales.y(d.y1); })
            .select("title")
            .text(function (d) { return d.label + ': ' + returnToString(d.ret); });

        barupsel.select("title")
            .text(function (d) { return d.label + ': ' + returnToString(d.ret); });

        barupsel.enter().append("rect")
            .attr("class", function (d) { return d.cl; })
            .attr("x", function (d) { return scales.x(d.label); })
            .attr("width", scales.x.rangeBand())
            .attr("y", scales.y(data.y0))
            .attr("height", 0)
            .transition()
            .duration(1000)
            .attr("y", function (d) { return scales.y(d.y1); })
            .attr("height", function (d) { return scales.y(d.y0) - scales.y(d.y1); });

        barupsel.exit()
            .transition()
            .duration(1000)
            .attr("height", 0)
            .remove();

        gPlotArea.selectAll("g.text").remove();
        if (scales.x.rangeBand() >= 10) {
            for (var i in data.bars) {
                var bar = data.bars[i];
                if ((bar.label == data.minDate) || (bar.label == data.maxDate)) {
                    var y1 = scales.y(bar.y1);
                    var h = scales.y(bar.y0) - y1;
                    addText(gPlotArea, y1, h, bar.label, bar.ret, scales.x);
                }
            }
        }
    }

    var minMax = {};

    function getMinMax() {
        return minMax;
    }

    function change(data) {
        var b = calcBars(data);
        minMax.minReturn = b.minReturn;
        minMax.maxReturn = b.maxReturn;
        minMax.minDate = b.minDate;
        minMax.maxDate = b.maxDate;
        bc.change(b, changeAxises, changePlotArea);
    }

    return {
        init: init,
        change: change,
        getMinMax: getMinMax
    };
}

function PieChart() {
    var svg;
    var pie;
    var arc;
    var outerArc;
    var widthHeightRatio;
    var scaleFactor;
    var showLabels;

    var key = function (d) { return d.data.label; };

    function midAngle(d) {
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    function getSize(sel, key) {
        var x = $(sel).css(key);
        x = x.toLowerCase();
        x = x.replace('px', '');
        return parseInt(x);
    }

    function init(container, options) {
        widthHeightRatio = CaptorChartsHelper.setOptionValue(options, "widthHeightRatio", 1.5);
        scaleFactor = CaptorChartsHelper.setOptionValue(options, "scaleFactor", 0.85 / 0.9);
        showLabels = CaptorChartsHelper.setOptionValue(options, "showLabels", true);

        svg = d3.select(container + " svg");
        if (svg.empty()) {
            svg = d3.select(container).append("svg")
                .attr("class", "piechart")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("style", "display: flex;");
        }
        gPlotArea = CaptorChartsHelper.appendIfNotExists(svg, "g", "plotarea");

        CaptorChartsHelper.appendIfNotExists(gPlotArea, "g", "slices");
        CaptorChartsHelper.appendIfNotExists(gPlotArea, "g", "labels");
        CaptorChartsHelper.appendIfNotExists(gPlotArea, "g", "lines");

        initWidth = $(container).width();
        if (!widthHeightRatio || (widthHeightRatio == 0)) {
            initHeight = $(container).height();
            if (initHeight == 0)
                initHeight = svg[0][0].height.baseVal.value;
        }
        else
            initHeight = Math.floor(initWidth / widthHeightRatio);

        svg.attr("viewBox", "0 0 " + initWidth + " " + initHeight);

        var width = initWidth;
        var height = initHeight;

        radius = scaleFactor * Math.min(width, height) / 2.0;

        pie = d3.layout.pie()
	        .sort(null)
	        .value(function (d) {
	            return d.value;
	        });

        arc = d3.svg.arc()
	        .outerRadius(radius * 0.8)
	        .innerRadius(radius * 0.4);

        if (!showLabels) {
            arc = d3.svg.arc()
                .outerRadius(radius * 1.0)
                .innerRadius(radius * 0.5);
        }

        outerArc = d3.svg.arc()
	        .innerRadius(radius * 0.9)
	        .outerRadius(radius * 0.9);

        gPlotArea.attr("transform", "translate(" + width / 2.0 + "," + height / 2.0 + ")");
    };

    function changeData(data) {

        var labels = [];
        var colors = [];
        for (var i in data) {
            labels.push(data[i].label);
            colors.push(CaptorChartsHelper.colorPalette[parseInt(i) % data.length]);
        }
        var color = d3.scale.ordinal()
	        .domain(labels)
	        .range(colors);

        var slice = svg.select(".slices").selectAll("path.slice")
		    .data(pie(data), key);

        slice.enter()
		    .insert("path")
		    .style("fill", function (d) { return color(d.data.label); })
		    .attr("class", "slice");

        slice
		    .transition().duration(1000)
		    .attrTween("d", function (d) {
		        this._current = this._current || d;
		        var interpolate = d3.interpolate(this._current, d);
		        this._current = interpolate(0);
		        return function (t) {
		            return arc(interpolate(t));
		        };
		    })

        slice.exit()
		    .remove();

        if (!showLabels)
            return;
        /* ------- TEXT LABELS -------*/

        var text = svg.select(".labels").selectAll("text")
		    .data(pie(data), key);

        text.enter()
		    .append("text")
		    .attr("dy", ".35em")
		    .text(function (d) {
		        return d.data.label;
		    });

        text.transition().duration(1000)
		    .attrTween("transform", function (d) {
		        this._current = this._current || d;
		        var interpolate = d3.interpolate(this._current, d);
		        this._current = interpolate(0);
		        return function (t) {
		            var d2 = interpolate(t);
		            var pos = outerArc.centroid(d2);
		            pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
		            return "translate(" + pos + ")";
		        };
		    })
		    .styleTween("text-anchor", function (d) {
		        this._current = this._current || d;
		        var interpolate = d3.interpolate(this._current, d);
		        this._current = interpolate(0);
		        return function (t) {
		            var d2 = interpolate(t);
		            return midAngle(d2) < Math.PI ? "start" : "end";
		        };
		    });

        text.exit()
		    .remove();

        /* ------- SLICE TO TEXT POLYLINES -------*/

        var polyline = svg.select(".lines").selectAll("polyline")
		    .data(pie(data), key);

        polyline.enter()
		    .append("polyline");

        polyline.transition().duration(1000)
		    .attrTween("points", function (d) {
		        this._current = this._current || d;
		        var interpolate = d3.interpolate(this._current, d);
		        this._current = interpolate(0);
		        return function (t) {
		            var d2 = interpolate(t);
		            var pos = outerArc.centroid(d2);
		            pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
		            return [arc.centroid(d2), outerArc.centroid(d2), pos];
		        };
		    });

        polyline.exit()
		    .remove();
    };

    return {
        init: init,
        changeData: changeData,
        randomData: randomData
    };
}

function MaxDrawdownChart() {
    var bc = new BaseChart();

    function init(container, options) {
        bc.init(container, options);
    }

    function changeAxises(data, x0, y0, width, height, scales, gAxises) {
        scales.x = d3.time.scale()
            .range([0, width]);

        scales.y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(scales.x)
            .orient("bottom")
            .ticks(5)
            .tickSize(-height, 3);

        var yAxis = d3.svg.axis()
            .scale(scales.y)
            .orient("left")
            .ticks(4)
            .tickSize(-width, 3)
            .tickFormat(d3.format(",.0f"));

        scales.x.domain(d3.extent(data.timeseriesItems, function (d) { return d.timestamp; }));
        var ymaxmin = d3.extent(data.timeseriesItems, function (d) { return d.value; });
        ymaxmin[0] *= 0.9;
        ymaxmin[1] *= 1.05;
        scales.y.domain(ymaxmin);

        var gX = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "x axis");
        gX.call(xAxis);
        gX.attr("transform", "translate(" + (x0) + "," + (y0 + height) + ")")
        gX.selectAll("text").attr("dy", "0.86em");

        var gY = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "y axis");
        gY.call(yAxis);
        gY.attr("transform", "translate(" + (x0) + "," + (y0) + ")")
        gY.selectAll("text").attr("dx", "-0.15em");
    }

    function changePlotArea(data, width, height, scales, gPlotArea) {

        //g.select("g.x.axis").remove();
        //var gx = g.append("g")
        //    .attr("class", "x axis")
        //    .call(xAxis);
        //gx.attr("transform", "translate(" + (0) + "," + (height) + ")")
        //gx.selectAll("text").attr("dy", '0.86em');

        //g.select("g.y.axis").remove();
        //var gy = g.append("g")
        //    .attr("class", "y axis")
        //    .call(yAxis);
        //gy.attr("transform", "translate(" + (0) + "," + (0) + ")")
        //gy.selectAll("text").attr("dx", '-0.15em');

        var line = d3.svg.line()
            .x(function (d) { return scales.x(d.timestamp); })
            .y(function (d) { return scales.y(d.value); });

        var y0 = data.timeseriesItems[0].value;
        var line0 = d3.svg.line()
            .x(function (d) { return scales.x(d.timestamp); })
            .y(function (d) { return scales.y(y0); });

        var updsel = gPlotArea.selectAll("path.line").data([{}]);

        updsel
            .datum(data.timeseriesItems)
            .transition()
            .duration(1000)
            .attr("d", line);

        updsel.enter().append("path")
            .attr("class", "line")
            .datum(data.timeseriesItems)
            .attr("d", line0)
            .transition()
            .duration(1000)
            .attr("d", line);

        var d = [{}];
        d[0].x0 = scales.x(data.timeseriesItems[data.startIndex].timestamp);
        d[0].y0 = scales.y(data.timeseriesItems[data.startIndex].value);
        d[0].xh = scales.x(data.timeseriesItems[data.endIndex].timestamp) - d[0].x0;
        d[0].yh = scales.y(data.timeseriesItems[data.endIndex].value) - d[0].y0;

        var updsel = gPlotArea.selectAll("rect.drawdown").data(d);

        updsel
            .transition()
            .delay(400)
            .duration(800)
            .attr('x', function (d) { return d.x0; })
            .attr('width', function (d) { return d.xh; })
            .attr('y', function (d) { return d.y0; })
            .attr('height', function (d) { return d.yh; });

        updsel.enter().append("rect")
            .attr("class", "drawdown")
            .attr('x', function (d) { return d.x0; })
            .attr('width', function (d) { return d.xh; })
            .attr('y', function (d) { return d.y0 + d.yh; })
            .attr('height', 0)
            .transition()
            .delay(400)
            .duration(800)
            .attr('y', function (d) { return d.y0; })
            .attr('height', function (d) { return d.yh; });

        //var bbox = gPlotArea.node().getBBox();
        //var sx = width / bbox.width;
        //var sy = height / bbox.height;
        //gPlotArea.attr('transform', 'translate(' + (margin.leftRight - bbox.x) + ' ' + (margin.topBottom - bbox.y) + ') scale(' + sx + ' ' + sy + ')');
    }

    function change(data) {
        bc.change(data, changeAxises, changePlotArea);
    }

    return {
        init: init,
        change: change,
    };
}

function MaxDrawdownChart150517() {

    var svg;
    var g;
    var xScale;
    var yScale;
    var xAxis;
    var yAxis;
    var line;
    var width;
    var height;
    var margin;

    //function getSize(container, key) {
    //}

    function init(container, options) {
        //var widthHeightRatio = 16.0 / 9.0;
        var widthHeightRatio = 3.0 / 2.0;
        margin = { topBottom: 0, leftRight: 2 };
        if (options) {
            if (options.widthHeightRatio)
                widthHeightRatio = options.widthHeightRatio;
            if (options.margin)
                margin = options.margin;
        }

        svg = d3.select(container + ' svg');
        if (svg.empty()) {
            svg = d3.select(container).append('svg')
                .attr('class', 'maxdrawdownchart')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('style', 'display: flex;');
            svg.append('g');
        }
        g = d3.select(container + ' g');
        g.attr('transform', 'translate(' + (margin.leftRight) + ' ' + (margin.topBottom) + ')');

        var w = $(container).width();
        var h;
        if (!widthHeightRatio || (widthHeightRatio == 0)) {
            h = $(container).height();
            if (h == 0)
                h = svg[0][0].height.baseVal.value;
        }
        else
            h = Math.floor(w / widthHeightRatio);

        svg.attr('viewBox', '0 0 ' + w + ' ' + h);

        width = w - 2 * margin.leftRight;
        height = h - 2 * margin.topBottom;

        xScale = d3.time.scale()
            .range([0, width]);

        yScale = d3.scale.log()
            .range([height, 0]);

        xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(5)
            .tickSize(-height, 3);

        yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(4)
            .tickSize(-width, 3)
            .tickFormat(d3.format(",.0f"));

        line = d3.svg.line()
            .x(function (d) { return xScale(d.timestamp); })
            .y(function (d) { return yScale(d.value); });
    };

    function changeData(data, startindex, endindex) {
        xScale.domain(d3.extent(data, function (d) { return d.timestamp; }));
        var ymaxmin = d3.extent(data, function (d) { return d.value; });
        //xScale.domain(d3.extent(data.timestamps));
        //var ymaxmin = d3.extent(data.values);
        ymaxmin[0] *= 0.9;
        ymaxmin[1] *= 1.05;
        yScale.domain(ymaxmin);

        g.select("g.x.axis").remove();
        var gx = g.append("g")
            .attr("class", "x axis")
            .call(xAxis);
        gx.attr("transform", "translate(" + (0) + "," + (height) + ")")
        gx.selectAll("text").attr("dy", '0.86em');

        g.select("g.y.axis").remove();
        var gy = g.append("g")
            .attr("class", "y axis")
            .call(yAxis);
        gy.attr("transform", "translate(" + (0) + "," + (0) + ")")
        gy.selectAll("text").attr("dx", '-0.15em');

        var y0 = data[0].value;
        var line0 = d3.svg.line()
            .x(function (d) { return xScale(d.timestamp); })
            .y(function (d) { return yScale(y0); });

        var updsel = g.selectAll("path.line").data([{}]);

        updsel
            .datum(data)
            .transition()
            .duration(1000)
            .attr("d", line);

        updsel.enter().append("path")
            .attr("class", "line")
            .datum(data)
            .attr("d", line0)
            .transition()
            .duration(1000)
            .attr("d", line);

        var d = [{}];
        d[0].x0 = xScale(data[startindex].timestamp);
        d[0].y0 = yScale(data[startindex].value);
        d[0].xh = xScale(data[endindex].timestamp) - d[0].x0;
        d[0].yh = yScale(data[endindex].value) - d[0].y0;
        var updsel = g.selectAll("rect.drawdown").data(d);

        updsel
            .transition()
            .delay(400)
            .duration(800)
            .attr('x', function (d) { return d.x0; })
            .attr('width', function (d) { return d.xh; })
            .attr('y', function (d) { return d.y0; })
            .attr('height', function (d) { return d.yh; });


        updsel.enter().append("rect")
            .attr("class", "drawdown")
            .attr('x', function (d) { return d.x0; })
            .attr('width', function (d) { return d.xh; })
            .attr('y', function (d) { return d.y0 + d.yh; })
            .attr('height', 0)
            .transition()
            .delay(400)
            .duration(800)
            .attr('y', function (d) { return d.y0; })
            .attr('height', function (d) { return d.yh; });

        var bbox = g.node().getBBox();
        var sx = width / bbox.width;
        var sy = height / bbox.height;
        g.attr('transform', 'translate(' + (margin.leftRight - bbox.x) + ' ' + (margin.topBottom - bbox.y) + ') scale(' + sx + ' ' + sy + ')');
    };

    return {
        init: init,
        changeData: changeData
    };
};

function RiskGauge(container) {
    var that = {};
    var config = {
        ringInsetPercent: 0.00,
        ringWidthPercent: 0.085,

        pointerWidth: 10,
        pointerTailLength: 6,
        pointerHeadLengthPercent: 0.76,

        minValue: 0,
        maxValue: 10,

        minAngle: -100,
        maxAngle: 100,

        transitionMs: 1000,

        majorTicks: 10,
        labelFormat: d3.format(',g'),
        labelInsetPercent: 0.20,

        //arcColorFn: function (x) {
        //    var f1 = d3.interpolateHsl(d3.rgb('#4EB96E'), d3.rgb('#D5D242'));
        //    var f2 = d3.interpolateHsl(d3.rgb('#D5D242'), d3.rgb('#E64C3B'));
        //    if (x < 0.5)
        //        return f1(2.0 * x);
        //    return f2(2.5 * (x - 0.5));
        //}
        arcColorFn: function (x) {
            return d3.rgb('#E7E7E7');
        }
    };
    var range = undefined;
    var r = undefined;
    var pointerHeadLength = undefined;
    var value = 0;

    function deg2rad(deg) {
        return deg * Math.PI / 180;
    }

    var width = $(container).width();
    var h = (-Math.min(Math.sin(deg2rad(90 - config.maxAngle)), Math.sin(deg2rad(90 - config.minAngle))))/2.0;
    var height = Math.floor(0.525 * width) + Math.max(config.pointerTailLength,  Math.floor(h * width)); 

    var svg = undefined;
    var arc = undefined;
    var arcClick = undefined;
    var scale = undefined;
    var ticks = undefined;
    var tickData = undefined;
    var pointer = undefined;

    function newAngle(d) {
        var ratio = scale(d);
        var newAngle = config.minAngle + (ratio * range);
        return newAngle;
    }

    var mouseclickcallback;

    function configure(configuration) {
        var prop = undefined;
        for (prop in configuration) {
            config[prop] = configuration[prop];
        }

        mouseclickcallback = CaptorChartsHelper.setOptionValue(configuration, "mouseclick", undefined);

        range = config.maxAngle - config.minAngle;
        r = width / 2;
        pointerHeadLength = Math.round(r * config.pointerHeadLengthPercent);

        // a linear scale that maps domain values to a percent from 0..1
        scale = d3.scale.linear()
			.range([0, 1])
			.domain([config.minValue, config.maxValue]);

        ticks = scale.ticks(config.majorTicks);
        tickData = d3.range(config.majorTicks).map(function () { return 1 / config.majorTicks; });

        arc = d3.svg.arc()
			.innerRadius(r - width / 2.0 * (config.ringWidthPercent + config.ringInsetPercent))
			.outerRadius(r - width / 2.0 * config.ringInsetPercent)
			.startAngle(function (d) {
			    return deg2rad(config.minAngle);
			})
			.endAngle(function (d) {
			    return deg2rad(config.minAngle + Math.max(Math.min(d, 1.0), 0.0) * range);
			});

        arcClick = d3.svg.arc()
			.innerRadius(r - width / 2.0 * (config.labelInsetPercent + config.ringInsetPercent))
			.outerRadius(r - width / 2.0 * config.ringInsetPercent)
			.startAngle(function (d) {
			    return deg2rad(config.minAngle + (d - 0.5) / 10.0 * range);
			})
			.endAngle(function (d) {
			    return deg2rad(config.minAngle + (d + 0.5) / 10.0 * range);
			});
    }
    that.configure = configure;

    function centerTranslation() {
        return 'translate(' + r + ',' + r + ')';
    }

    function isRendered() {
        return (svg !== undefined);
    }
    that.isRendered = isRendered;

    function mouseclick(d) {
        if (mouseclickcallback !== undefined)
            mouseclickcallback(d);
    }

    function render(newValue) {
        svg = d3.select(container)
			.append('svg')
				.attr('class', 'riskgauge')
				//.attr('width', config.clipWidth)
				//.attr('height', config.clipHeight)
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('style', 'display: flex;');

        svg.attr('viewBox', '0 0 ' + width + ' ' + height);

        var centerTx = centerTranslation();

        var arcs = svg.append("g")
				.attr("class", "arc")
				.attr("transform", centerTx);

        arcs.selectAll("path.back")
			.data([1.0])
			.enter()
            .append("path")
		    .attr("class", "back")
			.attr("d", arc);

        arcs.selectAll("path.value")
			.data([scale(value)])
			.enter()
            .append("path")
		    .attr("class", "value")
			.attr("d", arc);

        var lg = svg.append('g')
				.attr('class', 'label')
				.attr('transform', centerTx);
        lg.selectAll('text')
				.data(ticks)
			.enter().append('text')
				.attr('transform', function (d) {
				    var ratio = scale(d);
				    var newAngle = config.minAngle + (ratio * range);
				    return 'rotate(' + newAngle + ') translate(0,' + (width / 2.0 * config.labelInsetPercent - r) + ')';
				})
				.text(config.labelFormat);

        var lineData = [[config.pointerWidth / 2, 0],
						[0, -pointerHeadLength],
						[-(config.pointerWidth / 2), 0],
						[0, config.pointerTailLength],
						[config.pointerWidth / 2, 0]];
        var pointerLine = d3.svg.line().interpolate('monotone');
        var pg = svg.append('g').data([lineData])
				.attr('class', 'pointer')
				.attr('transform', centerTx);
        pg
            .append("circle")
        	.attr("class", "pointerbackground")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 0.1 * width);
        pg
            .append("circle")
        	.attr("class", "pointer")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 0.05 * width);

        pointer = pg.append('path')
			.attr('d', pointerLine/*function(d) { return pointerLine(d) +'Z';}*/)
			.attr('transform', 'rotate(' + config.minAngle + ')');

        var gclick = svg.append("g")
				.attr("class", "click")
				.attr("transform", centerTx);

        var sty = "";
        if (mouseclickcallback !== undefined)
            sty = "cursor: pointer;";

        gclick.selectAll("path.click")
            .data(ticks)
			.enter()
            .append("path")
		    .attr("id", function (d) { return d; })
		    .attr("class", "click")
			.attr("d", arcClick)
            .attr("style", sty)
            .on("click", mouseclick);

        update(newValue === undefined ? 0 : newValue);
    }
    that.render = render;

    function update(newValue, newConfiguration) {
        if (newConfiguration !== undefined) {
            configure(newConfiguration);
        }
        var ratio = scale(newValue);
        var oldAngle = config.minAngle + scale(value) * range;
        var newAngle = config.minAngle + scale(newValue) * range;
        pointer.transition()
			.duration(config.transitionMs)
			.ease('elastic')
            .attrTween("transform", function () { return d3.interpolateString("rotate(" + oldAngle + ")", "rotate(" + newAngle + ")"); });

        var arcs = svg.select("g.arc");
        var arcdata = [{ start: scale(value), end: scale(newValue) }];
        arcs.selectAll("path.value")
			.data(arcdata)
            .transition()
			.duration(config.transitionMs)
            .attrTween("d", function (d) { 
                //var start = {startAngle: 0.3, endAngle: 0.7};
                var interpolate = d3.interpolate(d.start, d.end);
                return function (t) {
                    //return arc(interpolate(Math.max(Math.min(t, 1.0), 0.0)));
                    return arc(interpolate(t));
                };
            })
			.ease('elastic');

        value = newValue;
    }
    that.update = update;

    configure(config);

    return that;
}

function GrowthForecastChart() {
    var bc = new BaseChart();

    var mouseclickcallback;

    function init(container, options) {
        mouseclickcallback = CaptorChartsHelper.setOptionValue(options, "mouseclick", undefined);
        bc.init(container, options);
        if (mouseclickcallback !== undefined)
            bc.getSvg().attr("style", bc.getSvg().attr("style") + "cursor: pointer;");
    }

    function moneyFormat(d) {
        var d = d / 1000.0;
        return (1000.0*Math.round(d)).toLocaleString() + " kr";
        //d = d / 1000.0;
        //var fun = d3.format(",.0f");
        //return fun(d) + " tkr";
    }

    function changeAxises(data, x0, y0, width, height, scales, gAxises) {
        scales.x = d3.time.scale()
            .range([0, width]);

        scales.y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(scales.x)
            .orient("bottom")
            .ticks(5)
            .tickSize(-height, 3)
            .tickFormat(d3.time.format("%Y"));

        var yAxis = d3.svg.axis()
            .scale(scales.y)
            .orient("right")
            .ticks(4)
            .tickSize(width, 3)
            .tickFormat(moneyFormat);

        scales.x.domain(d3.extent(data.timestamps));
        var es = [];
        for (var i in data.values) {
            es.push(d3.extent(data.values[i]));
        }
        scales.y.domain([Math.min.apply(Math, es.map(function (v) { return v[0]; }))-1000, Math.max.apply(Math, es.map(function (v) { return v[1]; }))]);
        scales.y.nice();

        var gX = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "x axis");
        gX.call(xAxis);
        gX.attr("transform", "translate(" + (x0) + "," + (y0 + height) + ")")
        gX.selectAll("text").attr("dy", "0.86em");

        var gY = CaptorChartsHelper.appendIfNotExists(gAxises, "g", "y axis");
        gY.call(yAxis);
        gY.attr("transform", "translate(" + (x0) + "," + (y0) + ")")
        gY.selectAll("text").attr("dx", "0.3em");
    }

    var monthlyTimestamps;
    var monthlyValues = [];
    var lastMouseX;

    function changePlotArea(data, width, height, scales, gPlotArea) {
        var v0 = d3.min(data, function (d) { return d.value; });
        var area0 = d3.svg.area()
                .x(function (d) { return scales.x(d.x); })
                .y0(function (d) { return height; })
                .y1(function (d) { return height; });

        var area = d3.svg.area()
                .x(function (d) { return scales.x(d.x); })
                .y0(function (d) { return scales.y(d.y0); })
                .y1(function (d) { return scales.y(d.y1); });

        for (var i = 0; i < (data.values.length - 1) ; i++) {
            var upsel = gPlotArea.selectAll("path.area" + i.toString()).data([{}]);

            var dta = [];
            for (var j in data.timestamps) {
                dta.push({ x: data.timestamps[j], y0: data.values[i][j], y1: data.values[i+1][j] });
            }

            upsel
                .datum(dta)
                .transition()
                .duration(1000)
                .attr("d", area);

            upsel.enter().append("path")
                //.attr("id", i.toString())
                .attr("class", "area" + i.toString())
                .datum(dta)
                .attr("d", area0)
                .transition()
                .duration(1000)
                .attr("d", area);

            upsel
                .exit()
                .transition()
                .duration(1000)
                .attr("d", area0)
                .remove();
        }

        var m = Math.floor(data.values.length / 2);
        var line0 = d3.svg.line()
            .x(function (d) { return scales.x(d.x); })
            .y(function (d) { return height; });

        var line = d3.svg.line()
            .x(function (d) { return scales.x(d.x); })
            .y(function (d) { return scales.y(d.y); });

        var ids = [m, 0];
        for (var i in ids) {
            var dta = [];
            for (var j in data.timestamps) {
                dta.push({ x: data.timestamps[j], y: data.values[ids[i]][j] });
            }
            var upsel = gPlotArea.selectAll("path.line" + ids[i]).data([{}]);

            upsel
                .datum(dta)
                .transition()
                .duration(1000)
                .attr("d", line);

            upsel.enter().append("path")
                .attr("class", "line" + ids[i])
                .datum(dta)
                .attr("d", line0)
                .transition()
                .duration(1000)
                .attr("d", line);

            upsel
                .exit()
                .transition()
                .duration(1000)
                .attr("d", line0)
                .remove();
        }
        
        function mouseclick(x, useapply) {
            var dur = 1000;
            if (x === undefined) {
                var coords = d3.mouse(gPlotArea[0][0]);
                var x = coords[0];
                if (x < 0)
                    x = 0;
                lastMouseX = x;
                dur = 1;
            }
            var w = scales.x.range()[1];
            if (x > w)
                x = w;
            if ((monthlyTimestamps === undefined) || (monthlyValues.length == 0))
                return;
            var t = scales.x.invert(x);

            var dta = [0, 2, 3, 4, 6].map(function (d) {
                var v = interpolate(t, monthlyTimestamps, monthlyValues[d]);
                return { index: d, timestamp: new Date(t), value: Math.max(v, 0.0) }
            });

            if (mouseclickcallback !== undefined) {
                mouseclickcallback({
                    timestamp: new Date(t),
                    vorstCaseValue: dta[0].value,
                    lowerFiftyPctInterval: dta[1].value,
                    upperFiftyPctInterval: dta[3].value,
                    mostLikelyValue: dta[2].value
                }, useapply);
            }

            var upsel = gPlotArea.selectAll("rect.time")
                .data([{ timestamp: dta[0].timestamp, minvalue: dta[0].value, maxvalue: dta[4].value }]);

            var upsel = gPlotArea.selectAll("rect.time")
                .data([{ timestamp: dta[0].timestamp, minvalue: dta[0].value, maxvalue: dta[4].value }]);

            upsel
                .attr("x", function (d) { return scales.x(d.timestamp) - 1.25; })
                .transition()
                .duration(dur)
                .attr("y", function (d) { return scales.y(d.maxvalue); })
                .attr("height", function (d) { return scales.y(d.minvalue) - scales.y(d.maxvalue); });

            upsel
                .enter()
                .append("rect")
                .attr("class", "time")
                .attr("x", function (d) { return scales.x(d.timestamp) - 1.25; })
                .attr("y", function (d) { return scales.y(d.maxvalue); })
                .attr("width", 2.5)
                .attr("height", function (d) { return scales.y(d.minvalue) - scales.y(d.maxvalue); });

            upsel
                .exit()
                .remove();

            var upsel = gPlotArea.selectAll("circle")
                .data(dta);

            upsel
                .attr("cx", function (d) { return scales.x(d.timestamp); })
                .transition()
                .duration(dur)
                .attr("cy", function (d) { return scales.y(d.value); });

            upsel
                .enter()
                .append("circle")
                .attr("r", "6")
                .attr("class", function (d) { return "c" + d.index; })
                .attr("cx", function (d) { return scales.x(d.timestamp); })
                .attr("cy", function (d) { return scales.y(d.value); });

            upsel
                .exit()
                .remove(); 
        }
        bc.getSvg().on("click", function (x) { mouseclick(x, true); });
        if (lastMouseX === undefined)
            lastMouseX = scales.x.range()[1];
        mouseclick(lastMouseX, false);
    }

    function logNormalMonthlyQuantileForecast(startDate, yearlyMean, yearlyStddev, endTime, quantile, startvalue, monthlysave) {
        var rn = jStat.normal.inv(quantile, 0, 1);
        var time = 0;
        var values = [];
        var timestamps = [];
        var timeseries = [];
        var lastval = startvalue;
        var m = new Date(startDate);

        values.push(lastval);
        timestamps.push(m.valueOf());
        timeseries.push([m.valueOf(), lastval]);
        time = time + 1.0 / 12.0;
        m.setMonth(m.getMonth() + 1);
        //m = m.add(1, 'M');
        var drift = yearlyMean / 12.0;
        var std = yearlyStddev * rn;

        while (m <= endTime) {
            var exp = drift + (Math.sqrt(time) - Math.sqrt(time - 1.0 / 12.0)) * std;
            var val = lastval * Math.exp(exp) + monthlysave;
            values.push(val);
            timestamps.push(m.valueOf());
            //timeseries.push([m.valueOf(), val]);
            lastval = val;
            time = time + 1.0 / 12.0;
            m.setMonth(m.getMonth() + 1);
            //m = m.add(1, 'M');
        }
        return {
            values: values,
            timestamps: timestamps
            //,
            //timeseries: timeseries
        };
    }

    function change(data) {
        var timeSteps = 50;

        var today = new Date();
        today.setHours(0, 0, 0, 0)
        var enddate = new Date(today);
        enddate.setFullYear(enddate.getFullYear() + data.numberOfYears);

        var meanInUse = 0.05;
        var stddevInUse = 0.1;

        var vss = [];
        var quantiles = [0.05, 0.12, 0.25, 0.5, 0.75, 0.88, 0.95];
        var ts = d3.range(today.valueOf(), enddate.valueOf() + 1, (enddate.valueOf() - today.valueOf()) / (timeSteps - 1));
        monthlyTimestamps = undefined;
        monthlyValues = [];
        for (var i in quantiles) {
            var fc = logNormalMonthlyQuantileForecast(today, data.mean, data.volatility, enddate, quantiles[i], data.lumpSum, data.monthlySave);
            if (monthlyTimestamps===undefined)
                monthlyTimestamps = fc.timestamps;
            monthlyValues.push(fc.values);
            var vs = ts.map(function (d) {
                var v = interpolate(d, fc.timestamps, fc.values);
                return Math.max(v, 0.0);
            });
            vss.push(vs);
        }

        bc.change({ timestamps: ts.map(function (v) { return new Date(v); }), values: vss}, changeAxises, changePlotArea);
    }

    return {
        init: init,
        change: change,
        moneyFormat: moneyFormat
    };
}
