(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.TerrainTool = function () {
};

ICTJam2.INITIAL_SCALE = 8;

ICTJam2.TerrainTool.prototype = {
    preload: function () {
        this.game.load.image('tiles', '/img/tiles.png');
        this.game.load.image('cursor', '/img/toolCursor.png');
        this.game.load.json('terrainInfo', '/data/terrain.json');
    },

	create: function () {
        this.ROW_WIDTH = 16;

        this.game.stage.backgroundColor = '#000000';

        this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        this.game.myScaleFactor = ICTJam2.INITIAL_SCALE;
        this.game.scale.setUserScale(ICTJam2.INITIAL_SCALE, ICTJam2.INITIAL_SCALE);

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
        this.game.renderer.renderSession.roundPixels = true;

        this.game.add.sprite(0, 0, 'tiles');

        //this.terrainVisual = this.game.add.graphics(0, 0);
        this.terrainVisual = this.game.make.bitmapData(128, 400);
        this.tvImage = this.terrainVisual.addToWorld();

        this.cursor = this.game.add.sprite(-1, -1, 'cursor');

        this.blinkKey = this.input.keyboard.addKey(Phaser.Keyboard.B);
        this.blinkEnabled = false;
        this.blinkToggle = false;

        this.leftClick = this.input.mousePointer.leftButton;
        this.rightClick = this.input.mousePointer.rightButton;

        this.leftClick.onDown.add(function () {
            var pointer = this.input.mousePointer;
            var tx = pointer.worldX - (pointer.worldX % 8);
            var ty = pointer.worldY - (pointer.worldY % 8);

            var tileIndex = (tx/8) + (ty/8)*this.ROW_WIDTH;

            if (this.terrainInfo.hasOwnProperty(tileIndex)) {
                var tInfo = this.terrainInfo[tileIndex];
                var xSlice = Math.floor(pointer.worldX) % 8;
                var yVal = Math.floor(pointer.worldY) % 8;
                if (tInfo.hasOwnProperty('all')) {
                    if (tInfo.all !== yVal) {
                        tInfo.all = yVal;
                    } else {
                        var n = tInfo.all;
                        this.terrainInfo[tileIndex] = {};
                        for (var i = 0; i < 8; i++) {
                            this.terrainInfo[tileIndex][i] = n;
                        }
                    }
                } else if (tInfo.hasOwnProperty(0)) {
                    if (yVal === 7 && tInfo[xSlice] === 7) {
                        tInfo[xSlice] = false;
                    } else {
                        tInfo[xSlice] = yVal;
                    }
                }
            } else {
                this.terrainInfo[tileIndex] = {all: 0};
            }
            this.clearGraphics();
            this.redrawGraphics();
        }, this);

        this.rightClick.onDown.add(function () {
            var pointer = this.input.mousePointer;
            var tx = pointer.worldX - (pointer.worldX % 8);
            var ty = pointer.worldY - (pointer.worldY % 8);

            var tileIndex = (tx/8) + (ty/8)*this.ROW_WIDTH;

            if (this.terrainInfo.hasOwnProperty(tileIndex)) {
                delete this.terrainInfo[tileIndex];
                this.clearGraphics();
                this.redrawGraphics();
            }
        }, this);

        this.terrainInfo = {};

        //this.loadInfo(ICTJam2.TerrainInfo);
        this.loadInfo(this.cache.getJSON('terrainInfo'));
	},

    clearGraphics: function () {
        //this.terrainVisual.clear();
        //this.terrainVisual.lineStyle(1, 0x00FF00, 0.5);
        this.terrainVisual.clear();
        //this.terrainVisual.fill(0, 0, 0, 0);
        this.terrainVisual.ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    },

    loadInfo: function (info) {
        this.terrainInfo = info;
        this.clearGraphics();
        this.redrawGraphics();
    },

    redrawGraphics: function () {
        var info = this.terrainInfo;
        for (var tile in info) {
            if (info.hasOwnProperty(tile)) {
                var tileX = tile % this.ROW_WIDTH;
                var tileY = Math.floor(tile / this.ROW_WIDTH);

                if (info[tile].hasOwnProperty('all')) {
                    //this.terrainVisual.drawRect(tileX*8, tileY*8 + info[tile].all, 7, 7 - info[tile].all);
                    this.terrainVisual.rect(tileX*8, tileY*8 + info[tile].all, 8, 1);
                } else if (info[tile].hasOwnProperty(0)) {
                    for (var i = 0; i < 8; i++) {
                        if (info[tile][i] === false) {
                            continue;
                        }
                        this.terrainVisual.rect(tileX*8 + i, tileY*8 + info[tile][i], 1, 1);
                        //this.terrainVisual.moveTo(tileX*8 + i, tileY*8 + info[tile][i]);
                        //this.terrainVisual.lineTo(tileX*8 + i, tileY*8 + 7);
                    }
                }
            }
        }
    },

	update: function () {
        if (this.blinkKey.isDown) {
            if (!this.blinkToggle) {
                this.blinkToggle = true;
                this.blinkEnabled = !this.blinkEnabled;
            }
        } else {
            this.blinkToggle = false;
        }
        this.cursor.x = this.input.mousePointer.worldX - (this.input.mousePointer.worldX%8) - 1;
        this.cursor.y = this.input.mousePointer.worldY - (this.input.mousePointer.worldY%8) - 1;

        var t = Date.now();
        if (t % 840 < 200) {
            if (this.blinkEnabled) {
                this.tvImage.visible = false;
            }
        } else {
            this.tvImage.visible = true;
        }
	},
};

})(this);
