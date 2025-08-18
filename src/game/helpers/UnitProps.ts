export interface UnitProps {
    x: number;
    y: number;
    speed: number;
    health: number;
    attackDamage: number;
    attackRange: number;
    attackSpeed: number;
    faction: 'red' | 'blue';
    unitID: number;
    type: 'ranged' | 'melee';
}