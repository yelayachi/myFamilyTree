$(document).ready(function() {
	
	
	// Load the data
	var tree = Arboreal.parse(treeJson, 'children');
	var layout = new FamilyTreeLayout(400, 150, 50, 100);
	layout.positionTree(tree);
	
	  
	var stage = new Kinetic.Stage({
        container: 'treeCanvas',
        width: $('#treeCanvas').width(),
        height: $('#treeCanvas').height(),
		draggable: true
    });

	var layer = new Kinetic.Layer();
	
	var imageExpand = new Image();
	imageExpand.src = 'images/toggle-expand.png';
	var imageCollapse = new Image();
	imageCollapse.src = 'images/toggle-collapse.png';
	
	tree.traverseDown(function (node) {
		var identityGroup = new Kinetic.Group({
			draggable: false,
			name: node.id,
			x: node.drawData.coordX,
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
			
			var childButton = new Kinetic.Image({
				id: 'childButton',
				x: (layout.width-32) / 2,
				y: layout.height - 32,
				width: 32,
				height: 32,
				image: imageCollapse
			});

			identityGroup.add(card);
			identityGroup.add(headShot);
			identityGroup.add(fullName);
			identityGroup.add(nodeInfo);
			if(!node.isLeaf()){
				identityGroup.add(childButton);
			}
			layer.add(identityGroup);

			// Draw the links between the nodes
			var linkDown = new Kinetic.Line({
		        points: [node.drawData.coordX + (layout.width / 2), node.drawData.coordY + layout.height, 
		        		node.drawData.coordX + (layout.width / 2), node.drawData.coordY + layout.height + (layout.horizontalSeparation / 2)],
		        stroke: 'black',
		        strokeWidth: 5,
		        lineCap: 'round',
		        lineJoin: 'round'
		    });

		    var linkUp = new Kinetic.Line({
		        points: [node.drawData.coordX + (layout.width / 2), node.drawData.coordY, 
		        		node.drawData.coordX + (layout.width / 2), node.drawData.coordY - (layout.horizontalSeparation / 2)],
		        stroke: 'black',
		        strokeWidth: 5,
		        lineCap: 'round',
		        lineJoin: 'round'
		    });

		    if(!node.isLeaf()){
		    	var linkSiblings = new Kinetic.Line({
			        points: [node.leftMostChild().drawData.coordX + (layout.width / 2), node.leftMostChild().drawData.coordY - (layout.horizontalSeparation / 2), 
			        		node.rightMostChild().drawData.coordX + (layout.width / 2), node.rightMostChild().drawData.coordY - (layout.horizontalSeparation / 2)],
			        stroke: 'black',
			        strokeWidth: 5,
			        lineCap: 'round',
			        lineJoin: 'round'
			    });
			    layer.add(linkDown);
		    	layer.add(linkSiblings);
		    }
		    if(node.hasParent()){
		    	layer.add(linkUp);
		    }
		    
		    

		    layer.move(100, 0);
			stage.add(layer);
		};
		imageObj.src= node.data.photoUrl;

	});

	function getDistance(p1, p2) {
        return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
    }
	  
	stage.on('touchmove', function(evt) {
        var touch1 = evt.touches[0];
        var touch2 = evt.touches[1];

        if(touch1 && touch2) {
          var dist = getDistance({
            x: touch1.clientX,
            y: touch1.clientY
          }, {
            x: touch2.clientX,
            y: touch2.clientY
          });

          if(!lastDist) {
            lastDist = dist;
          }

          var scale = stage.getScale().x * dist / lastDist;

          stage.setScale(scale);
          stage.draw();
          lastDist = dist;
        }
    }, false);

    stage.on('touchend', function() {
        lastDist = 0;
    }, false);
	  
	document.getElementById("treeCanvas").addEventListener("mousewheel", function(e) {
		var zoomAmount = e.wheelDeltaY*0.0001;
		stage.setScale(stage.getScale().x+zoomAmount)
		stage.draw();
		e.preventDefault();
	}, false);
	
	var shape = stage.get('#childButton')[0];
	shape.on('click', function(evt){
		
	});
	
 });


