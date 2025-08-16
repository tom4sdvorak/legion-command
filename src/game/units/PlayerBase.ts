import { Unit } from "./Unit";

export class PlayerBase {
    health: number;
    faction: 'red' | 'blue';
    sprite: Phaser.Physics.Arcade.Sprite
    yOffset: number; // How high from groundLevel to spawn
    proximityZone: Phaser.GameObjects.Shape;
    enemiesInRange: Unit [] = [];
    attackDamage: number = 50;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    scene: Phaser.Scene;

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', spawnPosition: Phaser.Math.Vector2, unitsPhysics: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.health = 1000;
        this.faction = faction;
        this.yOffset = -80;
        if(faction == 'red'){
            this.sprite = scene.physics.add.sprite(spawnPosition.x, spawnPosition.y+this.yOffset, 'tower_red');
        }
        else{
            this.sprite = scene.physics.add.sprite(spawnPosition.x, spawnPosition.y+this.yOffset, 'tower_blue');
        }
        this.sprite.setData('parent', this);
        // Create circle around base to detect units
        this.proximityZone = scene.add.circle
            (
                this.sprite.x,
                this.sprite.y,
                200, // radius
                0xffffff, // fill color
                0.5 // alpha
            );
        scene.physics.add.existing(this.proximityZone, true); 

        //TEST: Add visible overlap checking rectangle
        /*const myRect = this.scene.add.rectangle(this.sprite.x-this.sprite.width/2, this.sprite.y-this.sprite.height/2, this.sprite.width, this.sprite.height, 0xff0000, 0.5);
        myRect.setOrigin(0,0);
        console.log("Created overlap with x position from " + this.sprite.x + " to " + (this.sprite.x+this.sprite.width));*/

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
            this.sprite.setImmovable(true);
            this.sprite.setPushable(false);
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

    public isBlocked(): boolean{
        let overlap = this.scene.physics.overlapRect(this.sprite.x-this.sprite.width/2, this.sprite.y-this.sprite.height/2, this.sprite.width, this.sprite.height, true, false);      
        return overlap.length > 1;
    }

}
