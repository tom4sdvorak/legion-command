export interface UnitProps {
    x: number;
    y: number;
    cost: number;
    speed: number;
    maxHealth: number;
    armor: number;
    damage: number;
    actionSpeed: number;
    attackRange: number;
    specialRange: number;
    faction: 'red' | 'blue';
    unitID: number;
    spawnTime: number;
    scale: number;
    projectileOffsetY: number;
    bodyWidth: number;
    bodyHeight: number;
    projectileVelocity: number;
    tags: string[];
}