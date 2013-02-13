'use strict';

function FamilyTreeLayout(width, height, levelSeparation, siblingSeparation, subtreeSeparation, orientation){
	this.width = width;
	this.height = height;
	this.levelSeparation = levelSeparation;
	this.siblingSeparation = siblingSeparation;
	this.orientation = orientation;
	this.distance = null;
}

FamilyTreeLayout.prototype.positionTree = function(root){
	this.initDistance();
	firstWalk(root);
	secondWalk(root, -root.drawData.prelim);
}

FamilyTreeLayout.prototype.initDistance = function(){
	this.distance = 50;
}

function initDrawData(vNode){
	vNode.drawData = {prelim : 0, modifier : 0, thread: 0, ancestor: 0, 
						number:0, change : 0, coordX : 0, coordY: 0};
}

function firstWalk(vNode){
	initDrawData(vNode);
	if(vNode.isLeaf()){
		if(vNode.hasLeftSibling()){
			vNode.drawData.prelim = vNode.leftSibling().drawData.prelim + distance;
		}else{
			vNode.drawData.prelim = 0;
		}
	}else{
		var defaultAncestor = vNode.firstChild();
		while(rightMost.hasRightSibling()){
			var wNode = node.rightSibling();
			firstWalk(wNode);
			defaultAncestor = apportion(wNode, defaultAncestor);
		}
		executeShifts(vNode);
		var midPoint = (vNode.leftMostChild().drawData.prelim + vNode.rightMostChild().drawData.prelim)/2;
		if(vNode.hasLeftSibling()){
			vNode.drawData.prelim = vNode.leftSibling().drawData.prelim + distance;
			vNode.drawData.modifier = vNode.drawData.prelim - midPoint;
		}else{
			vNode.drawData.prelim = midPoint;
		}
	}
}

function secondWalk(vNode, m){
	vNode.drawData.coordX = vNode.drawData.prelim + m;
	vNode.drawData.coordY = vNode.depth;
	for (var i = 0; i < vNode.children.length; i++) {
		secondWalk(vNode.children[i], m + vNode.drawData.modifier);
	};
}

function apportion(vNode, defaultAncestor){
	if(vNode.hasLeftSibling()){
		var vipNode = vopNode = vNode;
		var vimNode = vNode.leftSibling();
		var vomNode = vipNode.leftMostSibling();

		while(vimNode.nextRight() != 0 && vipNode.nextLeft() != 0){
			vimNode = vimNode.nextRight();
			vipNode = vipNode.nextLeft();
			vomNode = vomNode.nextLeft();
			vopNode = vopNode.nextRight();
			vopNode.drawData.ancestor = vNode;
			var shift = (vimNode.drawData.prelim + vimNode.drawData.modifier) 
						- (vipNode.drawData.prelim + vipNode.drawData.modifier)
						+ distance;

			if(shift > 0){
				moveSubtree(ancestor(vimNode, vNode, defaultAncestor), vNode, shift);
				vipNode.drawData.modifier += shift;
				vopNode.drawData.modifier += shift;
			}
			vimNode.drawData.modifier += vimNode.drawData.modifier;
			vipNode.drawData.modifier += vipNode.drawData.modifier;
			vomNode.drawData.modifier += vomNode.drawData.modifier;
			vopNode.drawData.modifier += vopNode.drawData.modifier;
		}
		if(vimNode.nextRight() != 0 && vopNode.nextRight() == 0){
			vopNode.drawData.thread = vimNode.nextRight();
			vopNode.drawData.modifier += (vimNode.drawData.modifier - vopNode.drawData.modifier);
		}
		if(vipNode.nextLeft() != 0 && vomNode.nextLeft() == 0){
			vomNode.drawData.thread = vipNode.nextLeft();
			vomNode.drawData.modifier += (vipNode.drawData.modifier - vomNode.drawData.modifier);
			defaultAncestor = vNode;
		}


	}
}

function moveSubtree(wmNode, wpNode, shift){
	var subtree = wpNode.drawData.number - wmNode.drawData.number;
	wpNode.drawData.change -= shift / subtree;
	wpNode.drawData.shift += shift;
	wmNode.drawData.change += shift / subtree;
	wpNode.drawData.prelim += shift;
	wpNode.drawData.modifier += shift;
}

function executeShifts(vNode){
	var shift = 0;
	var change = 0;
	for (var i = vNode.children.length; i < 0; i--) {
		var wNode = vNode.children[i];
		wNode.drawData.prelim += shift;
		wNode.drawData.modifier += shift;
		change += wNode.drawData.change;
		shift += wNode.drawData.shift + change;
	};
}

function ancestor(vimNode, vNode, defaultAncestor){
	if(vimNode.drawData.ancestor.isSiblingOf(vNode)){
		return vimNode.drawData.ancestor;
	}
	else return defaultAncestor;
}

