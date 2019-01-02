Math.sign = Math.sign || function (x) {
    x = +x; // convert to a number
    if (x === 0 || isNaN(x)) {
        return x;
    }
    return x > 0 ? 1 : -1;
}

function calcReturns(data) {
    var res = [];
    var r0 = null;
    for (var i in data) {
        if (!r0)
            r0 = data[0].value;
        else {
            var r1 = data[i].value;
            res.push(r1 / r0 - 1.0);
            r0 = r1;
        }
    }
    return res;
}

function calcStdev(data) {
    var rs = [];
    var r0;
    for (var i in data) {
        if (r0 === undefined)
            r0 = data[0].value;
        else {
            var r1 = data[i].value;
            rs.push(Math.log(r1 / r0));
            r0 = r1;
        }
    }
    return jStat.stdev(rs, true);
}

function maxDrawdown(returns) {
    var v = 1.0;
    var max = 1.0;
    var maxindex = -1;
    var resetmin = 1.0;
    var drawdown = 0.0;
    var maxdrawdown = 0.0;
    var startindex = -1;
    var endindex = -1;
    for (i in returns) {
        v *= 1.0 + returns[i];
        if (v > max) {
            max = v;
            maxindex = parseInt(i);
            resetmin = v;
            drawdown = resetmin / max - 1.0;
        }
        else if (v < resetmin) {
            resetmin = v;
            drawdown = resetmin / max - 1.0;
        }
        if (drawdown < maxdrawdown) {
            maxdrawdown = drawdown;
            startindex = maxindex;
            endindex = parseInt(i);
        }
    }
    return { startIndex: startindex, endIndex: endindex, value: maxdrawdown };
}

function indexOf(x, xs) {
    var i;
    var n = xs.length;
    if (n == 0)
        return -1;
    else if (x < xs[0])
        return -1;
    else if (x >= xs[n - 1])
        return n - 1;

    if (n > 40) { //Binary search if >40 (otherwise it's no gain using it)     
        var hi = n - 1;
        var low = 0;
        if (x >= xs[hi])
            return hi;
        while (hi > (low + 1)) {
            i = Math.floor((hi + low) / 2);
            if (x >= xs[i])
                low = i;
            else {
                hi = i;
                i = low;
            }
        }
        return i;
    }
    else { //Incremental search  
        i = 1;
        while ((x >= xs[i]) && (i < (n - 1)))
            i++;
        return i - 1;
    }
}

function interpolate(x, xs, ys) {
    var k = indexOf(x, xs);
    if (k < 0)
        return ys[0];
    if (k >= (ys.length - 1))
        return ys[ys.length - 1];
    var t = (x - xs[k]) / (xs[k + 1] - xs[k]);
    return (1.0 - t) * ys[k] + t * ys[k + 1];
}

var parseDate = d3.time.format("%Y-%m-%d").parse;

//Converts hash of two arrays (string-array timestamps and double-array values) to array of hashs (each with keys: label, timestamp, value). label is formatted with fmt
function convertTimeSeries(ts, fmt) {
    var ds = ts.timestamps;
    var vs = ts.values;
    var res = [];
    for (var i in ds) {
        //var d = new Date(parseInt(ds[i].substr(6)));
        d = parseDate(ds[i].substr(0, 10));
        ds[i] = d;
        res.push({ label: d.format(fmt), timestamp: d, value: vs[i] });
    }
    return res;
}

function convertTimeSeries2(ts, fmt) {
    ts.labels = [];
    for (var i in ts.timestamps) {
        d = ts.timestamps[i];
        if (!(d instanceof Date)) {
            d = parseDate(ts.timestamps[i].substr(0, 10));
            ts.timestamps[i] = d;
        }
        ts.labels.push(d.format(fmt));
    }
    return ts;
}

//weights is array of weights
//values is array of return array
//length of weights must equals length of values
//each array in data must have equal length
function weightedReturns(weights, data) {
    var rets = [];
    for (var i in data[0].values) {
        var r = 0.0;
        for (var j in weights)
            r += weights[j] * data[j].values[i];
        rets.push(r);
    }
    var res = {};
    res.timestamps = data[0].timestamps;
    res.values = rets;
    return res;
}

function weightedMonthValues(weights, assets) {
    var v0 = 100.0;
    var vs = [];
    var res = [];
    for (var i in assets[0].monthValues.timestamps) {
        if (vs.length == 0) {
            vs.push(v0);
            res.push({ label: assets[0].monthValues.labels[0], timestamp: assets[0].monthValues.timestamps[0], value: v0 });
        }
        else {
            var r = 0;
            for (var j in weights)
                r += weights[j] * (assets[j].monthValues.values[i] / assets[j].monthValues.values[i - 1] - 1.0);
            var v1 = v0 * (1 + r);
            vs.push(v1);
            res.push({ label: assets[0].monthValues.labels[i], timestamp: assets[0].monthValues.timestamps[i], value: v1 });
            v0 = v1;
        }
    }
    //return { labels: assets[0].monthValues.labels, timestamps: assets[0].monthValues.timestamps, values: vs };
    return res;
}

function randomData(data, std) {
    data.returns = [];
    for (var i in data.labels)
        data.returns.push(std * (2 * Math.random() - 1));
}

function randomDatas(n, labels, std) {
    var res = [];
    for (var i = 0; i < n; i++) {
        var d = {};
        d.labels = labels;
        d.returns = [];
        randomData(d, std);
        res.push(d);
    }
    return res;
}