ig.module(
    'game.main'
)
    .requires(
    'impact.game', 'impact.font',

	'plugins.mw_los',

    'game.levels.main', 'game.entities.player'

	, 'impact.debug.debug'
)
.defines(function () {

	MyGame = ig.Game.extend({
		gravity: 0,
		board: { width: 0, height: 0},
		tileSize: 0,
		player: undefined,

		// Load a font
		font: new ig.Font('media/04b03.font.png'),
		statText: new ig.Font( 'media/04b03.font.png' ),
		levelTimer: new ig.Timer(),
		levelExit: null,

		// Plug-in
		los: undefined,

		init: function () {

			// Bind keys
			ig.input.bind( ig.KEY.LEFT_ARROW, 'left' );
			ig.input.bind( ig.KEY.RIGHT_ARROW, 'right' );
			ig.input.bind( ig.KEY.UP_ARROW, 'up' );
			ig.input.bind( ig.KEY.DOWN_ARROW, 'down' );

			ig.input.bind(ig.KEY.MOUSE1, 'mouse1');

			this.loadLevel(LevelMain);

			// Get basic map data
			this.board = { width: ig.game.collisionMap.width, height: ig.game.collisionMap.height };
			this.tileSize = ig.game.collisionMap.tilesize;

			// Set the start position manually
			//var loc = { x:1, y:1 };
			var loc = { x:29, y:34 };
			this.player = ig.game.spawnEntity(EntityPlayer, loc.y * this.tileSize, loc.x * this.tileSize, {});

			this.los = new ig.MW_LineOfSight({
				// player must be set
				player			:	this.player,
				// Debug settings
				debug			:	true,
				// Color settings
				startColor 		:	'rgba(0, 0, 0, 0)',
				startRadius		:	ig.system.height/4,
				endRadius		:	ig.system.height/2,
				endColor		: 	'rgba(0, 0, 0, 0.55)'
				//strokeColor		:	'rgba(255, 0, 255, 1)'
			});
		},

		update: function () {
			this.parent();
		},

		draw: function () {
			if(this.player) {
				this.screen.x = this.player.pos.x - ig.system.width/2 + this.tileSize/2;
				this.screen.y = this.player.pos.y - ig.system.height/2 + this.tileSize/2;
			}

			this.parent();

			if (this.los) {
				this.los.drawLOS();
				//this.los.drawForwardEdges();
				this.los.drawCalculatedEdges();
			}
		},

		checkCollision: function(x, y) {
			return this.collisionMap.data[Math.floor(y / this.tileSize)][Math.floor(x /this.tileSize)];
		}
	});

	if( ig.ua.mobile ) {
		// Disable sound for all mobile devices
		ig.Sound.enabled = false;
	}

	ig.main('#canvas', MyGame, 60, 320, 240, 2);

});
