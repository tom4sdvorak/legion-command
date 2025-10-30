export interface UnitProps {
    x: number;
    y: number;
    cost: number;
    speed: number;
    maxHealth: number;
    armor: number;
    damage: number;
    meleeMultiplier: number;
    actionSpeed: number;
    attackRange: number;
    specialRange: number;
    specialCooldown: number;
    specialEnabled: boolean;
    faction: 'red' | 'blue';
    unitID: number;
    spawnTime: number;
    scale: number;
    projectileOffsetY: number;
    bodyWidth: number;
    projectileVelocity: number;
    tags: string[];
}