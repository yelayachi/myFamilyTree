'use strict';

var familyTreeModule = (function () {
	var publicFct = {};
	var tree,
	layout,
	stage;
	var imageExpand = new Image();
	imageExpand.src = 'images/toggle-expand.png';
	var imageCollapse = new Image();
	imageCollapse.src = 'images/toggle-collapse.png';

	/*
	 *	Private function
	 */

	function getDistance(p1, p2) {
		return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
	}

	function extendCollapseChildEvt(evt, node, childButton) {
		node.drawData.expanded = !node.drawData.expanded;
		var clickedId = evt.shape.parent.getId();

		if (node.drawData.expanded) {
			childButton.setImage(imageCollapse);
			layout.positionTree(tree);

			// On modifie le positionnement des noeuds apparents.
			if(!node.isRoot()){
			(function walkDown(subNode) {
					var i,
					newContext;
					for (i = 0; i < subNode.children.length; i++) {
						newContext = subNode.children[i];
						stage.get('#' + newContext.id)[0].transitionTo({
							x : newContext.drawData.coordX,
							y : newContext.drawData.coordY,
							duration : 0.3
						});
						if (!newContext.drawData.expanded || newContext.id === node.id)
							continue;
						walkDown(newContext);
					}
				})(tree);
			}

			// on affiche avec une animation les noeuds à apparaitre
			(function walkDown(subNode) {
				var i,
				newContext;
				for (i = 0; i < subNode.children.length; i++) {
					newContext = subNode.children[i];

					var group = drawIdentityGroup(newContext);
					group.setX(node.drawData.oldCoordX+layout.width/2);
					group.setY(node.drawData.oldCoordY+layout.height);
					group.setScale(0.1, 0.1);



					var nodeAndLinkLayer = stage.get('#sonsOf:' + subNode.id)[0];
			if (_.isUndefined(nodeAndLinkLayer)) {
				nodeAndLinkLayer = new Kinetic.Layer({
						id : 'sonsOf:' + subNode.id
					});
				nodeAndLinkLayer.add(group);
				stage.add(nodeAndLinkLayer);
			} else {
				nodeAndLinkLayer.add(group);
			}

					group.transitionTo({
							x : newContext.drawData.coordX,
							y : newContext.drawData.coordY,
							duration : 0.3,
							scale: {x: 1, y:1}
						});

					if (!newContext.drawData.expanded)
						continue;
					walkDown(newContext);
				}
			})(node);


			evt.shape.parent.draw();
			
			

		} else {
			childButton.setImage(imageExpand);
			node.traverseDown(function (subNode) {
				var layerToRemove = stage.get('#sonsOf:' + subNode.id)[0];
				if (!_.isUndefined(layerToRemove)) {
					layerToRemove.remove();
				}
			});
			evt.shape.parent.draw();
			layout.positionTree(tree);
			if (tree.drawData.expanded) {
				(function walkDown(subNode) {
					var i,
					newContext;
					for (i = 0; i < subNode.children.length; i++) {
						newContext = subNode.children[i];
						stage.get('#' + newContext.id)[0].transitionTo({
							x : newContext.drawData.coordX,
							y : newContext.drawData.coordY,
							duration : 0.3
						});
						if (!newContext.drawData.expanded)
							continue;
						walkDown(newContext);
					}
				})(tree);
			}
		}

	}

	function drawIdentityAndLinksLayer(node) {
		if (node.isRoot()) {
			var layer = new Kinetic.Layer();
			layer.add(drawIdentityGroup(node));
			stage.add(layer);
		} else {
			var nodeAndLinkLayer = stage.get('#sonsOf:' + node.parent.id)[0];
			if (_.isUndefined(nodeAndLinkLayer)) {
				nodeAndLinkLayer = new Kinetic.Layer({
						id : 'sonsOf:' + node.parent.id
					});
				nodeAndLinkLayer.add(drawIdentityGroup(node));
				stage.add(nodeAndLinkLayer);
			} else {
				nodeAndLinkLayer.add(drawIdentityGroup(node));
			}

			var linkGroup = drawLinkGroup(node.parent);
			if (!_.isUndefined(linkGroup)) {
			nodeAndLinkLayer.add(linkGroup);
			}
		return nodeAndLinkLayer;
		}
	}

	function drawIdentityGroup(node) {
		var identityGroup = new Kinetic.Group({
				id : node.id,
				name:'identity',
				draggable : false,
				x : node.drawData.coordX,
				y : node.drawData.coordY
			});
		var card = new Kinetic.Rect({
				width : layout.width,
				height : layout.height,
				fill : 'green',
				strokeWidth : 3
			});

		var imageObj = new Image();
		imageObj.src = node.data.photoUrl;

		var headShot = new Kinetic.Image({
				x : 5,
				y : 5,
				width : 128,
				height : 128,
				image : imageObj
			});

		var fullName = new Kinetic.Text({
				x : 132,
				y : 5,
				text : node.data.name,
				fontSize : 24,
				fontFamily : 'Calibri',
				fill : 'blue',
				width : 250,
				align : 'center'
			});
		var nodeInfo = new Kinetic.Text({
				x : 132,
				y : 100,
				text : "Date de naissance : " + node.data.birthDate,
				fontSize : 14,
				fontFamily : 'Calibri',
				fill : 'blue',
				width : 250
			});
		var childButton = new Kinetic.Image({
				name : "childButton",
				x : (layout.width - 32) / 2,
				y : layout.height - 32,
				width : 32,
				height : 32,
			});

		if (node.drawData.expanded) {
			childButton.setImage(imageCollapse);
		} else {
			childButton.setImage(imageExpand);
		}

		childButton.on('click', function (evt) {
			extendCollapseChildEvt(evt, node, this);
		});

		identityGroup.add(card);
		identityGroup.add(headShot);
		identityGroup.add(fullName);
		identityGroup.add(nodeInfo);
		if (!node.isLeaf()) {
			identityGroup.add(childButton);
		}

		return identityGroup;
	}

	function drawLinkGroup(node) {
			var linkGroup = new Kinetic.Group({
					name : "link"
				});

			var linkSiblings = new Kinetic.Line({
					points : [
						node.leftMostChild().drawData.coordX + (layout.width / 2),
						node.leftMostChild().drawData.coordY - (layout.horizontalSeparation / 2),
						node.rightMostChild().drawData.coordX + (layout.width / 2),
						node.rightMostChild().drawData.coordY - (layout.horizontalSeparation / 2)],
					stroke : 'black',
					strokeWidth : 5,
					lineCap : 'round',
					lineJoin : 'round'
				});

			var linkDown = new Kinetic.Line({
					points : [
						node.drawData.coordX + (layout.width / 2),
						node.drawData.coordY + layout.height,
						node.drawData.coordX + (layout.width / 2), 
						node.drawData.coordY + layout.height + (layout.horizontalSeparation / 2)],
					stroke : 'black',
					strokeWidth : 5,
					lineCap : 'round',
					lineJoin : 'round'
				});

			linkGroup.add(linkDown);
			linkGroup.add(linkSiblings);

			node.children.forEach(function (subNode) {
				var linkUp = new Kinetic.Line({
						points : [subNode.drawData.coordX + (layout.width / 2), subNode.drawData.coordY,
							subNode.drawData.coordX + (layout.width / 2), subNode.drawData.coordY - (layout.horizontalSeparation / 2)],
						stroke : 'black',
						strokeWidth : 5,
						lineCap : 'round',
						lineJoin : 'round'
					});
				linkGroup.add(linkUp);
			});
			return linkGroup;
	}

	function bindUIActions() {
		stage.on('touchmove', function (evt) {
			var touch1 = evt.touches[0];
			var touch2 = evt.touches[1];

			if (touch1 && touch2) {
				var dist = getDistance({
						x : touch1.clientX,
						y : touch1.clientY
					}, {
						x : touch2.clientX,
						y : touch2.clientY
					});

				if (!lastDist) {
					lastDist = dist;
				}

				var scale = stage.getScale().x * dist / lastDist;

				stage.setScale(scale);
				stage.draw();
				lastDist = dist;
			}
		}, false);

		stage.on('touchend', function () {
			lastDist = 0;
		}, false);

		document.getElementById("treeCanvas").addEventListener("mousewheel", function (e) {
			var zoomAmount = e.wheelDeltaY * 0.0001;
			stage.setScale(stage.getScale().x + zoomAmount);
			stage.setOffset( - (stage.getWidth() - layout.width * stage.getScale().x) / (2 * stage.getScale().x), 0);
			stage.draw();
			e.preventDefault();
		}, false);
	}

	function drawTree() {
		layout.positionTree(tree);
		drawIdentityAndLinksLayer(tree);
		if (tree.drawData.expanded) {
			(function walkDown(subNode) {
				var i,
				newContext;
				for (i = 0; i < subNode.children.length; i++) {
					newContext = subNode.children[i];
					drawIdentityAndLinksLayer(newContext);
					if (!newContext.drawData.expanded)
						continue;
					walkDown(newContext);
				}
			})(tree);
		}

		stage.setOffset( - (stage.getWidth() - layout.width * stage.getScale().x) / (2 * stage.getScale().x), 0);
		stage.draw();
	}

	/*
	 *	Public function
	 */

	publicFct.init = function (containerName, settings) {
		stage = new Kinetic.Stage({
				container : containerName,
				width : $('#' + containerName).width(),
				height : $('#' + containerName).height(),
				draggable : true,
				scale : 0.3
			});
		layout = new FamilyTreeLayout(settings);
		bindUIActions();
	}

	publicFct.display = function (data) {
		tree = Arboreal.parse(data, 'children');
		drawTree();
	}

	return publicFct;
}
	());