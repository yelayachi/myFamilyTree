$(document).ready(function() {
	
	
	// Load the data
	var tree = Arboreal.parse(treeJson, 'children');
	var layout = new FamilyTreeLayout(400, 150, 50, 100);
	layout.positionTree(tree);
	
	  
	var stage = new Kinetic.Stage({
        container: 'treeCanvas',
        width: 1500,
        height: 800,
        scale : 0.3
    });

	var layer = new Kinetic.Layer();
	
	tree.traverseDown(function (node) {
		var identityGroup = new Kinetic.Group({
			draggable: false,
			name: node.id,
			x: node.drawData.coordX + (stage.getWidth()),
			y: node.drawData.coordY
		});
		var card = new Kinetic.Rect({
			width: 400,
			height: 150,
			fill: 'green',
			strokeWidth: 3
		});
		
		var imageObj = new Image();
		
		imageObj.onload = function() {
			var headShot = new Kinetic.Image({
				x: 5,
				y: 5,
				width: 128,
				height: 128,
				image: imageObj
			});
			
			var fullName = new Kinetic.Text({
				x: 132,
				y: 5,
				text: node.data.name,
				fontSize: 24,
				fontFamily: 'Calibri',
				fill: 'blue',
				width: 250,
				align: 'center'
			});
			var nodeInfo = new Kinetic.Text({
				x: 132,
				y: 100,
				text: "Date de naissance : "+node.data.birthDate,
				fontSize: 14,
				fontFamily: 'Calibri',
				fill: 'blue',
				width: 250
			});
			identityGroup.add(card);
			identityGroup.add(headShot);
			identityGroup.add(fullName);
			identityGroup.add(nodeInfo);
			layer.add(identityGroup);
			stage.add(layer);
		};
		imageObj.src= node.data.photoUrl;
		
		
		
		
	});
	
	
   
   
   
 });


