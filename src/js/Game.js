(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.Game = function () {
};

ICTJam2.Game.prototype = {
	create: function () {
        this.game.stage.backgroundColor = '#140c1c';

        this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        this.game.scale.setUserScale(4, 4);

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
        this.game.renderer.renderSession.roundPixels = true;

        this.onMapLoad = new Phaser.Signal();
        this.loadMap('map1');

        this.player = this.game.add.sprite(4, 4, 'tiles', 21);
        this.player.falling = true;
        this.player.jumping = false;
        this.player.facing = 'right';
        this.player.z = 1;

        var walkFrames = [1, 0];
        this.player.animations.add('walk_right', this.playerFrames(walkFrames, 'right'), 10, true);
        this.player.animations.add('walk_left', this.playerFrames(walkFrames, 'left'), 10, true);
        this.player.animations.play('walk_right');

        var standUpFrames = [3, 2, 1, 0]; 
        this.player.animations.add('stand_up_right', this.playerFrames(standUpFrames, 'right'), 18);
        this.player.animations.add('stand_up_left', this.playerFrames(standUpFrames, 'left'), 18);

        var jumpFrames = [0, 1, 2];
        this.player.animations.add('jump_right', this.playerFrames(jumpFrames, 'right'), 18);
        this.player.animations.add('jump_left', this.playerFrames(jumpFrames, 'left'), 18);

        this.logicPaused = false;

        this.controls = {
            left: this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT),
            right: this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT),
            down: this.game.input.keyboard.addKey(Phaser.Keyboard.DOWN),
            jump: this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
            misc: this.game.input.keyboard.addKey(Phaser.Keyboard.S),
            reset: this.game.input.keyboard.addKey(Phaser.Keyboard.R),
        };

        this.game.world.sort();
	},

    loadMap: function (map) {
        this.currentMap = map;
        this.map = this.game.add.tilemap(map);
        this.map.addTilesetImage('tiles');
        this.bgLayer = this.map.createLayer('bg');
        this.bgLayer.z = -1;
        this.collisionLayer = this.map.createLayer('collision');
        this.collisionLayer.z = 0;
        this.setCollisionFlags();

        this.fgLayer = this.map.createLayer('fg');
        this.fgLayer.z = 2;

        this.onMapLoad.dispatch();
    },

    cleanMap: function () {
        this.map.destroy();
        this.bgLayer.destroy();
        this.collisionLayer.destroy();
        this.fgLayer.destroy();
    },

    playerFrames: function (offsets, direction) {
        var newFrames = [];
        for (var i = 0; i < offsets.length; i++) {
            newFrames.push(this.playerFrame(offsets[i], direction));
        }
        return newFrames;
    },

    playerFrame: function (offset, direction) {
        if (typeof direction === 'undefined') {
            return 21 + offset;
        }
        return 21 + ((offset%4)*2) + (direction === 'left' ? 1 : 0);
    },

    playerFeet: function () {
        return new Phaser.Point(this.player.centerX, this.player.bottom);
    },

    setCollisionFlags: function () {
        var collisionTop = [1, 2, 3, 4, 5, 6, 7, 8];
        for (var i = 0; i < this.collisionLayer.width; i++) {
            for (var j = 0; j < this.collisionLayer.height; j++) {
                var tile = this.map.getTile(i, j, 'collision');
                if (!tile) {
                    continue;
                }
                if (collisionTop.indexOf(tile.index - 1) !== -1) {
                    tile.collideUp = true;
                }
            }
        }
    },

	update: function () {
        if (this.controls.reset.isDown) {
            this.resetGame();
        }
        if (this.logicPaused) {
            return;
        }

        if (this.player.falling) {
            this.player.y += 0.5;
            this.player.animations.stop();
            if (this.player.y - 8 > this.game.world.height) {
                this.resetGame();
            }
            var tile = this.getTileBelow(this.playerFeet());
            if (tile && tile.collideUp && this.player.bottom%8 < 0.5) {
                this.player.falling = false;
            }
        } else {
            var velocity = this.game.time.physicsElapsed * 30;

            var leftDown = this.controls.left.isDown;
            var rightDown = this.controls.right.isDown;
            if (this.player.jumping) {
                this.player.jumping = true;
            } else if (this.player.climbing) {
                if (this.player.startClimbing) {
                    if (this.player.climbTime + 200 < this.game.time.now) {
                        this.player.y = Math.floor(this.player.y/8)*8 + 3;
                        this.player.frame = this.playerFrame(2, this.player.facing);

                        this.player.startClimbing = false;
                        this.player.climbTime = this.game.time.now;
                    }
                } else {
                    if (this.player.climbTime + 200 < this.game.time.now) {
                        this.player.y = Math.floor(this.player.y/8)*8;
                        this.player.animations.play('stand_up_' + this.player.facing);

                        this.player.climbing = false;
                    }
                }
            } else if (leftDown || rightDown && !(leftDown && rightDown)) {
                if (leftDown) {
                    if (this.player.animations.paused === true || this.player.animations.currentAnim !== 'walk_left') {
                        this.player.animations.play('walk_left');
                    }
                    this.player.facing = 'left';
                    this.player.x -= velocity;
                } else {
                    if (this.player.animations.paused === true || this.player.animations.currentAnim !== 'walk_right') {
                        this.player.animations.play('walk_right');
                    }
                    this.player.facing = 'right';
                    this.player.x += velocity;
                }

                var newFloor = this.getTileBelow(this.playerFeet());
                if (!newFloor || !newFloor.collideUp) {
                    this.player.falling = true;
                }
            } else {
                if (this.controls.jump.isDown) {
                    this.player.jumping = true;
                    this.player.animations.play('jump_' + this.player.facing);
                    var anim = this.player.animations.currentAnim;
                    var onDone = function () {
                        this.player.y -= 4;
                        this.player.animations.frame = this.playerFrame(0, this.player.facing);
                        this.player.jumping = false;
                        var tile = this.getTileAt(this.playerFeet());
                        if (tile && tile.collideUp) {
                            this.player.climbing = true;
                            this.player.climbingStart = true;
                            this.player.climbTime = this.game.time.now;
                        } else {
                            this.player.falling = true;
                        }
                    };
                    anim.onComplete.addOnce(onDone, this);
                } else if (this.controls.down.isDown) {
                    this.player.y = this.player.y + 1;
                    this.player.falling = true;
                    this.player.frame = this.playerFrame(1, this.player.facing);
                } else {
                    var animName = this.player.animations.currentAnim.name;
                    if (animName.substr(0, 5) === 'walk_') {
                        this.player.animations.stop();
                        this.player.frame = this.playerFrame(0, this.player.facing);
                    }
                }
            }
        }
	},

    getTileAt: function (pos) {
        return this.map.getTile(this.collisionLayer.getTileX(pos.x), this.collisionLayer.getTileY(pos.y), 'collision');
    },

    getTileBelow: function (pos) {
        var tileX = this.collisionLayer.getTileX(pos.x);
        var tileY = this.collisionLayer.getTileY(pos.y-1);
        if (tileY + 1 > this.map.height) {
            return null;
        }
        return this.map.getTile(tileX, tileY + 1, 'collision');
    },

    respawn: function () {
    },

    resetGame: function () {
        this.game.state.start("Game");
    }
};

})(this);
