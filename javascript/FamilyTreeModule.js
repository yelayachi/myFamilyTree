'use strict';

var familyTreeModule = (function () {
	var publicFct = {};
	var tree,
	layout,
	stage,
	shapeFactory;

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
			childButton.setImage(shapeFactory.imageCollapse);
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
			var createdLayers  = new Array();
			(function walkDown(subNode) {
				var i,
				newContext;
				for (i = 0; i < subNode.children.length; i++) {
					newContext = subNode.children[i];

					var group = shapeFactory.createIdentityCard(newContext, layout);
					group.setX(node.drawData.oldCoordX+layout.width/2);
					group.setY(node.drawData.oldCoordY+layout.height);
					group.setScale(0.1, 0.1);

					var nodeAndLinkLayer = stage.get('#sonsOf:' + subNode.id)[0];
			if (_.isUndefined(nodeAndLinkLayer)) {
				nodeAndLinkLayer = new Kinetic.Layer({
						id : 'sonsOf:' + subNode.id
					});
				createdLayers.push(nodeAndLinkLayer);
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

			// on redessine les liens
		createdLayers.forEach(function(layer){
			var idParent = layer.attrs.id.split(':').pop();
			var parent = stage.get('#'+idParent)[0];
			var children = _.filter(layer.children, function(child){
				return child.attrs.name === 'identity';
			});
			layer.add(shapeFactory.createLinksBetweenIdentityCards(parent, children, layout));
		})


			evt.shape.parent.draw();
			
			

		} else {
			childButton.setImage(shapeFactory.imageExpand);
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
					newContext,
					identity;
					for (i = 0; i < subNode.children.length; i++) {
						newContext = subNode.children[i];
						identity = stage.get('#' + newContext.id)[0];
						identity.transitionTo({
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

	function drawSiblingsInTheSameLayer(node) {
		if (node.isRoot()) {
			var layer = new Kinetic.Layer();
			layer.add(shapeFactory.createIdentityCard(node, layout));
			stage.add(layer);
		} else {
			var nodesLayer = stage.get('#sonsOf:' + node.parent.id)[0];
			if (_.isUndefined(nodesLayer)) {
				nodesLayer = new Kinetic.Layer({
						id : 'sonsOf:' + node.parent.id,
						name : 'brothers'
					});
				nodesLayer.add(shapeFactory.createIdentityCard(node, layout));
				stage.add(nodesLayer);
			} else {
				nodesLayer.add(shapeFactory.createIdentityCard(node, layout));
			}
		}
	}

	function drawIdentities(tree){
		drawSiblingsInTheSameLayer(tree);
		if (tree.drawData.expanded) {
			(function walkDown(subNode) {
				var i,
				newContext;
				for (i = 0; i < subNode.children.length; i++) {
					newContext = subNode.children[i];
					drawSiblingsInTheSameLayer(newContext);
					if (!newContext.drawData.expanded)
						continue;
					walkDown(newContext);
				}
			})(tree);
		}
	}

	function drawLinks(){
		var brothersLayer = stage.get('.brothers');
		brothersLayer.forEach(function(layer){
			var idParent = layer.attrs.id.split(':').pop();
			var parent = stage.get('#'+idParent)[0];
			var children = _.filter(layer.children, function(child){
				return child.attrs.name === 'identity';
			});
			layer.add(shapeFactory.createLinksBetweenIdentityCards(parent, children, layout));
		})
	}

	function drawTree() {
		layout.positionTree(tree);
		drawIdentities(tree);
		drawLinks();

		stage.setOffset( - (stage.getWidth() - layout.width * stage.getScale().x) / (2 * stage.getScale().x), 0);
		stage.draw();
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
		
		shapeFactory.bindEvt('childButton', extendCollapseChildEvt);
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
				scale : 0.5
			});
		layout = new FamilyTreeLayout(settings);
		shapeFactory = new ShapeFactory();
		bindUIActions();
	}

	publicFct.display = function (data) {
		tree = Arboreal.parse(data, 'children');
		drawTree();
	}

	return publicFct;
}
	());