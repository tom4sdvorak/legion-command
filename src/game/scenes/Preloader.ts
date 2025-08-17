import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            bar.width = 4 + (460 * progress);

        });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.json('animationData', '/data/animations.json');
        this.load.image('logo', 'images/logo.png');
        this.load.image('tower_red', 'images/tower_red.png');
        this.load.image('tower_blue', 'images/tower_blue.png');
        this.load.spritesheet('warrior', 'sprites/warrior/warrior.png',{frameWidth: 192, frameHeight: 192});
        this.load.spritesheet('archer', 'sprites/archer/archer.png',{frameWidth: 192, frameHeight: 192});
        this.load.spritesheet('arrow', 'sprites/projectiles/arrow.png',{frameWidth: 64, frameHeight: 64});
        this.load.image('background', 'images/bg.png');
        this.load.image('ground', 'images/ground.png');
        
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.
        // Creating animations from all sprites
        const animationData = this.cache.json.get('animationData');
        for (const sheetKey in animationData) {
            const sheetAnims = animationData[sheetKey];
            for (const animKey in sheetAnims) {
                const anim = sheetAnims[animKey];
                this.anims.create({
                    key: `${sheetKey}_${animKey}`,
                    frames: this.anims.generateFrameNumbers(sheetKey, anim.frames),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat !== undefined ? anim.repeat : 0
                });
            }
        }
        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
