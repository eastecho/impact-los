ig.module(
	'game.entities.player'
)
.requires(
	'impact.entity'
)
.defines(function(){

var Direction = {
	NONE	: 0,
	UP		: 1,
	RIGHT	: 2,
	DOWN	: 3,
	LEFT	: 4
};

EntityPlayer = ig.Entity.extend({
	
	size: { x:24, y:24 },
	collides: ig.Entity.COLLIDES.ACTIVE,
	animSheet: new ig.AnimationSheet( 'media/players.png', 24, 24 ),
	targetPos: { x: 0, y: 0 },  	// The target location

	step: 12,					// The steps to take to go to the next tile
	speed: { x: 0, y: 0 },		// Moving speed

	inputTimer: undefined,      // Keyboard timer
	isHolding: false,       	// Is the input is held
	isWaiting: true,        	// Is the player is waiting
	isMoving: false,			// Is the player is moving

	points: [ ],

	init: function( x, y, settings ) {
		this.parent( x, y, settings );

		this.initPoints();

		this.vel.x = 0;
		this.vel.y = 0;

		this.addAnim('idle', 0.5, [0, 1]);
		this.inputTimer = new ig.Timer(0.2);
	},

	faceFlip: function(flipOrNot) {
		this.currentAnim.flip.x = flipOrNot;
	},

	update: function() {
		if (this.isMoving) {
			this.moveToTarget();
			return;
		}

		// 键盘输入等待
		this.isHolding = (this.inputTimer.delta() <= 0);

		if(!this.isHolding) {
			var move = false;
			if (ig.input.state('left')) {
				this.setTarget(Direction.LEFT);
				move = true;
			} else if (ig.input.state('right')) {
				this.setTarget(Direction.RIGHT);
				move = true;
			} else if (ig.input.state('up')) {
				this.setTarget(Direction.UP);
				move = true;
			} else if (ig.input.state('down')) {
				this.setTarget(Direction.DOWN);
				move = true;
			} else if (ig.input.state('mouse1')) {
				var dir = Direction.NONE;
				for (var i=0; i<4; i++) {
					var pointsSet = this.points[i];
					if (this.isInsideTriangle(pointsSet[0], pointsSet[1], pointsSet[2], ig.input.mouse)) {
						dir = i+1;  // 1 - up, 2 - right, 3 - down, 4 - left
						break;
					}
				}

				if (dir != Direction.NONE) {
					this.setTarget(dir);
					move = true;
				}
			}

			if (move) {
				this.inputTimer.reset();
				if (!ig.game.checkCollision(this.targetPos.x, this.targetPos.y)) {
					this.isHolding = true;
					this.isMoving = true;
					this.speed.x = (this.targetPos.x - this.pos.x) / this.step;
					this.speed.y = (this.targetPos.y - this.pos.y) / this.step;
					this.moveToTarget();
				}
			}
		}

		this.parent();
	},

	setTarget: function(direction) {
		switch (direction) {
			case Direction.UP:
				this.targetPos = { x: this.pos.x, y: this.pos.y - this.size.y };
				break;
			case Direction.RIGHT:
				this.faceFlip(true);
				this.targetPos = { x: this.pos.x + this.size.x, y: this.pos.y };
				break;
			case Direction.DOWN:
				this.targetPos = { x: this.pos.x, y: this.pos.y + this.size.y };
				break;
			case Direction.LEFT:
				this.faceFlip(false);
				this.targetPos = { x: this.pos.x - this.size.x, y: this.pos.y };
				break;
		}
	},

	moveToTarget: function() {
		this.pos.x += this.speed.x;
		this.pos.y += this.speed.y;

		if (Math.round(this.pos.x) == this.targetPos.x && Math.round(this.pos.y) == this.targetPos.y) {
			this.isMoving = false;
			this.targetPos = { x:-1, y:-1 };
		}
	},

	/* touch area */
	initPoints: function() {
		var pointTL = { x:0, y:0 };
		var pointTR = { x:ig.system.width, y:0 };
		var pointBR = { x:ig.system.width, y:ig.system.height };
		var pointBL = { x:0, y:ig.system.height };

		var pointCollection;
		var center = { x:ig.system.width/2, y:ig.system.height/2 };

		pointCollection = [ ];
		pointCollection.push(center);  pointCollection.push(pointTL);  pointCollection.push(pointTR);
		this.points.push(pointCollection);
		pointCollection = [ ];
		pointCollection.push(center);  pointCollection.push(pointTR);  pointCollection.push(pointBR);
		this.points.push(pointCollection);
		pointCollection = [ ];
		pointCollection.push(center);  pointCollection.push(pointBL);  pointCollection.push(pointBR);
		this.points.push(pointCollection);
		pointCollection = [ ];
		pointCollection.push(center);  pointCollection.push(pointTL);  pointCollection.push(pointBL);
		this.points.push(pointCollection);
	},

	sign: function(n) {
		return Math.abs(n) / n;
	},

	isInsideTriangle: function(A, B, C, P) {
		var planeAB = (A.x - P.x) * (B.y - P.y) - (B.x - P.x) * (A.y - P.y);
		var planeBC = (B.x - P.x) * (C.y - P.y) - (C.x - P.x) * (B.y - P.y);
		var planeCA = (C.x - P.x) * (A.y - P.y) - (A.x - P.x) * (C.y - P.y);
		return ((this.sign(planeAB) == this.sign(planeBC)) && (this.sign(planeBC) == this.sign(planeCA)));
	}
});

});