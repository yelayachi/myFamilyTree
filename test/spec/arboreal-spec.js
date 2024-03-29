function appendSomeChildren(tree) {
	tree.appendChild()
	.appendChild()
	.appendChild()
	.appendChild();
	
	tree.children[0].appendChild()
	.appendChild();
}

function appendMoreChildren(tree) {
	tree.children[2]
	.appendChild()
	.appendChild()
	.appendChild();
}

describe("Arboreal", function () {
	it("#new()", function () {
		var tree = new Arboreal();
		expect(tree.id).toBe('0');
	});
	
	it("#new(null, {myAttr: true}, 'myId')", function () {
		var tree = new Arboreal(null, {
				myCustomAttr : true
			}, "myId");
		expect(tree.id).toBe("myId");
		expect(tree.data.myCustomAttr).toBeTruthy();
	});
	
	it("#length", function () {
		var tree = new Arboreal();
		appendSomeChildren(tree);
		expect(tree.length).toBe(7);
	});
	
	it("#hasLeftSibling()", function () {
		var tree = new Arboreal();
		expect(tree.hasLeftSibling()).toEqual(false);
		appendSomeChildren(tree);
		expect(tree.children[0].hasLeftSibling()).toEqual(false);
		expect(tree.children[1].hasLeftSibling()).toEqual(true);
    expect(tree.children[3].hasLeftSibling()).toEqual(true);
	});
	
	it("#leftSibling()", function () {
		var tree = new Arboreal();
		expect(tree.leftSibling()).toBeNull();
		appendSomeChildren(tree);
		expect(tree.children[0].leftSibling()).not.toBeDefined();
		expect(tree.children[1].leftSibling()).not.toBeNull();
	});

  it("#hasRightSibling()", function () {
    var tree = new Arboreal();
    expect(tree.hasRightSibling()).toEqual(false);
    appendSomeChildren(tree);
    expect(tree.children[3].hasRightSibling()).toEqual(false);
    expect(tree.children[1].hasRightSibling()).toEqual(true);
    expect(tree.children[0].hasRightSibling()).toEqual(true);
  });
	
	it("#rightSibling()", function () {
		var tree = new Arboreal();
		expect(tree.rightSibling()).toBeNull();
		appendSomeChildren(tree);
		expect(tree.children[1].rightSibling()).not.toBeNull();
		expect(tree.children[0].rightSibling()).not.toBeNull();
	});
	
	it("#isLeaf()", function () {
		var tree = new Arboreal();
		expect(tree.isLeaf()).toEqual(true);
		appendSomeChildren(tree);
		expect(tree.isLeaf()).toEqual(false);
	});
	
	it("::parse()", function () {
		var data = {
			category : 'JavaScript',
			subcategories : [{
					category : 'Ajax (programming)'
				}, {
					category : 'JavaScript engines'
				}, {
					category : 'JavaScript produgramming languages family',
					subcategories : [{
							category : 'JavaScript dialect engines'
						}
					]
				}, {
					category : 'JavaScript based calendar components'
				}, {
					category : 'JavaScript based HTML editors'
				}
			]
		};
		var tree = Arboreal.parse(data, 'subcategories');
		expect(tree.length).toBe(7);
	});
	
	it("#appendChild(null, 'bla')", function () {
		var tree = new Arboreal();
		tree.appendChild({
			myCustomAttr : true
		}, "myId");
		expect(tree.children.length).toBe(1);
		expect(tree.children[0].id).toBe("myId");
		expect(tree.children[0].parent).toEqual(tree);
	});
	
	it("#removeChild()", function () {
		var tree = new Arboreal(),
		thirdChild,
		secondChild;
		
		appendSomeChildren(tree);
		
		thirdChild = tree.children[2];
		secondChild = tree.children[0].children[1];
		
		expect(tree.removeChild(thirdChild)).toBe(thirdChild);
		expect(tree.children.length).toBe(3);
		expect(tree.children[2].id).toBe("0/3");
		
		expect(tree.children[0].removeChild(1).id).toBe(secondChild.id);
	});
	
	it("#traverseDown", function () {
		var tree = new Arboreal(),
		callbackCounter = 0;
		
		appendSomeChildren(tree);
		
		tree.traverseDown(function () {
			this.id = "_" + this.id;
		});
		
		expect(tree.id).toBe('_0');
		expect(tree.children[0].id).toBe('_0/0');
		expect(tree.children[3].id).toBe('_0/3');
		
		//expect to stop traversing when the iterator returns a falsy value
		
		tree.traverseDown(function (node) {
			callbackCounter++;
			if (callbackCounter === 3)
				return false;
		});
		
		expect(callbackCounter).toBe(3);
	});
	
	it("#traverseUp", function () {
		var tree = new Arboreal(),
		callbackCounter = 0,
		treeIds = [],
		spy1 = jasmine.createSpy(),
		spy2 = jasmine.createSpy(),
		appendId = function (node) {
			treeIds.push(node.id);
		};
		
		appendSomeChildren(tree);
		tree.traverseUp(spy1);
		//should iterate over itself and its child elements
		expect(spy1.callCount).toBe(1 + 4);
		
		//should traverse all the nodes in the tree
		tree.children[0].children[1].traverseUp(spy2);
		expect(spy2.callCount).toBe(tree.toArray().length);
		
		//should traverse all the nodes in the right order
		tree.children[0].children[1].traverseUp(appendId);
		
		expect(treeIds.shift()).toBe("0/0/1");
		expect(treeIds.pop()).toBe("0/3");
		
		treeIds = [];
		//should break when iterator returns a falsy value
		tree.traverseUp(function (node) {
			appendId(node);
			if (treeIds.length === 3)
				return false;
		});
		expect(treeIds.length).toBe(3);
	});
	
	it("#toArray", function () {
		var tree = new Arboreal();
		
		appendSomeChildren(tree);
		
		expect(tree.toArray().length).toBe(7);
		
		expect(tree.toArray()
			.map(function (node) {
				return node.id;
			})
			.every(function (id) {
				return id.length;
			})).toBeTruthy();
	});
	
	it("#find", function () {
		var tree = new Arboreal();
		appendSomeChildren(tree);
		
		expect(tree.find("0/3").id).toBe("0/3");
		expect(tree.find(function () {
				return this.depth == 2;
			}).id).toBe("0/0/0");
	});
	
	it("#path", function () {
		var tree = new Arboreal(),
		treeArry;
		
		appendSomeChildren(tree);
		treeArray = tree.toArray();
		lastNode = treeArray[treeArray.length - 1];
		
		//should automatically strip out the '/' prefix
		expect(tree.path("/3").id).toBe("0/3");
		expect(tree.path("0/1").id).toBe("0/0/1");
	});
});