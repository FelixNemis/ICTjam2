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
        this.game.load.image('tiles_img', 'img/tiles.png');
        this.game.load.image('spaceBG', 'img/space_bg.png');
        this.game.load.image('nothing', 'img/nothing.png', 8, 8);
        this.game.load.image('star_particle', 'img/star_particle.png');
        this.game.load.image('end', 'img/end.png');
        this.game.load.image('title', 'img/title.png');

        this.game.load.tilemap('map1', 'map/map1.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map2', 'map/map2.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map3', 'map/map3.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map4', 'map/map4.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map5', 'map/map5.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('map6', 'map/map6.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.tilemap('mapc1', 'map/mapc1.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('mapc2', 'map/mapc2.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('mapc3', 'map/mapc3.json', null, Phaser.Tilemap.TILED_JSON);
        this.game.load.tilemap('mapc4', 'map/mapc4.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.tilemap('mapu1', 'map/mapu1.json', null, Phaser.Tilemap.TILED_JSON);

        this.game.load.audio('boop', ['sfx/boop.mp3', 'sfx/boop.ogg']);
        this.game.load.audio('music', ['sfx/music.mp3', 'sfx/music.ogg']);

        this.game.load.json('terrainInfo', 'data/terrain.json');
	},

	create: function () {
        this.game.state.start('Title');
	}
};

})(this);
