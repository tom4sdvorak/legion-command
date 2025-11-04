import { Projectile } from "../projectiles/Projectile";
import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";

export class Archer extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "archer");
    }

    getProjectile(xPos: number, yPos: number) : Projectile{
        const projectile = super.getProjectile(xPos, yPos);
        if(this.unitProps.specialEnabled){
            projectile.penCap++;
        }
        return projectile;
    }
}