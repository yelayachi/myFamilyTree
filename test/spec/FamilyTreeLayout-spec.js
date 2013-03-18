function populatedTree() {
	var tree = new Arboreal();
	tree
	.appendChild()
	.appendChild()
	.appendChild();
	
	tree.children[0]
	.appendChild()
	.appendChild();
	
	tree.children[2]
	.appendChild()
	.appendChild();
	
	tree.children[0].children[0]
	.appendChild()
	.appendChild()
	.appendChild()
	.appendChild()
	.appendChild();
	
	tree.children[2].children[0]
	.appendChild()
	.appendChild();
	
	return tree;
}

describe("Family Tree", function () {
	it("#positionTree()", function () {
		var tree = populatedTree();
		//var layout = new FamilyTreeLayout();
		//layout.positionTree(tree);
	});
});