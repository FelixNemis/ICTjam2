(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.Preloader = function () {
	this.ready = false;
};

ICTJam2.Preloader.prototype = {
	preload: function () {
        this.game.load.spritesheet('tiles', 'img/tiles.png', 8, 8);
        this.game.load.image('nothing', 'img/nothing.png', 8, 8);

        this.game.load.tilemap('map1', 'map/map1.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map2', 'map/map2.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map3', 'map/map3.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.audio('boop', ['sfx/boop.mp3', 'sfx/boop.ogg']);
        this.game.load.audio('music', ['sfx/music.mp3', 'sfx/music.ogg']);
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
