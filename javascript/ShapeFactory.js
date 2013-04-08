'use strict';

var shapeFactory = (function () {
	var publicFct = {};
	var eventOnChildButtonClick, 
	imageExpand, imageCollapse, imageArrowDown, imageArrowUp, imageArrowRight, imageDelete, imageEdit;
	var layout, selectionGroup;

    /*
	 *	Private function
	 */


	 /*
	 *	Public function
	 */
	 publicFct.bindEvt = function (componentName, evt){
		if(componentName === 'childButton'){
			eventOnChildButtonClick = evt;
		}
	}

publicFct.createIdentityCard = function (node) {
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

	var removeButton = new Kinetic.Image({
			name : "removeButton",
			x : layout.width - 32,
			y : 0,
			width : 32,
			height : 32,
			image : imageDelete,
			visible : false
		});

	var editButton = new Kinetic.Image({
			name : "editButton",
			x : 0,
			y : 0,
			width : 32,
			height : 32,
			image : imageEdit,
			visible : false
		});

	if (node.drawData.expanded) {
		childButton.setImage(imageCollapse);
	} else {
		childButton.setImage(imageExpand);
	}

	identityGroup.add(card);
	identityGroup.add(headShot);
	identityGroup.add(fullName);
	identityGroup.add(nodeInfo);
	if (!node.isLeaf()) {
		identityGroup.add(childButton);
	}

	identityGroup.add(removeButton);
	identityGroup.add(editButton);

	childButton.on('click', function (evt) {
		eventOnChildButtonClick(evt, node, childButton);
		evt.cancelBubble = true;
	});

	removeButton.on('click', function (evt) {
		
		evt.cancelBubble = true;
	});

	editButton.on('click', function (evt) {
		
		evt.cancelBubble = true;
	});

	identityGroup.on('mouseenter', function (evt) {
		removeButton.setVisible(true);
		editButton.setVisible(true);
		evt.targetNode.getLayer().draw();
	});

	identityGroup.on('mouseleave', function (evt) {
		removeButton.setVisible(false);
		editButton.setVisible(false);
		evt.targetNode.getLayer().draw();
	});

	identityGroup.on('click tap', function (evt) {
		removeButton.setVisible(true);
		editButton.setVisible(true);
		if(!_.isUndefined(selectionGroup)){
			selectionGroup.destroy();
		}
		selectionGroup = shapeFactory.createSelection(node);
			identityGroup.add(selectionGroup);
			selectionGroup.moveToBottom();
		evt.targetNode.getStage().draw();
	});

	return identityGroup;
}

publicFct.createLinksBetweenIdentityCards = function (parent, children) {
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

publicFct.createSelection = function (node) {
	var buttonHeight = 64;
	var buttonWidth = 64;
	var selectionOffset = 20;

	var selectionLayer = new Kinetic.Group({
			id : 'selectionLayer',
			x : - selectionOffset / 2,
			y : - selectionOffset / 2
		});

	var selectionShape = new Kinetic.Rect({
			width : layout.width + selectionOffset,
			height : layout.height + selectionOffset,
			fill : 'grey',
			opacity : 0.3,
			cornerRadius : 20
		});

	var addParentButton = new Kinetic.Image({
			name : "addParentButton",
			x : layout.width - 150,
			y : -buttonHeight + selectionOffset,
			width : buttonWidth,
			height : buttonHeight,
			image: imageArrowUp
		});

	var addChildButton = new Kinetic.Image({
			name : "addChildButton",
			x : layout.width - 150,
			y : layout.height,
			width : buttonWidth,
			height : buttonHeight,
			image: imageArrowDown
		});

	var addPartnerButton = new Kinetic.Image({
			name : "addPartnerButton",
			x : layout.width,
			y : (layout.height - buttonHeight + selectionOffset )/2,
			width : buttonWidth,
			height : buttonHeight,
			image: imageArrowRight
		});

	addParentButton.on('click', function (evt) {
		console.log('adding parent to '+ node.id);
		evt.cancelBubble = true;
	});

	addChildButton.on('click', function (evt) {
		console.log('adding child to '+ node.id);
		$('#createEdit').dialog({
            modal: true,     
            height: 400,
            width: 400,
            title: 'Dynamically Loaded Page'
        });
		evt.cancelBubble = true;
	});

	addPartnerButton.on('click', function (evt) {
		console.log('adding partner to '+ node.id);
		evt.cancelBubble = true;
	});

	selectionLayer.add(selectionShape);
	if(node.isRoot()){
		selectionLayer.add(addParentButton);
	}
	selectionLayer.add(addChildButton);
	selectionLayer.add(addPartnerButton);

	return selectionLayer;
}

publicFct.getSelectionLayer = function (){
	return selectionLayer;
}

publicFct.init = function (settings) {
    	layout = settings.layout;

    	imageExpand = new Image();
		imageExpand.src = 'images/toggle-expand.png';
		imageCollapse = new Image();
		imageCollapse.src = 'images/toggle-collapse.png';
		imageArrowDown = new Image();
		imageArrowDown.src = 'images/arrow_down.png';
		imageArrowUp = new Image();
		imageArrowUp.src = 'images/arrow_up.png';
		imageArrowRight = new Image();
		imageArrowRight.src = 'images/arrow_right.png';
		imageDelete = new Image();
		imageDelete.src = 'images/delete.png';
		imageEdit = new Image();
		imageEdit.src = 'images/edit.png';
    };

	return publicFct;
})();
