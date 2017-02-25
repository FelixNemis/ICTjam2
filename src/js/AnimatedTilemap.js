(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.AnimatedTilemap = function (game, map, animationData, tilesetKey) {
    this.phaserTilemap = map;
    this.animationData = animationData;
    this.game = game;

    this.TILESET_WIDTH = 16;

    var makeRectFromTileId = function (tid, tsWidth, tileWidth) {
        var x = tid%tsWidth;
        var y = Math.floor(tid/tsWidth);
        return new Phaser.Rectangle(x*tileWidth, y*tileWidth, tileWidth, tileWidth);
    };
    // keep track of the last time each animated tile changed, and it's current frame
    this.animationTimers = {};
    for (var anim in this.animationData) {
        if (this.animationData.hasOwnProperty(anim)) {
            var totalFrames = this.animationData[anim].length;
            this.animationTimers[anim] = {lastUpdate: 0, currentFrame: 0, totalFrames: totalFrames};
            for (var j = 0; j < totalFrames; j++) {
                this.animationData[anim][j].srcRect = makeRectFromTileId(this.animationData[anim][j].tileid, this.TILESET_WIDTH, this.phaserTilemap.tileWidth);
            }
            this.animationTimers[anim].destRect =  makeRectFromTileId(anim, this.TILESET_WIDTH, this.phaserTilemap.tileWidth);
        }
    }

    this.layers = {};

    this.tilesBaseImg = this.game.make.image(0, 0, tilesetKey);
    this.tileTexture = new Phaser.BitmapData(this.game.game, 'tilesTexture', this.tilesBaseImg.width, this.tilesBaseImg.height);
    this.tileTexture.draw(this.tilesBaseImg, 0, 0);

    this.tileset = this.phaserTilemap.addTilesetImage('tiles', this.tileTexture);

    this.globalMS = 0;
};

ICTJam2.AnimatedTilemap.prototype.createLayer = function (layerKey) {
    var index = this.phaserTilemap.getLayerIndex(layerKey);
    if (index === null) {
        console.log("Tryed to create non-existent layer");
        return;
    }
    this.layers[layerKey] = new ICTJam2.AnimatedTilemapLayer(this.game, this.tileset, this.phaserTilemap, layerKey);
    return this.layers[layerKey];
};

ICTJam2.AnimatedTilemap.prototype.animate = function (tileIds) {
    var tileGids = tileIds.map(function (tid) {
        return tid + 1;
    });
    for (var l in this.layers) {
        if (this.layers.hasOwnProperty(l)) {
            //this.layers[l].animate(tileIds);
            this.layers[l].animate(tileGids);
        }
    }
};

ICTJam2.AnimatedTilemap.prototype.update = function () {
    this.globalMS += this.game.time.physicsElapsedMS;

    var updatedIndexes = [];
    for (var tile in this.animationTimers) {
        if (this.animationTimers.hasOwnProperty(tile)) {
            var timer = this.animationTimers[tile];
            var data = this.animationData[tile][timer.currentFrame];
            var updated = false;
            while (timer.lastUpdate + data.duration < this.globalMS) {
                updated = true;
                timer.lastUpdate += data.duration;
                timer.currentFrame += 1;
                if (timer.currentFrame === timer.totalFrames) {
                    timer.currentFrame = 0;
                }
                data = this.animationData[tile][timer.currentFrame];
            }
            if (updated) {
                updatedIndexes.push(tile);
                this.tileTexture.clear(timer.destRect.x, timer.destRect.y, 8, 8);
                this.tileTexture.copyRect(this.tilesBaseImg, data.srcRect, timer.destRect.x, timer.destRect.y); 
            }
        }
    }

    if (updatedIndexes.length > 0) {
        this.animate(updatedIndexes);
    }
};

ICTJam2.AnimatedTilemap.prototype.getTsTexture = function () {
    return this.tileTexture;
};

ICTJam2.AnimatedTilemap.prototype.destroy = function () {
    this.tilesBaseImg.destroy();
    this.tileTexture.destroy();
};
})(this);
