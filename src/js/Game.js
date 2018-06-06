(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.TileConst = {
    TERM_OFF: 42,
    TERM_ON: 43,
    ELEVATOR: 45,
    BUG: 47,
};

ICTJam2.CONVENTION_MODE = false;
ICTJam2.CONVENTION_RESET_AFTER = 1000 * 60 * 2; // 2 minutes in miliseconds

ICTJam2.TerrainInfo = {
    1:   {0: 5, 1: 2, 2: 1, 3: 1, 4: 0, 5: 0, 6: 0, 7: 0}, 
    4:   {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 2, 7: 3}, 
    9:   {0: 4, 1: 2, 2: 1, 3: 0, 4: 0, 5: 1, 6: 1, 7: 0},
    39:  {0: false, 1: false, 2: 7, 3: 6, 4: 6, 5: 5, 6: 5, 7: 5},
    40:  {0: 5, 1: 5, 2: 5, 3: 5, 4: 6, 5: 6, 6: 7, 7: false},
    56:  {0: 5, 1: 5, 2: 4, 3: 4, 4: 4, 5: 5, 6: 5, 7: 5},
    243:  {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7},
    245:  {0: 7, 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 0},
    176: {all: 1},
    177: {all: 1},
    192: {all: 1},
};

ICTJam2.gamepadConfig = {
    'h': [0, 2, 4],
    'v': [1, 3, 5],
};

ICTJam2.axisIsHoriz = function (axis) {
    return (ICTJam2.gamepadConfig.h.indexOf(axis) !== -1);
};

var initialLoad = true;

ICTJam2.AxisButtons = function (gamepad, deadzone) {
    this.gamepad = gamepad;
    this.deadzone = deadzone;
    gamepad.callbackContext = this;
    gamepad.onAxisCallback = function (gamepad, axisIndex, value) {
        var axis = ICTJam2.axisIsHoriz(axisIndex) ? this.axisH : this.axisV;
        axis.pos.isDown = false;
        axis.neg.isDown = false;
        if (Math.abs(value) - this.deadzone > 0) {
            var button = (value > 0) ? axis.pos : axis.neg;
            console.log('sending button signal ' + value);
            button.onDown.dispatch();
            button.isDown = true;
        }
    };
    this.axisH = {pos: {isDown: false, onDown: new Phaser.Signal()}, neg: {isDown: false, onDown: new Phaser.Signal()}};
    this.axisV = {pos: {isDown: false, onDown: new Phaser.Signal()}, neg: {isDown: false, onDown: new Phaser.Signal()}};

    this.getButton = function (axis, direction) {
        var axis_ = (axis === 'h') ? this.axisH : this.axisV;
        return (direction === 'pos') ? axis_.pos : axis_.neg;
    };
};

ICTJam2.TouchButton = function (area, input) {
    this.onDown = new Phaser.Signal();
    this.isDown = false;

    this.area = area;
    this.input = input;

    this.input.onDown.add(function () {
        if (this.input.position.x >= this.area.x && this.input.position.y >= this.area.y) {
            if (this.input.position.x < this.area.right && this.input.position.y < this.area.bottom) {
                this.onDown.dispatch();
                this.isDown = true;
            }
        }
    }, this);
    this.input.onUp.add(function () {
        this.isDown = false;
    }, this);
};

ICTJam2.MultiControl = function (inputs, game) {
    this.onDown = new Phaser.Signal();

    this.callMeOnDown = function () { this.onDown.dispatch(); };

    this.addNewInput = function (input) {
        if (input !== null && typeof input === 'object') {
            if (!input.hasOwnProperty('isDown') || !input.hasOwnProperty('onDown')) {
                console.log('invalid button passed to MultiControl');
                return;
            } else {
                this.inputs.push(input);
            }
        } else {
            this.inputs.push(game.input.keyboard.addKey(input));
        }

        this.inputs[this.inputs.length - 1].onDown.add(this.callMeOnDown, this);
    };

    this.inputs = [];
    for (var i = 0; i < inputs.length; i++) {
        this.addNewInput(inputs[i]);
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

ICTJam2.WORLD_WIDTH = 208;
ICTJam2.WORLD_HEIGHT = 144;

ICTJam2.Game = function () {
};

ICTJam2.Game.prototype = {
	create: function () {
        this.lastInputTime = this.game.time.now;

        this.onMapLoad = new Phaser.Signal();

        this.devAccess = false;
        this.onMapLoad.add(function () {
            if (this.currentMap !== 'map4' || this.devAccess) {
                return;
            }
            this.map.removeTile(22, 11, 'collision');
            this.map.removeTile(23, 11, 'collision');
            this.map.removeTile(24, 11, 'collision');
        }, this);

        this.TerrainInfo = this.cache.getJSON('terrainInfo');

        //Clean up any references to old groups left over from reseting the game
        this.warps = null;
        this.objects = null;

        // Load initial map
        this.bg = this.add.sprite(0, 0, 'spaceBG');
        this.bg.depthVal = -10;

        this.loadMap('map1');

        this.music = this.game.add.sound('music', 1, true);
        this.music.play();

        this.sfx = {
            boop: this.game.add.sound('boop')
        };

        if (window.muted) {
            this.mute();
        }

        this.player = this.game.add.sprite(103, initialLoad ? -4 : 64, 'tiles', 21);
        initialLoad = false;
        this.player.falling = true;
        this.player.jumping = false;
        this.player.climbing = false;
        this.player.facing = 'right';
        this.player.depthVal = 2;
        this.player.game = this;

        this.player.canFall = function () {
            return !this.jumping && !this.climbing && !this.onElevator;
        };
        this.player.feet = function () {
            return new Phaser.Point(this.centerX, this.bottom);
        };
        this.player.checkLedge = function () {
            var pos = this.feet();
            pos.y = pos.y - 4;
            var vertOffset = pos.y % 8;
            var collisionHeight = null;

            if (vertOffset === 0 || vertOffset === 7) {
                var lowerTile = this.game.getTileBelow(pos);
                if (lowerTile && lowerTile.collideUp) {
                    collisionHeight = this.game.getTileCollisionHeight(lowerTile.index - 1, pos.x%8);
                    if (collisionHeight === 0) {
                        return (vertOffset === 7) ? 1 : 0;
                    }
                    if (vertOffset === 0 && collisionHeight === 1) {
                        return 1;
                    }
                }
            }
            var tile = this.game.getTileAt(pos);
            if (tile && tile.collideUp) {
                collisionHeight = this.game.getTileCollisionHeight(tile.index - 1, pos.x%8);
                if (collisionHeight === vertOffset || collisionHeight === vertOffset - 1 || collisionHeight === vertOffset + 1) {
                    return collisionHeight - vertOffset;
                }
            }
            return false;
        };
        this.player.checkFloor = function () {
            var tile;
            if (this.bottom%8 === 0) {
                tile = this.game.getTileBelow(this.feet());
                if (tile && tile.collideUp) {
                    return true;
                }
            } else {
                tile = this.game.getTileAt(this.feet());
                if (tile && tile.collideUp) {
                    return true;
                }
            }
            return false;
        };
        this.player.inBounds = function () {
            var x = this.feet().x;
            return x >= 0 && x < this.game.world.width;
        };

        this.game.world.sort('depthVal');

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

        var leftButtons = [Phaser.Keyboard.LEFT];
        var rightButtons = [Phaser.Keyboard.RIGHT];
        var downButtons = [Phaser.Keyboard.DOWN];
        var upButtons = [Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.UP];
        if (this.game.input.gamepad.supported) {
            this.game.input.gamepad.start();
            var axisButtons = new ICTJam2.AxisButtons(this.input.gamepad.pad1, 0);

            leftButtons.push(axisButtons.getButton('h', 'neg'));
            rightButtons.push(axisButtons.getButton('h', 'pos'));
            upButtons.push(axisButtons.getButton('v', 'neg'));
            downButtons.push(axisButtons.getButton('v', 'pos'));

            upButtons.push(this.game.input.gamepad.pad1.getButton(1));
        }

        this.input.keyboard.addCallbacks(this, function () {
            this.lastInputTime = this.game.time.now;
        });
        this.input.onDown.add(function () {
            this.lastInputTime = this.game.time.now;
        }, this);

        this.controls = {
            left: new ICTJam2.MultiControl(leftButtons, this.game),
            right: new ICTJam2.MultiControl(rightButtons, this.game),
            down: new ICTJam2.MultiControl(downButtons, this.game),
            jump: new ICTJam2.MultiControl(upButtons, this.game),
            mute: new ICTJam2.MultiControl([Phaser.Keyboard.M], this.game),
            misc: new ICTJam2.MultiControl([Phaser.Keyboard.S], this.game),
            interact: new ICTJam2.MultiControl([Phaser.Keyboard.Z, Phaser.Keyboard.X, Phaser.Keyboard.C, Phaser.Keyboard.V], this.game),
            reset: new ICTJam2.MultiControl([Phaser.Keyboard.R], this.game),
        };

        this.controls.mute.onDown.add(function () {
            window.muteToggle();
        }, this);

        // Touch Controls
        this.touchButtonLeft = new ICTJam2.TouchButton(new Phaser.Rectangle(0, 40, ICTJam2.WORLD_WIDTH/2, ICTJam2.WORLD_HEIGHT - 40), this.input);
        this.controls.left.addNewInput(this.touchButtonLeft);
        this.touchButtonRight = new ICTJam2.TouchButton(new Phaser.Rectangle(ICTJam2.WORLD_WIDTH/2, 40, ICTJam2.WORLD_WIDTH/2, ICTJam2.WORLD_HEIGHT - 40), this.input);
        this.controls.right.addNewInput(this.touchButtonRight);
        this.touchButtonJump = new ICTJam2.TouchButton(new Phaser.Rectangle(0, 0, ICTJam2.WORLD_WIDTH, 40), this.input);
        this.controls.jump.addNewInput(this.touchButtonJump);

        this.controls.misc.onDown.add(function () {
            if (!this.devAccess) {
                this.sfx.boop.play();
                this.devAccess = true;
                if (!ICTJam2.CONVENTION_MODE) {
                    this.game.time.advancedTiming = true;
                }
            }
        }, this);

        this.interactHeld = false;
        this.objSpawnTime = 0;

        //this.game.world.sort('depthVal');
	},

    loadMap: function (map) {
        this.currentMap = map;

        // Get the animated tile data from the Tiled JSON
        var mapJSON = this.cache.getTilemapData(map).data;
        var tSet = mapJSON.tilesets.filter(function (ts) {
            return ts.name === 'tiles';
        });
        var allTileData = tSet[0].tiles;
        var animTileData = {};
        for (var i in allTileData) {
            if (allTileData.hasOwnProperty(i)) {
                if (allTileData[i].hasOwnProperty('animation')) {
                    animTileData[i] = allTileData[i].animation;
                }
            }
        }

        this.map = this.game.add.tilemap(map);
        this.animatedMap = new ICTJam2.AnimatedTilemap(this, this.map, animTileData, 'tiles_img');
        //this.tsImg = this.map.addTilesetImage('tiles', this.tileTexture);
        //this.map.addTilesetImage('tiles');
        this.collisionLayer = this.map.createLayer('collision');
        this.collisionLayer.depthVal = 0;
        this.setCollisionFlags();

        //this.bgLayer = this.map.createLayer('bg');
        //this.bgLayer = new ICTJam2.AnimatedTilemap(this, this.tsImg, this.map, 'bg', animTileData);
        this.bgLayer = this.animatedMap.createLayer('bg');
        this.bgLayer.depthVal = -4;
        this.world.add(this.bgLayer);

        this.world.remove(this.collisionLayer); // TODO just use the map for looking up tiles, since we don't use it for rendering anymore
        //this.collisLayerSprite = new ICTJam2.AnimatedTilemap(this, this.tsImg, this.map, 'collision', animTileData);
        this.collisLayerSprite = this.animatedMap.createLayer('collision');
        this.collisLayerSprite.depthVal = 0;
        this.world.add(this.collisLayerSprite);

        this.bg.visible = false;
        mapJSON.layers.forEach(function (layer) {
            if (layer.type === "imagelayer" && layer.name === "stars") {
                this.bg.visible = true;
            }
        }, this);

        this.fgLayer = this.map.createLayer('fg');
        this.fgLayer.depthVal = 4;

        if (!this.warps) {
            this.warps = this.game.add.group();
            this.warps.visible = false;
        }
        this.map.createFromObjects('warps', 'warp', 'nothing', null, true, false, this.warps, Phaser.Sprite, false);

        if (!this.objects) {
            this.objects = this.game.add.group();
        }
        var portals = this.map.objects.warps.filter(function (warp) {
            //return warp.type === 'portal';
            return false;
        });
        portals.forEach(function (portalObj) {
            var portalSprite = this.objects.create(portalObj.x, portalObj.y, 'tiles', 59);
            portalSprite.animations.add('spin', [59, 60, 61, 62, 63, 75, 76, 77], 10, true);
            portalSprite.animations.play('spin');
        }, this);

        if (this.map.objects.hasOwnProperty('entities')) {
            var entities = this.map.objects.entities.filter(function (ent) {
                return ent.type === 'entity';
            });
            var spawnBug = this.spawnBug.bind(this);
            entities.forEach(function (entObj) {
                if (entObj.properties.entity === 'bug') {
                    spawnBug(entObj.x, entObj.y, entObj.properties);
                }
            }, this);
        }
        this.objects.depthVal = 1;

        this.game.world.sort('depthVal');

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
        this.animatedMap.destroy();
        this.bgLayer.destroy();
        this.collisionLayer.destroy();
        this.fgLayer.destroy();

        this.collisLayerSprite.destroy();

        this.warps.removeAll(true);

        this.objects.removeAll(true);
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

    setCollisionFlags: function () {
        var collisionTop = Object.getOwnPropertyNames(this.TerrainInfo);
        for (var i = 0; i < this.collisionLayer.width; i++) {
            for (var j = 0; j < this.collisionLayer.height; j++) {
                var tile = this.map.getTile(i, j, 'collision');
                if (!tile) {
                    continue;
                }
                if (collisionTop.indexOf((tile.index - 1)+"") !== -1) {
                    tile.collideUp = true;
                }
            }
        }
    },

    getTileCollisionHeight: function (tileIndex, horizOffset) {
        horizOffset = Math.floor(horizOffset);
        if (!this.TerrainInfo.hasOwnProperty(tileIndex)) {
            return 0;
        }
        if (this.TerrainInfo[tileIndex].hasOwnProperty('all')) {
            return this.TerrainInfo[tileIndex].all;
        }
        return this.TerrainInfo[tileIndex][horizOffset];
    },

    collisionCheck: function (entity) {
        var coords = entity.feet();

        var vertOffset = coords.y%8;

        var horizOffset = coords.x%8;
        
        var tile = (vertOffset === 0) ? this.getTileBelow(coords) : this.getTileAt(coords);
        if (entity.falling) {
            if (tile && tile.collideUp) {
                if (vertOffset === this.getTileCollisionHeight(tile.index - 1, horizOffset)) {
                    entity.falling = false;
                }
            }
        } else if (entity.walked) {
            if (vertOffset === 0) {
                var tileAbove = this.getTileAt(coords);
                if (tileAbove && tileAbove.collideUp) {
                    var collisionHeight2 = this.getTileCollisionHeight(tileAbove.index - 1, horizOffset);
                    if (collisionHeight2 === 7) {
                        entity.y -= 1;
                        entity.walked = false;
                        return;
                    }
                }
            } 
            if (tile && tile.collideUp) {
                var collisionHeight = this.getTileCollisionHeight(tile.index - 1, horizOffset);
                if (vertOffset !== collisionHeight) {
                    if (Math.abs(vertOffset - collisionHeight) < 2) {
                        entity.y -= vertOffset - collisionHeight;
                    } else {
                        entity.falling = true;
                    }
                }
            }
            entity.walked = false;
        }
    },

	update: function () {
        if (this.controls.reset.isDown()) {
            this.resetGame();
        }
        if (ICTJam2.CONVENTION_MODE && this.game.time.now - this.lastInputTime > ICTJam2.CONVENTION_RESET_AFTER) {
            this.returnToTitle();
        }
        if (this.logicPaused) {
            return;
        }

        if (this.animatedMap) {
            this.animatedMap.update();
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
            this.player.frame = this.playerFrame(1, this.player.facing);
            if (this.player.y - 8 > this.game.world.height) {
                this.respawn();
            }
            this.collisionCheck(this.player);
            /*
            if (this.player.checkFloor() && this.player.bottom%8 < 0.5) {
                this.player.falling = false;
                console.log(this.player.y%8);
            }
            */
        } else {
            var velocity = this.game.time.physicsElapsed * 40;

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

            if (this.player.canFall()) {
                if (!this.player.checkFloor() && this.player.inBounds()) {
                    this.player.falling = true;
                    //console.log('falling for you');
                }
            }

            var leftDown = this.controls.left.isDown();
            var rightDown = this.controls.right.isDown();
            if (this.player.falling) {
                return;
                // don't do any of these other things
            } else if (this.player.jumping) {
                this.player.jumping = true;
            } else if (this.player.climbing) {
                if (this.player.startClimbing) {
                    if (this.player.climbTime + 200 < this.game.time.now) {
                        this.player.y = this.player.y - 1;
                        this.player.frame = this.playerFrame(2, this.player.facing);

                        this.player.startClimbing = false;
                        this.player.climbTime = this.game.time.now;
                    }
                } else {
                    if (this.player.climbTime + 200 < this.game.time.now) {
                        this.player.y = this.player.y - 4;
                        this.player.animations.play('stand_up_' + this.player.facing);

                        this.player.climbing = false;
                    }
                }
            } else if (leftDown || rightDown && !(leftDown && rightDown)) {
                this.player.oldX = this.player.x;
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
                this.player.walked = true;
                this.collisionCheck(this.player);
            } else {
                if (this.controls.jump.isDown() && !this.player.onElevator) {
                    this.player.jumping = true;
                    this.player.animations.play('jump_' + this.player.facing);
                    var anim = this.player.animations.currentAnim;
                    var onDone = function () {
                        this.player.y -= 4;
                        this.player.animations.frame = this.playerFrame(0, this.player.facing);
                        this.player.jumping = false;
                        var ledgeVal = this.player.checkLedge();
                        if (ledgeVal !== false) {
                            this.player.climbing = true;
                            this.player.y += ledgeVal;
                            this.player.climbingStart = true;
                            this.player.climbTime = this.game.time.now;
                        } else {
                            this.player.y += 2;
                            ledgeVal = this.player.checkLedge();
                            if (ledgeVal !== false) {
                                this.player.climbing = true;
                                this.player.y += ledgeVal;
                                this.player.climbingStart = true;
                                this.player.climbTime = this.game.time.now;
                            } else {
                                this.player.y -= 3;
                                this.player.falling = true;
                            }
                            //this.player.falling = true;
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

            if (ICTJam2.CONVENTION_MODE) {
                setTimeout(this.returnToTitle.bind(this), 10000); // reset after 10 seconds in convention mode
            }
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

    elevatorExists: function () {
        return this.objects.filter(function (obj) {
            return obj.name === 'elevator';
        }).total > 0;
    },

    spawnElevator: function (x, y, targetY) {
        if (this.elevatorExists()) {
            return;
        }
        this.sfx.boop.play();
        this.objSpawnTime = this.game.time.now;
        var elevator = this.objects.create(x, y, 'tiles', ICTJam2.TileConst.ELEVATOR - 1);
        elevator.name = "elevator";
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
                if (xInRange && Math.abs(this.state.player.feet().y - this.y) < 4) {
                    this.state.player.y = this.y - 8;
                    this.state.player.onElevator = true;
                    this.state.player.pushedThisFrame = true;
                    this.state.player.falling = false;
                }

                if (this.y <= this.targetY) {
                    this.destroy();
                }
            }
        };
    },

    spawnBug: function (x, y, properties) {
        var bug = this.objects.create(x, y, 'tiles', ICTJam2.TileConst.BUG - 1);
        bug.originX = x;
        bug.originY = y;
        bug.animations.add('copter', [ICTJam2.TileConst.BUG, ICTJam2.TileConst.BUG - 1], 20, true);
        bug.animations.play('copter');
        bug.name = "Fred";
        bug.gameState = this;
        bug.time = 0;

        bug.reverse = 1;
        if (properties.hasOwnProperty('reverse') && properties.reverse !== 'false') {
            bug.reverse = -1;
        }

        if (properties.hasOwnProperty('offset')) {
            bug.time += properties.offset * Math.PI;
        }

        bug.update = function () {
            this.time += this.gameState.time.physicsElapsed;

            //First check if player is on top
            var xInRange = this.gameState.player.centerX > this.x && this.gameState.player.centerX < this.right;
            var yInRange = this.gameState.player.centerY + 4 === this.y;

            //Now move
            var oldX = this.x;
            var oldY = this.y;
            this.x = Math.round(this.originX + (Math.sin(this.time * this.reverse) * 20));
            this.y = Math.round(this.originY + (Math.cos(this.time * this.reverse) * 20));
            var deltaX = this.x - oldX;
            var deltaY = this.y - oldY;

            //update player if they were on top
            if (xInRange && yInRange) {
                console.log('moving player');
                var playerOrigPos = this.gameState.player.position;
                this.gameState.player.x = playerOrigPos.x + deltaX;
                this.gameState.player.y = this.y-8;
                this.gameState.player.onElevator = true;
                this.gameState.player.pushedThisFrame = true;
                this.gameState.player.falling = false;
            }
            /*
            if (!this.waiting) {
                this.y -= 0.5;
                if (xInRange && Math.abs(this.gameState.player.feet().y - this.y) < 4) {
                    this.gameState.player.y = this.y - 8;
                    this.gameState.player.onElevator = true;
                    this.gameState.player.pushedThisFrame = true;
                    this.gameState.player.falling = false;
                }

                if (this.y <= this.targetY) {
                    this.destroy();
                }
            }
            */
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

    posToTileCoord: function (pos) {
        return {x: this.collisionLayer.getTileX(pos.x), y: this.collisionLayer.getTileY(pos.y)};
    },

    getTileAt: function (pos) {
        return this.map.getTile(this.collisionLayer.getTileX(pos.x), this.collisionLayer.getTileY(pos.y - 1), 'collision');
    },

    getTileBelow: function (pos) {
        var tileX = this.collisionLayer.getTileX(pos.x);
        var tileY = this.collisionLayer.getTileY(pos.y-1);
        if (tileY + 1 > this.map.height) {
            return null;
        }
        return this.map.getTile(tileX, tileY + 1, 'collision');
    },

    render: function () {
        if (this.game.time.advancedTiming) {
            this.game.debug.text(this.game.time.fps, 2, 14, "#00ff00");
        }
    },

    respawn: function () {
        this.reloadMap();
    },

    resetGame: function () {
        this.music.stop();
        this.game.state.start("Game");
    },

    returnToTitle: function () {
        this.music.stop();
        initialLoad = true;
        this.game.state.start("Title");
    }
};

})(this);
