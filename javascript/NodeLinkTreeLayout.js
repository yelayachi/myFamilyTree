/* See license.txt for terms of usage */


/*
 * Layout that places nodes using a tidy layout of a node-link tree
 * diagram. This algorithm lays out a rooted tree such that each
 * depth level of the tree is on a shared line. The orientation of the
 * tree can be set such that the tree goes left-to-right (default),
 * right-to-left, top-to-bottom, or bottom-to-top.
 * 
 * The algorithm used is that of Christoph Buchheim, Michael J�nger,
 * and Sebastian Leipert from their research paper 'Improving Walker's 
 * Algorithm to Run in Linear Time', Graph Drawing 2002,
 * (http://citeseer.ist.psu.edu/buchheim02improving.html).
 * 
 * This algorithm corrects performance issues in Walker's algorithm, which
 * generalizes Reingold and Tilford's method for tidy drawings of trees to
 * support trees with an arbitrary number of children at any given node.
 * 
 * This is a javascript port of the ActionScript code provided in the
 * prefuse.flare toolkit of Jeffrey Heer.
 */	


FBL.ns(function() { with (FBL) {

	
// ************************************************************************************************
// Constants

/** Constant indicating a left-to-right layout orientation. */
const LEFT_TO_RIGHT = 1;

/** Constant indicating a right-to-left layout orientation. */
const RIGHT_TO_LEFT = 2;

/** Constant indicating a top-to-bottom layout orientation. */
const TOP_TO_BOTTOM = 3;

/** Constant indicating a bottom-to-top layout orientation. */
const BOTTOM_TO_TOP = 4;




// ************************************************************************************************

/**
 * Creates a new NodeLinkTreeLayout.
 * @constructor
 * @param tree The tree to layout.
 * @param orientation The orientation of the layout.
 * @param depthSpace The space between depth levels in the tree.
 * @param breadthSpace The space between siblings in the tree.
 * @param subtreeSpace The space between different sub-trees.
 * @param layoutAnchorX The x-coordinate of the initial focal point. 
 * @param layoutAnchorY The y-coordinate of the initial focal point.
 */		
Firebug.NodeLinkTreeLayout = function(tree, orientation, depthSpace, breadthSpace, subtreeSpace, layoutAnchorX, layoutAnchorY)
{
	// Call super-class constructor. 
	Firebug.TreeLayout.apply(this, arguments);

	// Initialize attributes.
	this.root = tree ? tree.visualRoot : null;
	
	this.orient = orientation ? orientation : BOTTOM_TO_TOP;
	this.dspace = depthSpace ? depthSpace : 21;
	this.bspace = breadthSpace ? breadthSpace : 4;
	this.tspace = subtreeSpace ? subtreeSpace : 4;

	this.depths = new Array(); 
    this.maxDepth = 0;

    // Determine initial focal point.
	var anchor = this.getLayoutAnchor(tree);
	this.ax = layoutAnchorX ? layoutAnchorX : anchor.x;
	this.ay = layoutAnchorY ? layoutAnchorY : anchor.y;
};


/**
 * Global constants.
 */ 

Firebug.NodeLinkTreeLayout.LEFT_TO_RIGHT = LEFT_TO_RIGHT;
Firebug.NodeLinkTreeLayout.RIGHT_TO_LEFT = RIGHT_TO_LEFT;
Firebug.NodeLinkTreeLayout.TOP_TO_BOTTOM = TOP_TO_BOTTOM;
Firebug.NodeLinkTreeLayout.BOTTOM_TO_TOP = BOTTOM_TO_TOP;

	

/**
 * Layout that places nodes using a tidy layout of a node-link tree
 * diagram. This algorithm lays out a rooted tree such that each
 * depth level of the tree is on a shared line. The orientation of the
 * tree can be set such that the tree goes left-to-right (default),
 * right-to-left, top-to-bottom, or bottom-to-top.
 * 
 * The algorithm used is that of Christoph Buchheim, Michael J�nger,
 * and Sebastian Leipert from their research paper 'Improving Walker's 
 * Algorithm to Run in Linear Time', Graph Drawing 2002,
 * (http://citeseer.ist.psu.edu/buchheim02improving.html).
 * This algorithm corrects performance issues in Walker's algorithm, which
 * generalizes Reingold and Tilford's method for tidy drawings of trees to
 * support trees with an arbitrary number of children at any given node.
 * 
 * This is a javascript port of the ActionScript code provided in the
 * prefuse.flare toolkit of Jeffrey Heer.
 */
Firebug.NodeLinkTreeLayout.prototype = extend(Firebug.TreeLayout.prototype,
{
	/**
     * Computes the positions of the nodes (and links) of a tree. 
     * 
     * @param tree The tree for which the new layout shall be computed.
     * @param layoutAnchorX The x-coordinate of the initial focal point (OPTIONAL).
     * @param layoutAnchorY The y-coordinate of the initial focal point (OPTIONAL).
     */
    layout: function(/* VisualTree */ tree, layoutAnchorX, layoutAnchorY) 
    {
   		// Initialize attributes.
		this.root = tree.visualRoot;
		var panelCenterX = Math.floor(tree.panel.panelNode.offsetWidth / 2);
		var panelCenterY = Math.floor(tree.panel.panelNode.offsetHeight / 2);		

		this.ax = layoutAnchorX ? layoutAnchorX : panelCenterX;
		this.ay = layoutAnchorY ? layoutAnchorY : panelCenterY;
		
		// Predefine depths.
		for (var i = 0; i < 50; i++)
			this.depths[i] = 0;

		// Set root parameters.
       	var rp = this.params(this.root);
        
        // First pass - compute breadth information, collect depth info.
        this.firstWalk(this.root, 0, 1);

       	// Sum up the depth info.
       	this.determineDepths();

       	// Second pass - assign layout positions.
        this.secondWalk(this.root, null, -rp.prelim, 0, true, null, 0);
    },
    
   	/**
	 * Based on the currently selected node, returns the next node given an arrow key.
	 * 
	 * @param {Firebug.Node} node The currently selected node.
	 * @param {"up", "down", "left", "right"} dir The arrow key that has been pressed.
	 * @returns {Firebug.Node} The next node that shall be selected.
	 */    
    getNextNodeBy: function(node, dir)
    {
    	switch (this.orient) {
    		case LEFT_TO_RIGHT:
		        if (dir == "up")
        		    return (node == this.root) ? null : node.previousSibling;
		        else if (dir == "down")
					return (node == this.root) ? null : node.nextSibling;
				else if (dir == "left") 
            		return (node == this.root) ? null : node.parentNode;
		        else if (dir == "right")
    	        	return (node.expanded && node.firstChild) ? node.firstChild : null;
    	        else 
    	        	return;
			case RIGHT_TO_LEFT:
		        if (dir == "up")
        		    return (node == this.root) ? null : node.previousSibling;
		        else if (dir == "down")
					return (node == this.root) ? null : node.nextSibling;
				else if (dir == "left")
    	        	return (node.expanded && node.firstChild) ? node.firstChild : null;
		        else if (dir == "right")
            		return (node == this.root) ? null : node.parentNode;
    	        else 
    	        	return;
			case TOP_TO_BOTTOM:
		        if (dir == "up")
            		return (node == this.root) ? null : node.parentNode;
		        else if (dir == "down")
    	        	return (node.expanded && node.firstChild) ? node.firstChild : null;
				else if (dir == "left")
        		    return (node == this.root) ? null : node.previousSibling;
		        else if (dir == "right")
					return (node == this.root) ? null : node.nextSibling;
    	        else 
    	        	return;
			case BOTTOM_TO_TOP:
		        if (dir == "up")
    	        	return (node.expanded && node.firstChild) ? node.firstChild : null;
		        else if (dir == "down")
            		return (node == this.root) ? null : node.parentNode;
				else if (dir == "left")
        		    return (node == this.root) ? null : node.previousSibling;
		        else if (dir == "right")
					return (node == this.root) ? null : node.nextSibling;
    	        else 
    	        	return;
			default:
				throw "Firebug.NodeLinkTreeLayout.getNextNodeBy: Unrecognized orientation value.";
				return node;
    	}
    },
    
   	/**
	 * Returns the anchor of the layout.
	 * 
	 * @param {VisualTree} tree The tree for which the layout anchor shall be returned.
	 * @returns The anchor of the layout (ie. an object with x and y positions).
	 */    
    getLayoutAnchor: function(/* VisualTree */ tree)
    {
   		var layoutWidth = tree ? tree.panel.document.documentElement.clientWidth : 400;
		var layoutHeight = tree ? tree.panel.document.documentElement.clientHeight : 300;

	    // Determine initial focal point.
		switch (this.orient) {
			case LEFT_TO_RIGHT:
	    		var centerX = Math.floor(layoutWidth / 5);
	    		var centerY = Math.floor(layoutHeight / 2);
				break;
			case RIGHT_TO_LEFT:
	    		var centerX = Math.floor(layoutWidth * 4 / 5);
	    		var centerY = Math.floor(layoutHeight / 2);
				break;
			case TOP_TO_BOTTOM:
	    		var centerX = Math.floor(layoutWidth / 2);
	    		var centerY = Math.floor(layoutHeight / 5);
				break;
			case BOTTOM_TO_TOP:
	    		var centerX = Math.floor(layoutWidth / 2);
	    		var centerY = Math.floor(layoutHeight * 4 / 5);
				break;
			default:
				throw "Firebug.NodeLinkTreeLayout.NodeLinkTreeLayout: Unrecognized orientation value.";
	    		var centerX = Math.floor(layoutWidth / 2);
	    		var centerY = Math.floor(layoutHeight / 2);
		}
		
    	return {x: centerX , y: centerY};
    },

    
    /**
     * Sets the orientation of the layout.
     * 
     * @param orientation The orientation of the layout (left-to-right, right-to-left, top-to-bottom, bottom-to-top).
     */
    setOrientation: function(orientation)
    {
    	switch (orientation) {
    		case LEFT_TO_RIGHT:
    			this.orient = LEFT_TO_RIGHT;
				break;
			case RIGHT_TO_LEFT:
				this.orient = RIGHT_TO_LEFT;
				break;
			case TOP_TO_BOTTOM:
				this.orient = TOP_TO_BOTTOM;
				break;
			case BOTTOM_TO_TOP:
				this.orient = BOTTOM_TO_TOP;
			default:
				return; 
    	}
    },
    
    /**
     * Sets the distance between two neighbouring layers in the tree in pixel.
     * 
     * @param depthSpace The distance of the layers (in pixel).
     */
    setDepthSpace: function(depthSpace)
    {
   		this.dspace = depthSpace ? depthSpace : 21;
    },
    
    // Private functions.
    
    
    firstWalk: function(/* Node */ node, /* int */ num, /* uint */ depth)
    {
    	var np = this.params(node);
    	np.number = num;
    	this.updateDepths(depth, node);
    		
    	var expanded = node.expanded;
    	
    	if (!node.firstChild || !expanded) // is leaf
    	{
    		var l = node.previousSibling;
	    	if (l == null)
	    		np.prelim = 0;
	    	else {
	    		var lp = this.params(l);
	    		np.prelim = lp.prelim + this.spacing(l, node, true);
	    	}
    	}
    	else if (node.firstChild && expanded) // has children, is expanded
    	{
    		var left = node.firstChild; // first child
    		var right = node.lastChild; //last child
    		var ancestor = left;
			var c = left;
    		
    		for (var i = 0; c; ++i, c = c.nextSibling) 
    		{
    			this.firstWalk(c, i, depth + 1);
    			ancestor = this.apportion(c, ancestor);
    		}
    		
    		this.executeShifts(node);
    		
    		var leftp = this.params(left);
    		var rightp = this.params(right);
    		var midpoint = 0.5 * (leftp.prelim + rightp.prelim);
    			
    		var l = node.previousSibling;
    		if (l != null) { // Not first among siblings
    			var lp = this.params(l);
    			np.prelim = lp.prelim + this.spacing(l, node, true);
    			np.mod = np.prelim - midpoint;
    		} else { // First among siblings
    			np.prelim = midpoint;
    		}
    	}
    },
    
    apportion: function(/* Node */ v, /* Node */ a)
    {
    	var w = v.previousSibling;
    	if (w != null) {

    		// Nodes.
			var vip = v;
			var vop = v;
			var vim = w;
			var vom = vip.parentNode.childNodes[0];
			
			// Params.
			var vipp = this.params(vip);
			var vopp = this.params(vop);
			var vimp = this.params(vim);
			var vomp = this.params(vom);

			// Numbers.
			var sip = vipp.mod;
			var sop = vopp.mod;
			var sim = vimp.mod;
			var som = vomp.mod;
			
			var shift;
			var nr = this.nextRight(vim);
			var nl = this.nextLeft(vip);
			while (nr != null && nl != null) {
				vim = nr;
				vip = nl;
				vom = this.nextLeft(vom);
				vop = this.nextRight(vop);
				vopp = this.params(vop);
				vopp.ancestor = v;
				vimp = this.params(vim);
				vipp = this.params(vip);
				shift = (vimp.prelim + sim) - (vipp.prelim + sip) + this.spacing(vim, vip, false);
				
				if (shift > 0) {
					this.moveSubtree(this.ancestor(vim, v, a), v, shift);
					sip += shift;
					sop += shift;
				}
				
				vipp = this.params(vip);
				vopp = this.params(vop);
				vimp = this.params(vim);
				vomp = this.params(vom);

				sip += vipp.mod;
				sop += vopp.mod;
				sim += vimp.mod;
				som += vomp.mod;
            
            	nr = this.nextRight(vim);
            	nl = this.nextLeft(vip);
        	}
        	if (nr != null && this.nextRight(vop) == null) {
            	vopp = this.params(vop);
            	vopp.thread = nr;
            	vopp.mod += sim - sop;
        	}
        	if (nl != null && this.nextLeft(vom) == null) {
            	vomp = this.params(vom);
            	vomp.thread = nl;
            	vomp.mod += sip - som;
            	a = v;
        	}
    	}
    	return a;
	},
    
  	nextLeft: function(/* Node */ node)
   	{
    	var child = null;
       	if (node.expanded && node.firstChild) 
       		child = node.firstChild;
       	var np = this.params(node);
       	return (child != null ? child : np.thread);
    },
    
  	nextRight: function(/* Node */ node)
    {
    	var child = null;
    	if (node.expanded && node.firstChild) 
    		child = node.lastChild;
    	var np = this.params(node);
       	return (child != null ? child : np.thread);
    },

  	moveSubtree: function(/* Node */ wm, /* Node */ wp, shift)
	{
		var wmp = this.params(wm);
		var wpp = this.params(wp);
		var subtrees = wpp.number - wmp.number;
		wpp.change -= shift/subtrees;
		wpp.shift += shift;
		wmp.change += shift/subtrees;
		wpp.prelim += shift;
		wpp.mod += shift;
	},
	
	/**
	 * @param node A node (which is asserted to have children).
	 */
	executeShifts: function(/* Node */ node)
	{
		var cp;
		var shift = 0;
		var change = 0;
		for (var child = node.lastChild; child; child = child.previousSibling)
		{
			cp = this.params(child);
			cp.prelim += shift;
			cp.mod += shift;
			change += cp.change;
			shift += cp.shift + change;
		}
	},

	ancestor: function(/* Node */ vim, /* Node */ v, /* Node */ a)
	{
		var vimp = this.params(vim);
		var p = v.parentNode;
		return (vimp.ancestor.parentNode == p ? vimp.ancestor : a);
	},

    secondWalk: function(/* Node */ node, /* Node */ parent, m, depth, visible, /* Object */ parentSprite, childNo)
	{
		// Compute sprite position and position of incoming and outgoing ports.
		var np = this.params(node);
		var sprite = {x: 0, y: 0, xin: 0, yin: 0, xout: 0, yout: 0, xc: 0, yc: 0};  
		this.setBreadth(sprite, node, (visible ? np.prelim : 0) + m);
		this.setDepth(sprite, node, this.depths[depth]);
		node.setPosition(sprite.x, sprite.y);
		if (visible) {
			if (node.expanded) { 
				node.setVisibility("visible");
			} else if (node.firstChild) { // Inner node (not expanded).
				node.setNodeVisibility("visible");
				node.setLinkVisibility("hidden");
			} else { // Leaf node (not expanded).
				node.setVisibility("visible");
			}
		} else
			node.setVisibility("hidden");
			
		// Recurse.
		var v = node.expanded ? visible : false;
		var b = m + (node.expanded ? np.mod : np.prelim);
		if (v) 
			depth += 1;
		if (node.firstChild) {
			var c = 0;
			for (var child = node.firstChild; child; c++, child = child.nextSibling)
				this.secondWalk(child, node, b, depth, v, sprite, c);
		}
		np.clear();

		// Draw links to parent here (if there's a parent and the node is visible).
		if (parent && parent.expanded) {
			this.setEdges(node, parent, sprite, parentSprite, childNo, this.orient);
		}  
	},

	setBreadth: function(/* Object */ o, /* Node */ node,  b)
	{
		switch (this.orient) {
			case LEFT_TO_RIGHT:
			case RIGHT_TO_LEFT:
				o.yc = this.ay + b;
				o.y = Math.floor(o.yc - node.getHeight() / 2);
				o.yin = Math.floor(o.yc);
				o.yout = o.yin;
				break;
			case TOP_TO_BOTTOM:
			case BOTTOM_TO_TOP:
				o.xc = this.ax + b;
				o.x = Math.floor(o.xc - node.getWidth() / 2);
				o.xin = Math.floor(o.xc);
				o.xout = o.xin;
				break;
			default:
				throw "Firebug.NodeLinkTreeLayout.setBreadth: Unrecognized orientation value.";
		}
	},
	
	setDepth: function(/* Object */ o, /* Node */ node, d)
	{
		switch (this.orient) {
			case LEFT_TO_RIGHT:
				o.xc = Math.floor(this.ax + d);
				var semiWidth = Math.floor(node.getWidth() / 2);
				o.x = o.xc - semiWidth;
				o.xin = o.x - 1;
				o.xout = o.xc + semiWidth + 1;
				break;
			case RIGHT_TO_LEFT:
				o.xc = Math.floor(this.ax - d);
				var semiWidth = Math.floor(node.getWidth() / 2);
				o.x = o.xc - semiWidth;
				o.xin = o.xc + semiWidth + 1;
				o.xout = o.x - 1;
				break;
			case TOP_TO_BOTTOM:
				o.yc = Math.floor(this.ay + d);
				var semiHeight = Math.floor(node.getHeight() / 2);
				o.y = o.yc - semiHeight;
				o.yin = o.y - 1;
				o.yout = o.yc + semiHeight + 1;
				break;
			case BOTTOM_TO_TOP:
				o.yc = Math.floor(this.ay - d);
				var semiHeight = Math.floor(node.getHeight() / 2);
				o.y = o.yc - semiHeight;
				o.yin = o.yc + semiHeight + 1;
				o.yout = o.y - 1;
				break;
			default:
				throw new Error("Unrecognized orientation value");
		}
	},
	
	setEdges: function(node, parent, sprite, parentSprite, childNo, orientation)
	{
		// Determine the (projected) distance between parent and this node.
		switch (orientation) {
			case LEFT_TO_RIGHT:
				var distance = sprite.xc - parentSprite.xc;
				break;
			case RIGHT_TO_LEFT:
				var distance = parentSprite.xc - sprite.xc;
				break;
			case TOP_TO_BOTTOM:
				var distance = sprite.yc - parentSprite.yc;
				break;
			case BOTTOM_TO_TOP:
				var distance = parentSprite.yc - sprite.yc;
				break;
			default:
				throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
		}
		
		// We'll draw the line common to all children at half the distance between parent and node.
		var distanceFromParent = Math.floor(distance / 1.75);  // Distance from parent.

		if (parent.childNodes.length > 1) // More than one child (Either ALL children are visible or NONE). 
		{
			if (node.previousSibling == null)  // Only for first child.  
			{
				// Draw line from parent to the line common to all children.
				switch(orientation) {
					case LEFT_TO_RIGHT:
						var length = distanceFromParent - parentSprite.xout + parentSprite.xc;
						parent.setLinkSprite(0, parentSprite.xout, parentSprite.yc, (length > 0 ? length : 0), 1);
						break;
					case RIGHT_TO_LEFT:
						parent.setLinkSprite(0, parentSprite.xc - distanceFromParent, parentSprite.yc, distanceFromParent - parentSprite.xc + parentSprite.xout, 1);
						break;
					case TOP_TO_BOTTOM:
						parent.setLinkSprite(0, parentSprite.xc, parentSprite.yout, 1, distanceFromParent + parentSprite.yc - parentSprite.yout);
						break;
					case BOTTOM_TO_TOP:
						parent.setLinkSprite(0, parentSprite.xc, parentSprite.yc - distanceFromParent, 1, parentSprite.yout - (parentSprite.yc - distanceFromParent));
						break;
					default:
						throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
				}
			
				// Draw the line common to all children.
				switch(orientation) {
					case LEFT_TO_RIGHT:
						parent.setLinkSprite(1, parentSprite.xc + distanceFromParent, sprite.yc, 1, parentSprite.yc - sprite.yc);
						break;
					case RIGHT_TO_LEFT:
						parent.setLinkSprite(1, parentSprite.xc - distanceFromParent, sprite.yc, 1, parentSprite.yc - sprite.yc);
						break;
					case TOP_TO_BOTTOM:
						parent.setLinkSprite(1, sprite.xc, parentSprite.yc + distanceFromParent, parentSprite.xc - sprite.xc, 1);
						break;
					case BOTTOM_TO_TOP:
						parent.setLinkSprite(1, sprite.xc, parentSprite.yc - distanceFromParent, parentSprite.xc - sprite.xc, 1);
						break;
					default:
						throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
				}
			} else { // Later children (> 1).
				// Adjust the line common to all children if necessary.
				switch(orientation) {
					case LEFT_TO_RIGHT:
					case RIGHT_TO_LEFT:
						parent.adjustLinkSpriteBottom(1, sprite.yc + 1);
						break;
					case TOP_TO_BOTTOM:
					case BOTTOM_TO_TOP:
						parent.adjustLinkSpriteRight(1, sprite.xc + 1);
						break;
					default:
						throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
				}
			}
			// Draw line from this node to the line common to all children.
			switch(orientation) {
				case LEFT_TO_RIGHT:
					parent.setLinkSprite(childNo + 2, parentSprite.xc + distanceFromParent, sprite.yc, sprite.xin - distanceFromParent - parentSprite.xc, 1);
					break;
				case RIGHT_TO_LEFT:
					parent.setLinkSprite(childNo + 2, sprite.xin, sprite.yc, parentSprite.xc - distanceFromParent - sprite.xin, 1);
					break;
				case TOP_TO_BOTTOM:
					parent.setLinkSprite(childNo + 2, sprite.xc, parentSprite.yc + distanceFromParent, 1, sprite.yin - distanceFromParent - parentSprite.yc);
					break;
				case BOTTOM_TO_TOP:
					parent.setLinkSprite(childNo + 2, sprite.xc, sprite.yin, 1, parentSprite.yc - distanceFromParent - sprite.yin);
					break;
				default:
					throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
			}
		} else { // Only one child.
			switch(orientation) {
				case LEFT_TO_RIGHT:
					parent.setLinkSprite(0, parentSprite.xout, sprite.yc, sprite.xin - parentSprite.xout, 1);
					break;
				case RIGHT_TO_LEFT:
					parent.setLinkSprite(0, sprite.xin, sprite.yc, parentSprite.xout - sprite.xin, 1);
					break;
				case TOP_TO_BOTTOM:
					parent.setLinkSprite(0, sprite.xc, parentSprite.yout, 1, sprite.yin - parentSprite.yout);
					break;
				case BOTTOM_TO_TOP:
					parent.setLinkSprite(0, sprite.xc, sprite.yin, 1, parentSprite.yout - sprite.yin);
					break;
				default:
					throw "Firebug.NodeLinkTreeLayout.secondWalk: Unrecognized orientation value.";
			}
		}

	},

	spacing: function(/* Node */ l, /* Node */ r, /* boolean */ siblings)
	{
		var w = (this.orient == BOTTOM_TO_TOP || this.orient == TOP_TO_BOTTOM);
		return (siblings ? this.bspace : this.tspace) + 0.5 * (w ? l.getWidth() + r.getWidth() : l.getHeight() + r.getHeight())
	},

	updateDepths: function(depth, /* Node */ item)
	{
		var v = (this.orient == BOTTOM_TO_TOP || this.orient == TOP_TO_BOTTOM);
		var d = v ? item.getHeight() : item.getWidth();

		// Resize, if needed
		if (depth >= this.depths.length) {
			for (var i = depth; i < Math.floor(depth * 1.5); ++i) 
				this.depths[i] = 0;
		} 

    	this.depths[depth] = Math.max(this.depths[depth], d);
    	this.maxDepth = Math.max(this.maxDepth, depth);
	},

    determineDepths: function()
    {
       	for (var i = 1; i <= this.maxDepth; ++i) {
       	   	this.depths[i] += this.depths[i-1] + this.dspace;
        }
    },
    
    /**
     * Parameter access.
     */
	params: function(node)
	{
		var p = null;
		try {
			p = node.props;
		} catch (e) {
			if (node == null) alert("NULL!");
		}				
		
		
		if (p == null) {
			p = new Firebug.NodeLinkTreeLayout.Params();
			node.props = p;
		}
		if (p.number == -2) 
			p.init(node); 
		return p;
    }
    
});


// ************************************************************************************************


Firebug.NodeLinkTreeLayout.Params = function()
{
	this.prelim = 0;
	this.mod = 0;
	this.shift = 0;
	this.change = 0;
	this.number = -2;
	this.ancestor = null; // Node
	this.thread = null;	// Node
};


Firebug.NodeLinkTreeLayout.Params.prototype =
{
    init: function(item)
    {
    	this.ancestor = item;
    	this.number = -1;
    },

	clear: function()
	{
		this.prelim = 0;
		this.mod = 0;
		this.shift = 0;
		this.change = 0;
		this.number = -2;
		this.ancestor = null; // Node
		this.thread = null;	// Node
	}
}; 


// ************************************************************************************************


}});



