import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";

export class FireWorm extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "fireWorm");
    }

    public startAttackingTarget(): void {
        if (!this.meleeTarget) return;
        this.takeDamage(9999999999);
        this.meleeTarget.takeDamage(this.unitProps.attackDamage);
    }
}