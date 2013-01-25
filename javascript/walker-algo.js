levelSeparation = 3;
siblingSeparation = 3;
subtreeSeparation = 3;
maxDepth = 10;
var xTopAdjustment, yTopAdjustement;

function positionTree(root){
	/*Initialize the list of previous  nodes at each level.  */
	initPrevNodeList();
	
	/*Do the preliminary positioning with a postorder walk.  */
	firstWalk(root, 0);
	
	/*Determine how to adjust all the nodes with respect to the location of the root*/
	xTopAdjustment = node.drawData.coordX - node.drawData.prelimX;
	yTopAdjustement = node.drawData.coordY;
	
	/* Do the final positioning with a preorder walk */
	secondWalk(root, 0, 0);
}

function firstWalk(node, level){
	node.drawData.leftNeighbor = getPrevNodeAtLevel(level);
	setPrevNodeAtLevel(level, node);
	node.drawData.modifier = 0;
	if(isLeaf(node) or level = maxDepth){
		if(hasLeftSibling(node)){
			/*Determine  the  preliminary  x-coordinate  based  on: 
				the  preliminary  x-coordinate  of  the  left sibling,  
				the  separation  between  sibling  nodes,  and 
				the  mean  size  of  left sibling  and  current  node.  */ 
			node.drawData.prelimX = leftSibling(node).drawData.prelimX + siblingSeparation + meanNodeSize(leftSibling(node), node);
		}else{
			/*No  sibling  on  the  left  to  worry  about.*/
			node.drawData.prelimX = 0;
		}
	}else{
		/*This  Node  is  not  a  leaf,  so  call  this  procedure 
		recursively  for  each  of  its  offspring. */
		leftMost = rightMost = firstChild(node);
		firstWalk(leftMost, level + 1);
		while(hasRightSibling(rightMost)){
			rightMost = rightSibling(node);
			firstWalk(rightMost, level + 1);
		}
		midPoint = (leftMost.drawData.prelimX + rightMost.drawData.prelimX)/2;
		if(hasLeftSibling(node)){
			node.drawData.prelimX = leftSibling(node).drawData.prelimX + siblingSeparation + meanNodeSize(leftSibling(node), node);
			node.drawData.modifier = node.drawData.prelimX - midPoint;
			apportion(node, level);
		}else{
			node.drawData.prelimX = midPoint;
		}
	}
}

function secondWalk(node, level, modsum){
	if(level <= maxDepth){
		xTemp = xTopAdjustment + node.drawData.prelimX + modsum;
		yTemp = yTopAdjustment + (level * levelSeparation);
		node.drawData.coordX = xTemp;
		node.drawData.coordY = yTemp;
		
		if(hasChild(node)){
			/*Apply  the  modifier  value  for  this  node  to  all  its  offspring */
			secondWalk(firstChild(node), level+1, modsum + node.drawData.modifier);
		}
		if(hasRightSibling(node)){
			secondWalk(rightSibling(node), level+1, modsum);
		}
	}
}