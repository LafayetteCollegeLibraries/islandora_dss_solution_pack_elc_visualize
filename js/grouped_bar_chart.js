/**
 * @author griffinj@lafayette.edu
 * Easton Library Company Project
 * A jQuery plug-in for the rendering of univariate analyses
 *
 */

(function($) {

    $.fn.renderSampleLegend = function(target, sampleGroups, margin, colors) {

	$(target).empty();

	var samplesContainer = d3.select(target).append("svg")
	.attr("width", 680 + margin.left + margin.right)
	.attr("height", 8 + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var legend = samplesContainer.selectAll(".legend")
	.data(sampleGroups)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	legend.append("rect")
	.attr("x", 680 - 18)
	.attr("width", 18)
	.attr("height", 18)
	.attr("id", function(d) {

		return d;
	    })
	.attr('class', 'legend-key')
	.style("fill", colors);

	legend.append("text")
	.attr("x", 680 - 24)
	.attr("y", 9)
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.text(function(d) { return d; })
    };

    $.fn.renderGroupedBarChart = function(options) {

	var options = $.extend({

		target: 'div#univariate-visualize',
		variables: [],

	    }, options);

	/**
	 * @author griffinj
	 * The Drupal service simply returns the summation, regardless of our metrics
	 * If the metric is not simply the summation (i. e. arithmetic mean, median...), then a request must be transmitted to the QAS
	 *
	 */
	//$.post('http://qas.lafayette.edu', data, function(data) {
	if(true) {

	    data = options.data.data;
	    metadata = options.data.metadata;
	    metrics = options.data.metrics;

	    // Refactor
	    $(options.yAxis).empty();
	    $(options.target).empty();
	    $(options.target).css('overflow-x', 'none');

	    // Implementing from the example at http://bl.ocks.org/mbostock/3887051

	    var margin = {
		top: 20,
		right: 20,
		bottom: 30,
		left: 40
	    };
	    //var width = 680 - margin.left - margin.right;
	    var width = (680 - margin.left - margin.right);
	
	    if(data.length - 9 > 0) {
		
		width = width + (data.length - 9) * 214;

		// Refactor
		$(options.target).css('overflow-x', 'scroll');
	    }

	    var height = 500 - margin.top - margin.bottom;
	    
	    var x0 = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

	    var x1 = d3.scale.ordinal();
	    
	    var y = d3.scale.linear()
		.range([height, 0]);
	    
	    var color = d3.scale.ordinal()
		//.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
		.range(["#98abc5", "#8a89a6"]);

	    var xAxis = d3.svg.axis()
		.scale(x0)
		.orient("bottom");
	    
	    var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(d3.format(".2s"));

	    var svg = d3.select(options.target).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	    /**
	     *
	     * @todo Refactor for the labeling of metrics
	     *
	     */
	    legendLabels = {

	        components: 'Network Components',
		avgClustering: 'Average Clustering Coefficient',

		sample: 'Sample',
		//aMean: "x\u0304",
		aMean: "Mean",
		//median: 'x\u0303',
		median: 'Median',
		mode: 'Mode',
		//kurtosisPearson: "β\u2082",
		kurtosisPearson: "Kurtosis",
		//kurtosisFisher: "γ\u2081",
		kurtosisFisher: "Kurtosis (Fisher)",
		distribution: 'Distribution'
	    };

	    var tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d) {

			return '<ul>' + d3.entries(metrics[d.sample]).map(function(d) {
				
				return '<li><strong>' + legendLabels[d.key] + '</strong>:&nbsp;<span>' + d.value + '</span></li>';
			    }).reduce(function(v, u) { return v + u }) + '</ul>';
		    });

	    svg.call(tip);

	    x0.domain(data.map(function(d) {

			return d.domain;
		    }));

	    /*
	    x1.domain(groupNames)
                .rangeRoundBands([0, x0.rangeBand()]);
	    */

	    // Set x1 to the band width generated by x1 from ordinal.domain[variableU] (i. e. [ 'groupA', 'groupB', 'groupC' ... ])

	    sampleGroups = data[0].values.map(function(d) {

		    return d.sample;
		});
	    x1.domain(sampleGroups).rangeRoundBands([0, x0.rangeBand()]);
	    color.domain(x1.domain());

	    // Retrieve the maximum of the maximum of all sample groups
	    /*
	    variableU = Object.keys(data.ordinal.range)[0];
	    
	    y.domain([0, d3.max(d3.values(data.ordinal.range[variableU])
				.reduce(function(v, u) {

					return v.concat(u)
					    }))]);
	    */
	    y.domain([0, d3.max(data, function(d) {

			    return d3.max(d.values, function(d) {
				    
				    return d.value })
				})
		    ]);
	    
	    /*
	    entries = d3.entries(data.ordinal.range[variableU]).map(function(d) {

		    return d.value.map(function(val) {

			    return {
				group: d.key,
				value: val
			    }
			})
		}).reduce(function(v, u) {
			
			return v.concat(u)
		    });

	    values = [];

	    j=0;
	    for(i=0; i < entries.length / 2; i++) {

		values[j] = entries[i];
		values[j+1] = entries[i + entries.length / 2];

		j = j+2;
	    }
	    */

	    svg.append('g')
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

	    var yAxisElement = d3.select(options.yAxis).append("svg")
		.attr("width", 64 + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	    
	    //svg.append('g')
	    yAxisElement.append('g')
		.attr("class", "y axis")
		.call(yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text('Domain');

	    var subject = svg.selectAll(".subject")
		//.data(data.ordinal.domain[initKey])
		.data(data)
		.enter().append("g")
		.attr("class", "g")
		//.attr("transform", function(d) { return "translate(" + x0(d.State) + ",0)"; });
		.attr("transform", function(d) { return "translate(" + x0(d.domain) + ",0)"; });
	    //.attr("transform", function(d) { return "translate(32,0)"; });

	    // Refactor
	    /*
	    groupNames = d3.nest().key(function(d) {

		    return d.group;
		}).entries(values).map(function(e) {

			return e.key });
	    */

	    // Set the domain for each nominal group for every sample group
	    subject.selectAll("rect").data(function(d, i) {

		    //return [values.shift(), values.shift()];
		    return d.values;
		})
		.enter().append("rect")
		.attr("x", function(d, i) {

			return x1(i);
		    })
		.attr("y", function(d, i) {

			return y(d.value);
		    })
		.attr("width", x1.rangeBand())
		.attr("height", function(d, i) {
			
			return height - y(d.value);
		    })
		.style("fill", function(d, i) {
			
			return color(d.sample);
		    })
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide);

	    /*
	    var legendContainer = svg.selectAll(".legend-container")
		.append("rect")
		.attr("x", width - 32)
		.attr("width", 24)
		.attr("height", 24)
		.style("fill", '#ffffff');
	    */

	    /*
	    var legend = svg.selectAll(".legend")
		.data(sampleGroups)
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

	    legend.append("rect")
		.attr("x", width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", color);

	    legend.append("text")
		.attr("x", width - 24)
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "end")
		.text(function(d) { return d; });
	    */

	    $(this).renderSampleLegend(options.sampleLegend, sampleGroups, margin, color);
	}
    };
}(jQuery));