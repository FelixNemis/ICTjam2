(function (scope) {
"use strict";

var ICTJam2 = scope.ICTJam2;
var Phaser = scope.Phaser;

ICTJam2.Boot = function () {
    "use strict";

};

ICTJam2.INITIAL_SCALE = 6;

ICTJam2.Boot.prototype = {
	create: function () {
        "use strict";
		this.game.input.maxPointers = 1;

		this.game.stage.disableVisibilityChange = true;

	    if (this.game.device.desktop)
	    {
		    this.game.stage.scale.pageAlignHorizontally = true;
	    }
	    else
	    {
		    this.game.stage.scaleMode = Phaser.StageScaleMode.SHOW_ALL;
		    this.game.stage.scale.minWidth = 480;
		    this.game.stage.scale.minHeight = 260;
		    this.game.stage.scale.maxWidth = 1024;
		    this.game.stage.scale.maxHeight = 768;
		    this.game.stage.scale.forceLandscape = true;
		    this.game.stage.scale.pageAlignHorizontally = true;
		    this.game.stage.scale.setScreenSize(true);
	    }
        this.game.state.add('Preloader', ICTJam2.Preloader);
        this.game.state.add('Game', ICTJam2.Game);

        this.game.stage.backgroundColor = '#140c1c';

        this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
        this.game.myScaleFactor = ICTJam2.INITIAL_SCALE;
        this.game.scale.setUserScale(ICTJam2.INITIAL_SCALE, ICTJam2.INITIAL_SCALE);

        Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
        this.game.renderer.renderSession.roundPixels = true;


		this.game.state.start('Preloader');
	}
};

})(this);
