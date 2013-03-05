'use strict';

function FamilyTreeLayout(settings){
	this.width = settings.nodeWidth;
	this.height = settings.nodeHeight;
	this.horizontalSeparation = settings.horizontalSeparation;
	this.verticalSeparation = settings.verticalSeparation;
	this.distance = this.width + this.verticalSeparation;
}

FamilyTreeLayout.prototype.positionTree = function(root){
	this.initDrawData(root);
	this.firstWalk(root);
	this.secondWalk(root, -root.drawData.prelim);
}

FamilyTreeLayout.prototype.firstWalk = function(vNode){
	if(vNode.isLeaf() || !vNode.drawData.expanded){
		if(vNode.hasLeftSibling()){
			vNode.drawData.prelim = vNode.leftSibling().drawData.prelim + this.distance;
		}else{
			vNode.drawData.prelim = 0;
		}
	}else if(!vNode.isLeaf() && vNode.drawData.expanded){
		var defaultAncestor = vNode.firstChild();
		for(var i = 0; i < vNode.children.length; i++){
			this.firstWalk(vNode.children[i]);
			defaultAncestor = this.apportion(vNode.children[i], defaultAncestor);
		}
		this.executeShifts(vNode);
		var midPoint = (vNode.leftMostChild().drawData.prelim + vNode.rightMostChild().drawData.prelim)/2;
		if(vNode.hasLeftSibling()){
			vNode.drawData.prelim = vNode.leftSibling().drawData.prelim + this.distance;
			vNode.drawData.modifier = vNode.drawData.prelim - midPoint;
		}else{
			vNode.drawData.prelim = midPoint;
		}
	}
}

FamilyTreeLayout.prototype.secondWalk = function(vNode, m){
	vNode.drawData.coordX = vNode.drawData.prelim + m;
	vNode.drawData.coordY = vNode.depth * (this.height + this.horizontalSeparation);
	if(vNode.drawData.expanded){
		for (var i = 0; i < vNode.children.length; i++) {
				this.secondWalk(vNode.children[i], m + vNode.drawData.modifier);
		};
	}
}

 FamilyTreeLayout.prototype.apportion = function(vNode, defaultAncestor){
	if(vNode.hasLeftSibling()){
		var vipNode = vNode;
		var vopNode = vNode;
		var vimNode = vNode.leftSibling();
		var vomNode = vipNode.leftMostSibling();
		var sip = vipNode.drawData.modifier;
		var sop = vopNode.drawData.modifier;
		var sim = vimNode.drawData.modifier;
		var som = vomNode.drawData.modifier;

		while(this.nextRight(vimNode) != 0 && this.nextLeft(vipNode) != 0){
			vimNode = this.nextRight(vimNode);
			vipNode = this.nextLeft(vipNode);
			vomNode = this.nextLeft(vomNode);
			vopNode = this.nextRight(vopNode);
			vopNode.drawData.ancestor = vNode;
			var shift = (vimNode.drawData.prelim + sim) 
						- (vipNode.drawData.prelim + sip)
						+ this.distance;

			if(shift > 0){
				this.moveSubtree(this.ancestor(vimNode, vNode, defaultAncestor), vNode, shift);
				sip += shift;
				sop += shift;
			}
			sim += vimNode.drawData.modifier;
			sip += vipNode.drawData.modifier;
			som += vomNode.drawData.modifier;
			sop += vopNode.drawData.modifier;
		}
		if(this.nextRight(vimNode) != 0 && this.nextRight(vopNode) == 0){
			vopNode.drawData.thread = this.nextRight(vimNode);
			vopNode.drawData.modifier += (sim - sop);
		}
		if(this.nextLeft(vipNode) != 0 && this.nextLeft(vomNode) == 0){
			vomNode.drawData.thread = this.nextLeft(vipNode);
			vomNode.drawData.modifier += (sip - som);
			defaultAncestor = vNode;
		}
	}
	return defaultAncestor;
}

FamilyTreeLayout.prototype.moveSubtree = function(wmNode, wpNode, shift){
	var subtree = this.getIndex(wpNode) - this.getIndex(wmNode);
	wpNode.drawData.change -= shift / subtree;
	wpNode.drawData.shift += shift;
	wmNode.drawData.change += shift / subtree;
	wpNode.drawData.prelim += shift;
	wpNode.drawData.modifier += shift;
}

FamilyTreeLayout.prototype.executeShifts = function(vNode){
	var shift = 0;
	var change = 0;
	for (var i = vNode.children.length-1; i >= 0; i--) {
		var wNode = vNode.children[i];
		wNode.drawData.prelim += shift;
		wNode.drawData.modifier += shift;
		change += wNode.drawData.change;
		shift += wNode.drawData.shift + change;
	};
}

FamilyTreeLayout.prototype.ancestor = function(vimNode, vNode, defaultAncestor){
	if(vimNode.drawData.ancestor.isSiblingOf(vNode)){
		return vimNode.drawData.ancestor;
	}
	else return defaultAncestor;
}

FamilyTreeLayout.prototype.nextLeft = function(vNode){
	if(!vNode.isLeaf() && vNode.drawData.expanded){
		return vNode.leftMostChild(); // the leftmost child
	}
	else return vNode.drawData.thread;
}

FamilyTreeLayout.prototype.nextRight = function(vNode){
	if(!vNode.isLeaf() && vNode.drawData.expanded){
		return vNode.rightMostChild(); // the leftmost child
	}
	else return vNode.drawData.thread;
}

FamilyTreeLayout.prototype.getIndex = function(vNode){
	return vNode.id.split("/").pop();
}

FamilyTreeLayout.prototype.initDrawData = function(root){
	root.traverseDown(function(node){
		node.drawData.prelim = 0;
		node.drawData.change = 0;
		node.drawData.modifier = 0;
		node.drawData.thread = 0;
		node.drawData.shift = 0;
		node.drawData.coordX = 0;
		node.drawData.coordY = 0;
	});
}

