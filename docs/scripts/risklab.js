angular.module('risklab', ['ui.bootstrap-slider'])
	.controller('ctrl', ['$scope', '$sce', function ($scope, $sce) {

    $scope.riskLabResult = JSON.parse($("script#risklabresult").html());

    //$scope.allocationWeightsSliderEnabled = "false";
    //if ($scope.riskLabResult.id == null)
    //    $scope.allocationWeightsSliderEnabled = "true";

    $scope.timeFrame = $scope.riskLabResult.feedback.timeFrame;
    $scope.riskLevel = $scope.riskLabResult.feedback.riskLevel;

	$scope.lumpSumSliderOptions = {
	    min: 0,
	    max: 33,
	    step: 1,
	}

	$scope.monthlySaveSliderOptions = {
	    min: -31,
	    max: 31,
	    step: 1,
	}

	$scope.calcLumpSum = function (d) {
	    var v = parseInt(d);
	    var p = Math.pow(10.0, (v % 10.0) / 10.0);
	    var r = Math.round(4.0 * p) / 4.0;
	    var a = Math.pow(10.0, 4 + Math.floor(v / 10.0));
	    return r * a;
	}

	$scope.calcMonthlySave = function (d) {
	    var v = parseInt(d);
	    var s = Math.sign(v);
	    if (Math.abs(v) <= 2)
	        return 50.0 * v;
	    v = Math.abs(v) - 1;
	    var p = Math.pow(10.0, (v % 10.0) / 10.0);
	    var r = Math.round(4.0 * p) / 4.0;
	    var a = Math.pow(10.0, 2 + Math.floor(v / 10.0));
	    return s * r * a;
	}

	function getIndex(target, istart, iend, fun) {
	    var mind = -1;
	    var mini = -1;
	    for (var i = istart; i <= iend; i++) {
	        var s = fun(i);
	        var d = Math.abs(s - target);
	        if ((mind==-1) || (d<mind)) {
	            mind = d;
	            mini = i;
	        }
	    }
	    return mini;
	}

	$scope.useInitialLumpSum = true;
	$scope.lumpSumIndex = getIndex($scope.riskLabResult.feedback.lumpSum, $scope.lumpSumSliderOptions.min, $scope.lumpSumSliderOptions.max, $scope.calcLumpSum); // 100 000 kr
	$scope.useInitialMonthlySave = true;
	$scope.monthlySaveIndex = getIndex($scope.riskLabResult.feedback.monthlySave, $scope.monthlySaveSliderOptions.min, $scope.monthlySaveSliderOptions.max, $scope.calcMonthlySave); // 0 kr

	$scope.sendFeedback = function () {
	    var lumpsum;
	    if ($scope.useInitialLumpSum)
	        lumpsum = $scope.riskLabResult.feedback.lumpSum;
	    else
	        lumpsum = $scope.calcLumpSum($scope.lumpSumIndex);
	    var monthlysave;
	    if ($scope.useInitialMonthlySave)
	        monthlysave = $scope.riskLabResult.feedback.monthlySave;
	    else
	        monthlysave = $scope.calcMonthlySave($scope.monthlySaveIndex);
	    var url = "/risklab/feedback/?risklevel=" + $scope.riskLevel +
            "&lumpsum=" + lumpsum +
            "&monthlysave=" + monthlysave +
            "&timeframe=" + $scope.timeFrame;
	    $.get(url, function (data, status) {
	    });
	}

	$scope.allocationModel = JSON.parse($("script#allocationmodel").html());
	$scope.assets = $scope.allocationModel.assets;
	$scope.allocationNames = $scope.allocationModel.assets.map(function (d) { return d.name });
	//for (var i = 0; i < $scope.assets.length; i++) {
	//    $scope.allocationNames.push($scope.assets[i].name);
	//}
	var s = JSON.parse($("script#session").html());
	$scope.id = s.sessionId;

	$scope.currentSlider = -1;
	$scope.startAllocationWeights = [];
	$scope.lastAllocationWeights = [];

	$scope.forcastchartMouseclickApply = function (d) {
	    $scope.forcasttimestamp = d.timestamp.format("mmm yyyy");
	    $scope.vorstcasevalue = $scope.forcastchart.moneyFormat(d.vorstCaseValue);
	    $scope.lowerfiftypctinterval = $scope.forcastchart.moneyFormat(d.lowerFiftyPctInterval);
	    $scope.upperfiftypctinterval = $scope.forcastchart.moneyFormat(d.upperFiftyPctInterval);
	    $scope.mostlikelyvalue = $scope.forcastchart.moneyFormat(d.mostLikelyValue);
	}

	$scope.forcastchartMouseclick = function (d, useapply) {
	    if (useapply)
	        $scope.$apply(function () { $scope.forcastchartMouseclickApply(d); });
	    else 
	        $scope.forcastchartMouseclickApply(d);
	}

	$scope.riskGaugeClick = function (d) {
	    $scope.$apply(function () {
	        $scope.riskLevel = d.toFixed(0)
	        $scope.riskLevelChange(0);
	    });
	}

	function initCharts() {
	    $scope.riskGauge = new RiskGauge("#riskgauge1");
	    $scope.riskGauge.configure({ mouseclick: $scope.riskGaugeClick });
	    $scope.riskGauge.render($scope.riskLevel);

	    $scope.piechart = new PieChart();
	    $scope.piechart.init('#assetpiechart', { widthHeightRatio: 1.0, scaleFactor: 1.0, showLabels: false });

	    $scope.forcastchart = new GrowthForecastChart();
	    $scope.forcastchart.init("#gfchart1", { widthHeightRatio: 1.8, mouseclick: $scope.forcastchartMouseclick });

	    $scope.barchart = new ReturnsBarChart();
	    $scope.barchart.init('#barchart1', { widthHeightRatio: 1.8});

	    $scope.maxdrawdownchart = new MaxDrawdownChart();
	    $scope.maxdrawdownchart.init("#maxdrawdown1", { widthHeightRatio: 1.8 });
	}
	initCharts();

	$scope.maxdrawdowntext = "Största nedgången";
	$scope.returnstext = "Årsvis avkastning";

	var n = $scope.assets.length;
	$scope.count = n;
	//$scope.returns = [];
	$scope.allocationWeights = [];
	for (var i = 0; i < $scope.count; i++) {
	    $scope.allocationWeights.push(0.0);
	    //$scope.returns.push(convertTimeSeries2($scope.assets[i].yearReturns, "yyyy"));
	    convertTimeSeries2($scope.assets[i].monthValues, "mmm yy");
	}

	$scope.lumpSumSlideFormatter = function (value) {
	    var v;
	    if ($scope.useInitialLumpSum)
	        v = $scope.riskLabResult.feedback.lumpSum;
	    else
	        v = $scope.calcLumpSum(value);
	    return v.toLocaleString() + " kr";
	}

	$scope.monthlySaveSlideFormatter = function (value) {
	    var v;
	    if ($scope.useInitialMonthlySave)
	        v = $scope.riskLabResult.feedback.monthlySave;
	    else
	        v = $scope.calcMonthlySave(value);
	    return v.toLocaleString() + " kr";
	}

	$scope.percentSlideFormatter = function (value, digits) {
	    var s = String((100.0 * parseFloat(value)).toFixed((digits === undefined) ? 0 : digits)) + "%";
	    s = s.replace(".", ",");
	    return s;
	}

	$scope.updateCharts = function () {
	    $scope.piechart.changeData($scope.allocationWeights.map(function (value, index) { return { label: $scope.allocationNames[index], value: value }; }));

	    var vals = weightedMonthValues($scope.allocationWeights, $scope.assets);
	    var yearts = [];
	    var yearvs = [];
	    var r0;
	    for (var i = 0; i < vals.length; i+=12) {
	        if (r0 === undefined)
	            r0 = vals[i].value;
	        else {
	            yearts.push(vals[i].timestamp);
	            var r1 = vals[i].value;
	            yearvs.push(r1 / r0 - 1.0);
	            r0 = r1;
            }
	    }

	    //var rets = weightedReturns($scope.allocationWeights, $scope.returns);
	    var rets = { timestamps: yearts, values: yearvs };
	    var minYear;
	    var maxYear = -1;
	    for (var i in rets.values) {
	        var y = rets.timestamps[i].getFullYear();
	        if (minYear === undefined)
	            minYear = y;
	        else if (y<minYear)
	            minYear = y;
	        if (maxYear === undefined)
	            maxYear = y;
	        else if (y > maxYear)
	            maxYear = y;
	    }

	    $scope.minyeartext = $sce.trustAsHtml(minYear.toFixed(0));
	    $scope.maxyeartext = $sce.trustAsHtml(maxYear.toFixed(0));
	    $scope.barchart.change(rets);
	    var minmax = $scope.barchart.getMinMax();
	    $scope.bestyearvalue = $sce.trustAsHtml(minmax.maxDate);
	    $scope.vorstyearvalue = $sce.trustAsHtml(minmax.minDate);
	    $scope.bestyeartext = $sce.trustAsHtml("<span class=\"keyfigure" + ((minmax.maxReturn > 0) ? " positive" : " negative") + "\">" + $scope.percentSlideFormatter(minmax.maxReturn) + "</span>");
	    $scope.vorstyeartext = $sce.trustAsHtml("<span class=\"keyfigure" + ((minmax.minReturn > 0) ? " positive" : " negative") + "\">" + $scope.percentSlideFormatter(minmax.minReturn) + "</span>");

	    var avg = Math.exp(Math.log(vals[vals.length - 1].value / vals[0].value) / ((vals.length - 1.0) / 12.0))- 1.0;
	    $scope.averagereturnvalue = $scope.percentSlideFormatter(avg, 1);

	    var rets = calcReturns(vals);
	    var md = maxDrawdown(rets);
	    $scope.maxdrawdowntimespantext = $sce.trustAsHtml("Största nedgången<br />" + vals[md.startIndex + 1].timestamp.format("mmm yyyy") + " till " + vals[md.endIndex + 1].timestamp.format("mmm yyyy"));
	    $scope.maxdrawdownvaluetext = $sce.trustAsHtml("<span class=\"keyfigure negative\">" + $scope.percentSlideFormatter(md.value) + "</span>");
	    var data = {
	        timeseriesItems: vals,
	        startIndex: md.startIndex + 1,
	        endIndex: md.endIndex + 1
	    };
	    $scope.maxdrawdownchart.change(data);

	    var std = calcStdev(vals) * Math.sqrt(12.0);
	    $scope.stdevvalue = $scope.percentSlideFormatter(std);

	    $scope.forcastchart.change({
	        numberOfYears: parseFloat($scope.timeFrame),
	        lumpSum: $scope.calcLumpSum($scope.lumpSumIndex),
	        monthlySave: $scope.calcMonthlySave($scope.monthlySaveIndex),
            mean: avg,
	        volatility: std
	    });
	}

	$scope.setAllocationWeights = function () {
	    var n = $scope.count;
	    var r = parseFloat($scope.riskLevel);
	    //if ($scope.allocationWeights.length != n) {
	    //    for (var i = 0; i < n; i++)
	    //        $scope.allocationWeights.push(0.0);
	    //}
	    //for (var i in $scope.allocationWeights)
	    //    $scope.allocationWeights[i] = 1.0 * (((parseFloat(i) + r) % n) + 1.0) / (n * (n + 1.0) / 2.0);
	    $scope.allocationWeights = $scope.allocationModel.allocations[r].weights.slice();
	    //for (var i = 0; i < n; i++)
	    //    $scope.allocationWeights.push($scope.allocationModel.allocations[r].weights[i]);
	}

	$scope.riskLevelChange = function (d, feedback) {
	    var r = parseInt($scope.riskLevel);
	    r = Math.max(Math.min(r + d, 10), 0);
	    $scope.riskGauge.update(r);
	    $scope.riskLevel = r.toFixed(0);

	    $scope.currentSlider = -1;

	    $scope.setAllocationWeights();
	    $scope.lastAllocationWeights = $scope.allocationWeights.slice();
	    if (feedback || (typeof feedback === 'undefined'))
	        $scope.sendFeedback();
	    $scope.updateCharts();
	};
	$scope.riskLevelChange(0, false);

	$scope.allocationChange = function (n) {
	    if (n != $scope.currentSlider) {
	        $scope.startAllocationWeights = $scope.lastAllocationWeights.slice();
	        $scope.currentSlider = n;
	    }
	    if (($scope.count > 1) && ($scope.currentSlider != -1)) {
	        var m = $scope.currentSlider;
	        var v0 = parseFloat($scope.startAllocationWeights[m]);
	        var v1 = parseFloat($scope.allocationWeights[m]);
	        var t = 0.0;
	        for (var i in $scope.startAllocationWeights) {
	            if (i!=m)
	                t += parseFloat($scope.startAllocationWeights[i]);
	        }
	        var f;
	        if (t < 1e-6) {
	            f = (1.0 - v1) / ($scope.count - 1);
	        }
	        else {
	            f = (1.0 - v1) / (1.0 - v0);
	        }
	        for (var i in $scope.allocationWeights) {
	            if (i != m) {
	                if (t < 1e-6)
	                    $scope.allocationWeights[i] = f;
	                else
	                    $scope.allocationWeights[i] = f * parseFloat($scope.startAllocationWeights[i]);
	            }
	        }
	    }
	    $scope.lastAllocationWeights = $scope.allocationWeights.slice();
	    $scope.updateCharts();
	}

	$scope.allocationWeightsSliderOptions = {
	    min: 0,
	    max: 1,
	    step: 0.01,
	}

	$scope.timeFrameSliderOptions = {
	    min: 1,
	    max: 40,
	    step: 1,
	}

	$scope.timeFrameChange = function (d) {
	    if (d !== undefined) {
	        var t = parseInt($scope.timeFrame);
	        $scope.timeFrame = Math.max(Math.min(t + d, $scope.timeFrameSliderOptions.max), $scope.timeFrameSliderOptions.min);
	    }
	    $scope.sendFeedback();
	    $scope.updateCharts();
	};

	$scope.lumpSumChange = function () {
	    $scope.useInitialLumpSum = false;
	    $scope.sendFeedback();
	    $scope.updateCharts();
	}

	$scope.monthlySaveChange = function () {
	    $scope.useInitialMonthlySave = false;
	    $scope.sendFeedback();
	    $scope.updateCharts();
	}
}]);

