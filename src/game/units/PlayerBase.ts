import { Warrior } from "./Warrior";

export class PlayerBase {
    health: number;
    faction: 'red' | 'blue';
    sprite: Phaser.Physics.Arcade.Sprite;
    offset: number; // How far from edge of game to spawn
    groundLevel: number; // How low to spawn\
    proximityZone: Phaser.GameObjects.Shape;
    enemiesInRange: Warrior [] = [];
    attackDamage: number = 50;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', unitsPhysics: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.health = 1000;
        this.faction = faction;
        this.offset = 100;
        this.groundLevel = 610;
        if(faction == 'red'){
            this.sprite = scene.physics.add.sprite(this.offset, this.groundLevel, 'tower_red');
        }
        else{
            this.sprite = scene.physics.add.sprite(scene.scale.gameSize.width-this.offset, this.groundLevel, 'tower_blue');
        }

        // Create circle around base to detect units
        this.proximityZone = scene.add.circle
            (
                this.sprite.x,
                this.sprite.y,
                200, // radius
                0xffffff, // fill color
                0.5 // alpha
            );
        scene.physics.add.existing(this.proximityZone);

        // Check for overlap with units
        scene.physics.add.overlap(this.proximityZone, unitsPhysics, (zone, unit) => { 
            if (unit instanceof Phaser.Physics.Arcade.Sprite){
                const parentUnit = unit.getData('parent');
                if(!this.enemiesInRange.includes(parentUnit)){
                    this.enemiesInRange.push(parentUnit);
                    if(!this.isShooting) this.startShooting();
            }
                
            }
        }, () => {}, this);

        if (this.sprite.body) {
            this.sprite.body.pushable = false;
        }
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    public getPosition(): number[] {
        return [this.sprite.x, this.sprite.y];
    }

    public startShooting(): void{
        console.log("Start shooting");
        this.isShooting = true;
        this.shootingTimer = this.scene.time.addEvent({
                delay: this.attackSpeed,
                callback: this.shoot,
                callbackScope: this,
                loop: true
        });
    }

    public shoot(): void{
        if(this.enemiesInRange.length > 0){
            this.enemiesInRange[0].takeDamage(this.attackDamage);
            if(!this.enemiesInRange[0].isAlive()){
                this.enemiesInRange.shift();
            }
        }
        else{
            this.isShooting = false;
            this.shootingTimer?.remove();
            this.shootingTimer = null;
            console.log("Stopped shooting");
        }
    }

}

