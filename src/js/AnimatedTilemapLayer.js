(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;
var PIXI = scope.PIXI;

ICTJam2.AnimatedTilemapLayer = function (game, tileset, map, layer) {
    this.tileset = tileset;
    this.layer = map.layers[map.getLayerIndex(layer)];

    this.widthInTiles = map.width;
    this.heightInTiles = map.height;

    this.TILE_WIDTH = map.tileWidth;

    var i = 0;
    var j = 0;
    this.rendered = [];
    for (i = 0; i < this.widthInTiles; i++) {
        this.rendered[i] = [];
        for (j = 0; j < this.heightInTiles; j++) {
            this.rendered[i][j] = false;
        }
    }

    this.redrawAll = false;

    Phaser.Sprite.call(this, game.game, 0, 0);

    this.canvas = PIXI.CanvasPool.create(this, this.widthInTiles*this.TILE_WIDTH, this.heightInTiles*this.TILE_WIDTH);
    this.context = this.canvas.getContext('2d');

    this.setTexture(new PIXI.Texture(new PIXI.BaseTexture(this.canvas)));
};

ICTJam2.AnimatedTilemapLayer.prototype = Object.create(Phaser.Sprite.prototype);
ICTJam2.AnimatedTilemapLayer.prototype.constructor = ICTJam2.AnimatedTilemapLayer;

ICTJam2.AnimatedTilemapLayer.prototype.animate = function (tileIds) {
    var notIn = {}; // cache the indexes we don't need to update
    var data = this.layer.data;
    for (var j = 0; j < this.heightInTiles; j++) {
        var row = data[j];
        for (var i = 0; i < this.widthInTiles; i++) {
            var tile = row[i];
            if (!tile || tile.index < 0) {
                continue;
            }
            if (typeof notIn[tile.index] !== "undefined") {
                continue;
            }
            if (tileIds.indexOf(tile.index) !== -1) {
                notIn[tile.index] = true;
                continue;
            }
            this.rendered[i][j] = false;
        }
    }
};

ICTJam2.AnimatedTilemapLayer.prototype.render = function () {
    if (!this.visible) {
        return;
    }

    this.context.save();

    if (this.redrawAll) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    var i = 0;
    var j = 0;

    for (j = 0; j < this.heightInTiles; j++) {
        var row = this.layer.data[j];
        for (i = 0; i < this.widthInTiles; i++) {
            if (this.rendered[i][j]) {
                continue;
            }
            //var tile = {index: 1};
            var tile = row[i];
            if (!tile || tile.index < 0) {
                continue;
            }

            var tileIndex = tile.index;
            this.context.clearRect(i*this.TILE_WIDTH, j*this.TILE_WIDTH, this.TILE_WIDTH, this.TILE_WIDTH);
            if (tile.rotation || tile.flipped) { // properly handle rotated and flipped tiles
                this.context.save();
                this.context.translate((i*this.TILE_WIDTH) + tile.centerX, (j*this.TILE_WIDTH) + tile.centerY);
                this.context.rotate(tile.rotation);

                if (tile.flipped) {
                    this.context.scale(-1, 1);
                }

                this.tileset.draw(this.context, -tile.centerX, -tile.centerY, tileIndex);
                this.context.restore();
            } else {
                this.tileset.draw(this.context, i*this.TILE_WIDTH, j*this.TILE_WIDTH, tileIndex);
            }
            this.rendered[i][j] = true;
        }
    }

    this.texture.baseTexture.dirty();

    this.context.restore();

    this.redrawAll = false;

    return true;
};

/**
* Automatically called by the Canvas Renderer.
* Overrides the Sprite._renderCanvas function.
*/
ICTJam2.AnimatedTilemapLayer.prototype._renderCanvas = function (renderSession) {
    this.render();

    PIXI.Sprite.prototype._renderCanvas.call(this, renderSession);
};

/**
* Automatically called by the Canvas Renderer.
* Overrides the Sprite._renderWebGL function.
*/
ICTJam2.AnimatedTilemapLayer.prototype._renderWebGL = function (renderSession) {
    this.render();

    PIXI.Sprite.prototype._renderWebGL.call(this, renderSession);

};

ICTJam2.AnimatedTilemapLayer.prototype.destroy = function() {
    PIXI.CanvasPool.remove(this);
    Phaser.Component.Destroy.prototype.destroy.call(this);
};

})(this);
