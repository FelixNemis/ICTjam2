(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.Preloader = function () {
	this.ready = false;
};

ICTJam2.Preloader.prototype = {
	preload: function () {
        /*
        this.game.load.image('floor', 'assets/img/floor.png');
        this.game.load.image('char', 'assets/img/char.png');
        this.game.load.image('char_eat', 'assets/img/char_eat.png');
        this.game.load.image('char_norm', 'assets/img/char_norm.png');

        this.game.load.image('ui_background', 'assets/img/ui_background.png');
        this.game.load.image('inventory_background', 'assets/img/inventory_background.png');

        this.game.load.image('tiles', 'assets/img/tiles_game.png');
        this.game.load.spritesheet('entityTiles', 'assets/img/entityTiles.png', 32, 32);
        this.game.load.tilemap('frozenPre', 'assets/map/frozen.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.audio('water', ['assets/sfx/water.mp3', 'assets/sfx/water.ogg']);
        this.game.load.audio('bomb', ['assets/sfx/bomb.mp3', 'assets/sfx/bomb.ogg']);
        this.game.load.audio('chip', ['assets/sfx/chip.mp3', 'assets/sfx/chip.ogg']);
        this.game.load.audio('collect', ['assets/sfx/collect.mp3', 'assets/sfx/collect.ogg']);
        this.game.load.audio('click', ['assets/sfx/click.mp3', 'assets/sfx/click.ogg']);
        this.game.load.audio('nom', ['assets/sfx/nom.mp3', 'assets/sfx/nom.ogg']);
        this.game.load.audio('ded', ['assets/sfx/ded.mp3', 'assets/sfx/ded.ogg']);

        this.game.load.json('obj', 'assets/objects/obj.json');
        this.game.load.json('levelList', 'levels');
        */
        this.game.load.spritesheet('tiles', 'img/tiles.png', 8, 8);

        this.game.load.tilemap('map1', 'map/map1.json', null, Phaser.Tilemap.TILED_JSON);
	},

	create: function () {
        this.game.state.start('Game');
	}
};

})(this);
