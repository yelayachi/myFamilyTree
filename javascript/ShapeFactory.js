'use strict';

function ShapeFactory() {
	ShapeFactory.prototype.eventOnChildButtonClick = null;
	this.imageExpand = new Image();
	this.imageExpand.src = 'images/toggle-expand.png';
	this.imageCollapse = new Image();
	this.imageCollapse.src = 'images/toggle-collapse.png';
}

ShapeFactory.prototype.bindEvt = function (componentName, evt){
	if(componentName === 'childButton'){
		ShapeFactory.prototype.eventOnChildButtonClick = evt;
	}
}

ShapeFactory.prototype.createIdentityCard = function (node, layout) {
	var identityGroup = new Kinetic.Group({
			id : node.id,
			name : 'identity',
			draggable : false,
			x : node.drawData.coordX,
			y : node.drawData.coordY
		});
	var card = new Kinetic.Rect({
			width : layout.width,
			height : layout.height,
			fill : 'C6E6F4',
			stroke : 'A8D9EE',
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
			height : 32
		});

	if (node.drawData.expanded) {
		childButton.setImage(this.imageCollapse);
	} else {
		childButton.setImage(this.imageExpand);
	}

	childButton.on('click', function (evt) {
		ShapeFactory.prototype.eventOnChildButtonClick(evt, node, childButton);
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

ShapeFactory.prototype.createLinksBetweenIdentityCards = function (parent, children, layout) {
	var link = new Kinetic.Shape({
			name : 'link',
			drawFunc : function (canvas) {
				var context = canvas.getContext();
				context.beginPath();

				// link the siblings
				context.moveTo(children[0].attrs.x + (layout.width / 2),
					children[0].attrs.y - (layout.horizontalSeparation / 2));
				context.lineTo(children[children.length - 1].attrs.x + (layout.width / 2),
					children[children.length - 1].attrs.y - (layout.horizontalSeparation / 2));

				// link the parent
				context.moveTo(parent.attrs.x + (layout.width / 2),
					parent.attrs.y + layout.height);
				context.lineTo(parent.attrs.x + (layout.width / 2),
					parent.attrs.y + layout.height + (layout.horizontalSeparation / 2));

				// link the children
				children.forEach(function (subNode) {
					context.moveTo(subNode.attrs.x + (layout.width / 2), subNode.attrs.y);
					context.lineTo(subNode.attrs.x + (layout.width / 2), subNode.attrs.y - (layout.horizontalSeparation / 2));
				});

				context.lineWidth = 5;
				context.strokeStyle = 'black';
				context.lineJoin = 'round';
				context.lineCap = 'round';
				context.stroke();

			}
		});

	return link;
}

ShapeFactory.prototype.createSelectionShape = function (parent, children, layout) {
	var selectionShape = new Kinetic.Rect({
			width : layout.width,
			height : layout.height,
			fill : 'C6E6F4',
			stroke : 'A8D9EE',
			strokeWidth : 3
		});
}