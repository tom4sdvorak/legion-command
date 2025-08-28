export interface UnitProps {
    x: number;
    y: number;
    cost: number;
    speed: number;
    health: number;
    maxHealth: number;
    attackDamage: number;
    attackSpeed: number;
    specialDamage: number;
    specialRange: number;
    specialSpeed: number;
    faction: 'red' | 'blue';
    unitID: number;
    spawnTime: number;
    offsetY: number;
    scale: number;
    projectileOffsetY: number;
    bodyWidth: number;
    bodyHeight: number;
}