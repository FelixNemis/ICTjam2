

ICTJam2.gameScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function () {
        Phaser.Scene.call(this, { key: 'gameScene' });
    },

    preload: function () {
        this.load.spritesheet('tiles', 'img/tiles.png', {frameWidth: 8, frameHeight: 8});
        this.load.image('tiles_img', 'img/tiles.png');
        this.load.image('spaceBG', 'img/space_bg.png');
        this.load.image('nothing', 'img/nothing.png');
        this.load.image('end', 'img/end.png');

        this.load.tilemapTiledJSON('map1', 'map/map1.json');
        this.load.tilemapTiledJSON('map2', 'map/map2.json');
        this.load.tilemapTiledJSON('map3', 'map/map3.json');
        this.load.tilemapTiledJSON('map4', 'map/map4.json');
        this.load.tilemapTiledJSON('map5', 'map/map5.json');
        this.load.tilemapTiledJSON('map6', 'map/map6.json');

        this.load.tilemapTiledJSON('mapc1', 'map/mapc1.json');
        this.load.tilemapTiledJSON('mapc2', 'map/mapc2.json');
        this.load.tilemapTiledJSON('mapc3', 'map/mapc3.json');
        this.load.tilemapTiledJSON('mapc4', 'map/mapc4.json');

        this.load.tilemapTiledJSON('mapu1', 'map/mapu1.json');

        this.load.audio('boop', ['sfx/boop.mp3', 'sfx/boop.ogg']);
        this.load.audio('music', ['sfx/music.mp3', 'sfx/music.ogg']);

        this.load.json('terrainInfo', 'data/terrain.json');
    },

    create: function () {
        this.mainCam = this.cameras.main;
        this.mainCam.setZoom(4);
        this.mainCam.roundPixels = true;
        this.mainCam.scrollX = -(208*2 - 208/2);
        this.mainCam.scrollY = -(144*2 - 144/2);

        this.add.image(0, 0, 'spaceBG').setOrigin(0);
        this.map = this.make.tilemap({ key: 'map1' });
        var tiles = this.map.addTilesetImage('tiles', 'tiles_img');
        var layer = this.map.createStaticLayer(1, tiles, 0, 0);
        layer.setOrigin(0);

        this.thing = this.add.sprite(16, 108, 'tiles', 21);
        //this.thing.setOrigin(0);
        this.thing.deltaMove = 0;
        this.thing.moveTime = 30;

        this.thing.speed = 0.005;
        this.thing.moveSpeed = 0.05;
        this.thing.normalX = 16;
        this.thing.normalY = 108;

        this.thing.t = 0;

        this.anims.create({
            key: 'playerWalkRight',
            frames: this.anims.generateFrameNumbers('tiles', { frames: [21, 23] }),
            frameRate: 10,
            repeat: -1
        });
    },

    update: function (time, delta) {
        this.thing.anims.play('playerWalkRight', true);
        this.thing.normalX += delta * this.thing.moveSpeed;
        if (this.thing.normalX > 210) {
            this.thing.normalX -= 212;
        }
        if (this.thing.normalX < -2) {
            this.thing.normalX += 212;
        }
        this.thing.t += delta * this.thing.speed;

        var sizeProgression = 1.5 + Math.sin(this.thing.t * 0.3);

        this.thing.x = this.thing.normalX + (Math.sin(this.thing.t) * 10 * sizeProgression);
        if (this.thing.x > 212) {
            this.thing.x -= 212;
        }
        if (this.thing.x < -4) {
            this.thing.x += 212;
        }
        this.thing.y = this.thing.normalY + (Math.cos(this.thing.t) * 10 * sizeProgression);

        this.thing.rotation = -this.thing.t;
        
        /*
        this.thing.deltaMove += delta;
        if (this.thing.deltaMove > this.thing.moveTime) {
            this.thing.deltaMove -= this.thing.moveTime;
            this.thing.x -= 1;
            if (this.thing.x > 210) {
                this.thing.x = -10;
            }
            if (this.thing.x < -10) {
                this.thing.x = 210;
            }
        }
        *
        //this.thing.angle++;
        //console.log(this.mainCam.x);

        /*
        this.mainCam.scrollX += 2;
        if (this.mainCam.scrollX > 208) {
            this.mainCam.scrollX = -20;
        }
        this.mainCam.scrollY += 2;
        if (this.mainCam.scrollY > 144) {
            this.mainCam.scrollY = -20;
        }
        */
    },
});
