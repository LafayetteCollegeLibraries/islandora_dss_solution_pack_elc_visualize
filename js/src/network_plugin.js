/**
 * @author griffinj@lafayette.edu
 * Easton Library Company Project
 * A jQuery plug-in for the rendering of network analyses
 *
 */

(function($) {

    $.fn.renderNetwork = function(options) {

	var options = $.extend({

		target: 'div#network-visualize',
		displayPersons: true,
		displayBibItems: true,
		displayOrgs: true,
		variables: [],
		
	    }, options);

	//var width = 680, height = 500;
	var width = 800, height = 500;

	var labelDistance = 0;

	$(options.target).empty();
	var vis = d3.select(options.target).append("svg:svg").attr("width", width).attr("height", height);

	/**
	 * Organizational membership is an anomalous case
	 * Nodes for organizations (i. e. families, churches, businesses...) are not, themselves, visualized
	 * Instead, sets of links are generated with unique types generated for the organization
	 *
	 * For every organization, an arbitrary node be selected for the construction of paths
	 * Whether or not this node should be arbitrarily chosen carries implications for the data as JSON/CSV/TSV
	 *
	 */

	/**
	 * For testing
	 */

	var nodes = options.data.nodes;
	var links = options.data.links;

	// https://github.com/mbostock/d3/pull/1138#issuecomment-19918150
	// This prepends a unique character to each string (register bug)

	// Instead: https://github.com/mbostock/d3/pull/1138#issuecomment-14803826

	// Map each node type to a color
	nodeColors = d3.scale.category20b()
	.domain(d3.scale.ordinal()
		.domain( nodes.map(function(d) { return d.group }) ).domain());

	// Map each link type to a color
	linkColors = d3.scale.category20c()
	.domain(d3.scale.ordinal()
		.domain( links.map(function(d) { return d.type }) ).domain());

	var labelAnchors = [];	
	var labelAnchorLinks = [];

	/*
	  .linkStrength(function(link) {

	  return link.weight * 10
	  //return link.weight * 5
	  })
	*/

	var force = d3.layout.force()
	.size([width, height])
	.nodes(nodes)
	.links(links)
	.gravity(1)
	//.linkDistance(50 + (0.7 * links.length))
	//.linkDistance(64 * links.length)
	.linkDistance(128 + 8 * links.length)
	//.linkDistance(64 + 8 * links.length)
	//.linkDistance(48 + 8 * links.length)
	//.linkDistance(32 + 1 * links.length)
	//.charge(-3000)
	.charge(-1200)
	.start();

	/**
	 * Force for the actual labels
	 *
	 */
	var force2 = d3.layout
	.force()
	.nodes(labelAnchors)
	.links(labelAnchorLinks)
	.gravity(0)
	.linkDistance(0)
	.linkStrength(8)
	.charge(-100)
	.size([width, height]);

	force2.start();

	/**
	 * Render the edges for the directed graph
	 */
	var link = vis.selectAll("line.link").data(links).enter()
	.append("svg:line")
	.attr("class", function(d) { // Append classes specific to types of relationships

		return 'link link-' + d.type;
	    }).style("stroke", function(d) {

		    return linkColors(d.type);
		});

	/**
	 * Render the nodes for the directed graph
	 */
	var node = vis.selectAll("g.node")
	.data(force.nodes())
	.enter()
	.append("svg:g")
	.attr("class", "node");

	// Render the nodes
	node.append("svg:circle")
	.attr("r", function(d) { // Node size should reflect the type of nodes (organizational persons are larger than human persons)

		/** @todo Refactor */
		if(d.type == 'Church') {

		    return 10;
		}

		return 5;
	    })
	.style("fill", function(d) {

		return nodeColors(d.group);
	    })
	.style("stroke", "#FFF")
	.style("stroke-width", 3)
	.attr('class', function(d, i) { return 'node-' + d.group; }) // Append the classes to the appropriate nodes
	.attr('id', function(d, i) { return 'node-' + d.group + '-' + i; }); // Append the id for each node
	
	// ...and append the text...
	node.append("svg:text").text(function(d) {

		//return d.name;
		return null;
	    })
	.attr("x", 4)
	.attr("y", -3)
	.style("fill", "#555")
	.style("stroke", "#555")
	.style("stroke-width", 0.3)
	.style("font-family", "Arial")
	.style("font-size", 12);

	/**
	 * Initialize the force animation for the nodes
	 */
	node.call(force.drag);

	/*
	var anchorLink = vis.selectAll("line.anchorLink").data(labelAnchorLinks).enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

	var anchorNode = vis.selectAll("g.anchorNode").data(force2.nodes()).enter().append("svg:g").attr("class", "anchorNode");
	anchorNode.append("svg:circle").attr("r", 0).style("fill", "#FFF");
	anchorNode.append("svg:text").text(function(d, i) {

		return i % 2 == 0 ? "" : d.node.label

		    }).style("fill", "#555").style("font-family", "Arial").style("font-size", 12);
	*/

	/**
	 * Link animation
	 *
	 */
	var updateLink = function() {
	    this
	    .attr("x1", function(d) {
		    return d.source.x;
		})
	    .attr("y1", function(d) {
		    return d.source.y;
		})
	    .attr("x2", function(d) {
		    return d.target.x;
		})
	    .attr("y2", function(d) {
		    return d.target.y;
		});
	};

	/**
	 * Node animation
	 */
	var updateNode = function() {
	    this.attr("transform", function(d) {
		    return "translate(" + d.x + "," + d.y + ")";
		});
	};


	force.on("tick", function() {

		force2.start();

		node.call(updateNode);

		/*
		anchorNode.each(function(d, i) {
			if(i % 2 == 0) {
			    d.x = d.node.x;
			    d.y = d.node.y;
			} else {
			    var b = this.childNodes[1].getBBox();

			    var diffX = d.x - d.node.x;
			    var diffY = d.y - d.node.y;

			    var dist = Math.sqrt(diffX * diffX + diffY * diffY);

			    var shiftX = b.width * (diffX - dist) / (dist * 2);
			    shiftX = Math.max(-b.width, Math.min(0, shiftX));
			    var shiftY = 5;
			    this.childNodes[1].setAttribute("transform", "translate(" + shiftX + "," + shiftY + ")");
			}
		    });
		    
		anchorNode.call(updateNode);
		*/

		link.call(updateLink);
		//anchorLink.call(updateLink);
		
	    });

	/**
	 * Legend Labels
	 * @todo Refactor for a Drupal UI component
	 *
	 */
	legendLabels = {

	    human: 'Person',
	    root: 'Root Nodes',
	    Representative: 'Representative',
	    Shareholder: 'Shareholder',
	    Author: 'Author',

	    /**
	     * Fixture data for socioeconomic relationships
	     * @todo Review and finalize
	     */
	    Employee: 'Employee',
	    Servant: 'Servant',

	    /**
	     * Fixture data for familial relationships
	     * @todo Review and finalize
	     */
	    Parent: 'Parent',
	    Child: 'Child',
	    Sibling: 'Sibling',

	    /**
	     * Fixture data for organizational relationships
	     * @todo Review and finalize
	     */
	    Church: 'Church',

	    manifestation: 'Item',
	    item: 'Item',
	    book: 'Book',
	    periodical: 'Periodical',
	    artifact: 'Other Item',

	    representative: 'Representative of',
	    shareholder: 'Shareholder of',

	    /**
	     * Fixture data for familial relationships
	     * @todo Review and finalize
	     */
	    isParentOf: 'Parent of',
	    isChildOf: 'Child of',
	    isSiblingOf: 'Sibling of',

	    /**
	     * Fixture data for organizational relationships
	     * @todo Review and finalize
	     */
	    isMemberOf: 'Member of',

	    /**
	     * Fixture data for socioeconomic relationships
	     * @todo Review and finalize
	     */
	    hasEmployee: 'Employee of',
	    hasServant: 'Servant of',

	    borrowedFor: 'Borrowed for',
	    borrowedBy: 'Borrowed by',

	    businessAMembership: 'Members of Business A',
	    familyAMembership: 'Members of Family A',
	    churchAMembership: 'Members of Church A',

	    components: 'Network Components',
	    avgClustering: 'Average Clustering Coefficient'
	};

	/**
	 * Render linkLegend
	 *
	 */
	var linkLegend = vis.selectAll(".linkLegend")
	.data(linkColors.domain())
	.enter().append("g")
	.attr("class", "linkLegend")
	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
	linkLegend.append("rect")
	//.attr("x", width / (0.5 * linkColors.domain().length) + 8)
	.attr("x", width / (0.5 * linkColors.domain().length) + 8 - 164)
	//.attr("y", height - (21 * linkColors.domain().length))
	.attr("y", linkColors.domain().length - 6)
	.attr("width", 18)
	.attr("height", 18)
	.style("fill", linkColors);

	linkLegend.append("text")
	//.attr("x", width / (0.5 * linkColors.domain().length))
	.attr("x", width / (0.5 * linkColors.domain().length) - 164)
	//.attr("y", height - (20 * linkColors.domain().length))
	.attr("y", linkColors.domain().length + 2)
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.text(function(d) {
		return legendLabels[d];
	    });

	/**
	 * Render nodeLegend
	 *
	 */
	var nodeLegend = vis.selectAll(".nodeLegend")
	.data(nodeColors.domain())
	.enter().append("g")
	.attr("class", "nodeLegend")
	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
	    
	nodeLegend.append("rect")
	.attr("x", width - 18)
	.attr("width", 18)
	.attr("height", 18)
	.style("fill", nodeColors)
	.attr('class', function(d) { /** Append the appropriate class(es) for the legend key @todo Refactor for color mapping */

		return 'nodeLegend' + legendLabels[d];
	    });
	    
	nodeLegend.append("text")
	.attr("x", width - 24)
	.attr("y", 9)
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.text(function(d) {
		
		return legendLabels[d];
	    });

	// The network metrics
	metrics = {

		   components: 2,
		   avgClustering: 0.123
	};

	metricsColors = d3.scale.category10().domain(d3.keys(metrics));

	/**
	 * Disabled in compliance with EDDC-213
	 * @todo Identify where best to render the network metrics
	 *
	 */
	/*
	var metricsLegend = vis.selectAll(".metricsLegend")
	.data(metricsColors.domain())
	.enter().append("g")
	.attr("class", "metricsLegend")
	.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
	metricsLegend.append("text")
	.attr("x", width)
	.attr("y", height - (20 * metricsColors.domain().length))
	.attr("dy", ".35em")
	.style("text-anchor", "end")
	.style("fill", metricsColors)
	.text(function(d) {

		return legendLabels[d] + ': ' + metrics[d];
	    });
	*/
    };


    $.fn.elcNetworkMetrics = function(options) {

	// This is the easiest way to have default options.
	var settings = $.extend({

		target: 'div#network-visualize',
	    }, options);

	return this.each(function(i, element) {
		
	    });
    };
}(jQuery));