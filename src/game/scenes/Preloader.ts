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
        // Load data jsons
        this.load.setPath('src/game/config');
        this.load.json('unitData', 'unitData.json');
        this.load.json('unitUpgrades', 'unitUpgrades.json');
        this.load.json('potionData', 'potionData.json');
        this.load.json('constructionData', 'constructionData.json');

        this.load.setPath('assets');
        this.load.bitmapFont('pixelFont', 'fonts/BoldPixels.png', 'fonts/BoldPixels.xml');
        this.load.json('animationData', 'data/animations.json');
        this.load.image('single_pixel', 'images/single_pixel.png');
        this.load.image('background', 'images/bg.png');
        this.load.atlas('mineBase', 'images/buildings/mine/texture.png', 'images/buildings/mine/texture.json');
        

        // Objects
        this.load.setPath('assets/images/items');
        this.load.image('signpost', 'signpost.png');
        this.load.image('coin', 'coin.png');
        this.load.image('cog', 'cog.png');
        this.load.image('tent', 'tent.png');
        this.load.image('tent_large', 'tent_large.png');
        this.load.image('tower', 'tower.png');
        this.load.image('tower_frontlayer', 'tower_frontlayer.png');
        this.load.image('poles', 'poles.png');

        // UI
        this.load.setPath('assets/images/UI');
        this.load.image('UI_border', 'UI_border.png');
        this.load.image('UI_bg_lighter', 'UI_bg_lighter.png');
        this.load.image('UI_bg_darker', 'UI_bg_darker.png');

        // Backgrounds
        this.load.setPath('assets/images/backgrounds');
        this.load.image('pregamelayer1', 'nature/pregame/1.png');
        this.load.image('pregamelayer2', 'nature/pregame/2.png');
        this.load.image('pregamelayer3', 'nature/pregame/3.png');
        this.load.image('pregamelayer4', 'nature/pregame/4.png');
        this.load.image('pregamelayer5', 'nature/pregame/5.png');
        this.load.image('bglayer1', 'nature/1.png');
        this.load.image('bglayer2', 'nature/2.png');
        this.load.image('bglayer3', 'nature/3.png');
        this.load.image('bglayer4', 'nature/4b.png');
        this.load.image('bglayer5', 'nature/5b.png');


        // Unit sprites
        this.load.setPath('assets/sprites/units');
        this.load.spritesheet('warrior', 'warrior/sprite_sheet.png',{frameWidth: 184, frameHeight: 126});
        this.load.image('warrior_static', 'warrior/static.png');
        this.load.spritesheet('archer', 'archer/sprite_sheet.png',{frameWidth: 128, frameHeight: 128});
        this.load.image('archer_static', 'archer/static.png');
        this.load.spritesheet('wizard', 'wizard/sprite_sheet.png',{frameWidth: 231, frameHeight: 190});
        this.load.image('wizard_static', 'wizard/static.png');
        this.load.spritesheet('fireWorm', 'fireWorm/sprite_sheet.png',{frameWidth: 90, frameHeight: 90});
        this.load.image('fireWorm_static', 'fireWorm/static.png');
        this.load.spritesheet('gorgon', 'gorgon/sprite_sheet.png',{frameWidth: 128, frameHeight: 128});
        this.load.image('gorgon_static', 'gorgon/static.png');

        // Projectile sprites
        this.load.setPath('assets/sprites/projectiles');
        this.load.spritesheet('arrow', 'arrow/sprite.png',{frameWidth: 30, frameHeight: 5});
        this.load.spritesheet('fireball', 'fireball/sprite_sheet.png',{frameWidth: 46, frameHeight: 46});
        this.load.spritesheet('purpleBall', 'purple ball/sprite_sheet.png',{frameWidth: 50, frameHeight: 50});
        this.load.spritesheet('fireArrow', 'fire arrow/sprite.png',{frameWidth: 42, frameHeight: 7});

        // Other sprites
        this.load.setPath('assets/sprites/other');
        this.load.spritesheet('campfire', 'campfire/sprite_sheet.png',{frameWidth: 32, frameHeight: 32});
        this.load.spritesheet('alchemist', 'alchemist/sprite_sheet.png',{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sawmill', 'sawmill/sprite_sheet.png',{frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('magma', 'magma/sprite_sheet.png',{frameWidth: 381, frameHeight: 186});
        
    }

    create ()
    {
        // Creating animations from all sprites
        const animationData = this.cache.json.get('animationData');

        for (const unitKey in animationData) {
            const unitAnimations = animationData[unitKey];
            for (const animKey in unitAnimations) {
                const anim = unitAnimations[animKey];
                
                // Calculate the end frame based on start and count
                const endFrame = anim.frames.start + anim.frames.count - 1;

                this.anims.create({
                    key: anim.key,
                    frames: this.anims.generateFrameNumbers(unitKey, {
                        start: anim.frames.start,
                        end: endFrame
                    }),
                    frameRate: anim.frameRate,
                    repeat: anim.repeat !== undefined ? anim.repeat : 0,
                    yoyo: anim.yoyo !== undefined ? anim.yoyo : false
                });
            }
        }

        /* Defining animation mixes (delays between two animations) */
        
        // Wizard unit
        this.anims.addMix(`wizard_support_end`, `wizard_run`, 200);
        this.anims.addMix(`wizard_support_end`, `wizard_idle`, 200);
        this.anims.addMix(`wizard_support_end`, `wizard_attack`, 200);
        this.anims.addMix(`wizard_support_end`, `wizard_shoot`, 200);
        this.anims.addMix(`wizard_support_end`, `wizard_death`, 200);


        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
