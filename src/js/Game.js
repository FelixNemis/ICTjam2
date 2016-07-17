(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.TileConst = {
    TERM_OFF: 42,
    TERM_ON: 43,
    ELEVATOR: 45,
};

ICTJam2.MultiControl = function (inputs, game) {
    this.inputs = [];
    for (var i = 0; i < inputs.length; i++) {
        this.inputs.push(game.input.keyboard.addKey(inputs[i]));
    }

    this.isDown = function () {
        var anyDown = false;
        this.inputs.forEach(function (input) {
            if (input.isDown) {
                anyDown = true;
            }
        });
        return anyDown;
    };
};

ICTJam2.Game = function () {
};

ICTJam2.Game.prototype = {
	create: function () {
        this.onMapLoad = new Phaser.Signal();
        this.loadMap('map1');

        this.music = this.game.add.sound('music', 1, true);
        this.music.play();

        this.sfx = {
            boop: this.game.add.sound('boop')
        };

        if (window.muted) {
            this.mute();
        }

        this.player = this.game.add.sprite(4, 94, 'tiles', 21);
        this.player.falling = true;
        this.player.jumping = false;
        this.player.facing = 'right';
        this.player.z = 2;

        this.game.world.sort();

        this.lastSpawn = new Phaser.Point(4, 94);

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
            left: new ICTJam2.MultiControl([Phaser.Keyboard.LEFT], this.game),
            right: new ICTJam2.MultiControl([Phaser.Keyboard.RIGHT], this.game),
            down: new ICTJam2.MultiControl([Phaser.Keyboard.DOWN], this.game),
            jump: new ICTJam2.MultiControl([Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.UP], this.game),
            misc: new ICTJam2.MultiControl([Phaser.Keyboard.S], this.game),
            interact: new ICTJam2.MultiControl([Phaser.Keyboard.Z, Phaser.Keyboard.X, Phaser.Keyboard.C, Phaser.Keyboard.V], this.game),
            reset: new ICTJam2.MultiControl([Phaser.Keyboard.R], this.game),
        };

        this.interactHeld = false;
        this.objSpawnTime = 0;

        //this.game.world.sort();
	},

    loadMap: function (map) {
        this.currentMap = map;

        this.map = this.game.add.tilemap(map);
        this.map.addTilesetImage('tiles');
        this.bgLayer = this.map.createLayer('bg');
        this.bgLayer.z = -4;
        this.collisionLayer = this.map.createLayer('collision');
        this.collisionLayer.z = 0;
        this.setCollisionFlags();

        this.fgLayer = this.map.createLayer('fg');
        this.fgLayer.z = 4;

        if (!this.warps) {
            this.warps = this.game.add.group();
        }
        this.map.createFromObjects('warps', 'warp', 'nothing', null, true, false, this.warps, Phaser.Sprite, false);

        if (!this.objects) {
            this.objects = this.game.add.group();
        }
        if (map === 'map5') {
            var portal = this.objects.create(82, 96, 'tiles', 59);
            portal.animations.add('spin', [59, 60, 61, 62, 63, 91, 92, 93], 10, true);
            portal.animations.play('spin');
        }
        this.objects.z = 1;

        this.game.world.sort();

        this.onMapLoad.dispatch();
    },

    warp: function (warp) {
        this.cleanMap();
        this.loadMap(warp.destination);
        if (warp.hasOwnProperty('destX')) {
            this.player.x = Math.round(warp.destX);
        }
        if (warp.hasOwnProperty('destY')) {
            this.player.y = Math.round(warp.destY);
        }
        if (warp.hasOwnProperty('destDir')) {
            this.player.facing = warp.destDir;
        }

        this.lastSpawn = this.player.position.clone();
    },

    reloadMap: function () {
        this.warp({destination: this.currentMap, destX: this.lastSpawn.x, destY: this.lastSpawn.y});
    },

    cleanMap: function () {
        this.map.destroy();
        this.bgLayer.destroy();
        this.collisionLayer.destroy();
        this.fgLayer.destroy();

        this.warps.removeAll(true);

        this.objects.removeAll(true);

        this.state.elevatorExists = false;
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
        var collisionTop = [1, 2, 3, 4, 5, 6, 7, 8, 73, 74, 75, 76, 77, 78, 84, 85, 86, 87, 88];
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
        if (this.controls.reset.isDown()) {
            this.resetGame();
        }
        if (this.logicPaused) {
            return;
        }

        this.warps.forEach(function (warp) {
            if (this.player.centerX < warp.x || this.player.centerX > warp.right) {
                return;
            }
            if (this.player.centerY < warp.y || this.player.centerY > warp.bottom) {
                return;
            }
            this.warp(warp);
        }, this);

        if (this.player.x < -16 || this.player.right > this.game.world.width + 16) {
            this.respawn();
        }

        if (this.player.falling) {
            this.player.y += 0.5;
            this.player.animations.stop();
            if (this.player.y - 8 > this.game.world.height) {
                this.respawn();
            }
            var tile = this.getTileBelow(this.playerFeet());
            if (tile && tile.collideUp && this.player.bottom%8 < 0.5) {
                this.player.falling = false;
            }
        } else {
            var velocity = this.game.time.physicsElapsed * 30;

            if (this.controls.interact.isDown()) {
                if (!this.interactHeld) {
                    this.interactHeld = true;
                    this.interactHandler();
                }
            } else if (this.interactHeld) {
                this.interactHeld = false;
            }

            if (this.player.pushedThisFrame) {
                this.player.pushedThisFrame = false;
            } else {
                this.player.onElevator = false;
            }

            var leftDown = this.controls.left.isDown();
            var rightDown = this.controls.right.isDown();
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

                var offSide = this.player.x < 0 || this.player.right > this.game.world.width;
                var newFloor = this.getTileBelow(this.playerFeet());
                if (!this.player.onElevator && !offSide && (!newFloor || !newFloor.collideUp)) {
                    this.player.falling = true;
                }
            } else {
                if (this.controls.jump.isDown() && !this.player.onElevator) {
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
                } else if (this.controls.down.isDown()) {
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

        if (this.player.y < -8) {
            this.endSprite = this.game.add.sprite(0, 0, 'end');
            //this.endSprite.alpha = 0;

        }
	},

    interactHandler: function () {
        var tile = this.getTileAt({x: this.player.centerX, y: this.player.centerY});
        if (tile && tile.index === ICTJam2.TileConst.TERM_ON) {
            this.activateTerm();
        }
    },

    activateTerm: function () {
        if (this.currentMap === 'map3') {
            this.sfx.boop.play();
            this.onMapLoad.add(function () {
                if (this.currentMap !== 'map1') {
                    return;
                }
                this.map.replace(ICTJam2.TileConst.TERM_OFF, ICTJam2.TileConst.TERM_ON, 0, 0, this.map.width, this.map.height, 'collision');
            }, this);
        }
        if (this.currentMap === 'map4') {
            this.sfx.boop.play();
            this.onMapLoad.add(function () {
                if (this.currentMap !== 'map6') {
                    return;
                }
                this.map.replace(ICTJam2.TileConst.TERM_OFF, ICTJam2.TileConst.TERM_ON, 0, 0, this.map.width, this.map.height, 'collision');
            }, this);
        }
        if (this.currentMap === 'map1') {
            this.spawnElevator(32, 112, 80);
        }
        if (this.currentMap === 'map6') {
            this.spawnElevator(92, 80, -80);
        }
    },

    spawnElevator: function (x, y, targetY) {
        if (this.elevatorExists) {
            return;
        }
        this.sfx.boop.play();
        this.elevatorExists = true;
        this.objSpawnTime = this.game.time.now;
        var elevator = this.objects.create(x, y, 'tiles', ICTJam2.TileConst.ELEVATOR - 1);
        elevator.state = this;
        elevator.targetY = targetY;
        elevator.waiting = true;

        elevator.update = function () {
            var xInRange = this.state.player.centerX > this.x && this.state.player.centerX < this.right;
            if (xInRange) {
                this.waiting = false;
            }
            if (!this.waiting) {
                this.y -= 0.5;
                if (xInRange && Math.abs(this.state.playerFeet().y - this.y) < 4) {
                    this.state.player.y = this.y - 8;
                    this.state.player.onElevator = true;
                    this.state.player.pushedThisFrame = true;
                    this.state.player.falling = false;
                }

                if (this.y <= this.targetY) {
                    this.state.elevatorExists = false;
                    this.destroy();
                }
            }
        };
    },

    mute: function () {
        this.music.volume = 0;
        this.sfx.boop.volume = 0;
    },

    unmute: function () {
        this.music.volume = 1;
        this.sfx.boop.volume = 1;
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
        this.reloadMap();
    },

    resetGame: function () {
        this.music.stop();
        this.game.state.start("Game");
    }
};

})(this);
