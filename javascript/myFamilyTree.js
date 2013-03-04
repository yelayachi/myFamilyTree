$(document).ready(function () {
	familyTreeModule.init('treeCanvas', {
		nodeWidth:400,
		nodeHeight: 150,
		verticalSeparation: 50,
		horizontalSeparation: 100
	});
	familyTreeModule.display(treeJson);
	
});