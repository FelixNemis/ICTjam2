(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.Title = function () {
    "use strict";
};

var makeAParticle = function (game, x, y) {
    "use strict";
    var particle = game.add.sprite(x, y, 'star_particle');
    game.physics.enable(particle);
    particle.body.velocity = new Phaser.Point(0, Math.round(-10 + Math.random() * -20));
    particle.update = function () {
        if (this.y < -2) {
            this.destroy();
        }
    };
    game.particleGroup.add(particle);
};

ICTJam2.Title.prototype = {
	create: function () {
        "use strict";

        this.particleTimeDiff = 30;
        this.lastParticle = 0;

        this.particleGroup = this.game.add.group();

        this.player = this.game.add.sprite(103, 94, 'tiles', 21);
        this.titleImg = this.game.add.sprite(0, 0, 'title');

        this.player.animations.add('flail', [21, 23], 2, true);
        this.player.animations.play('flail');

        //this.physics.gravity = new Phaser.Point(0, 0);

        this.input.keyboard.addCallbacks(this, function () {
            this.game.state.start("Game");
        });
        this.input.onDown.add(function () {
            this.game.state.start("Game");
        }, this);

        // initial stars
        for (var i = 0; i < 300; i++) {
            var randY = Math.random() * this.game.world.height;
            var randX = Math.random() * this.game.world.width;
            makeAParticle(this, randX, randY);
        }
	},

    update: function () {
        while (this.game.time.now - this.lastParticle > this.particleTimeDiff) {
            this.lastParticle += this.particleTimeDiff;
            var randX = Math.random() * this.game.world.width;
            makeAParticle(this, randX, 144);
        }
    }
};

})(this);
