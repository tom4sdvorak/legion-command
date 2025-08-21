export interface UnitProps {
    x: number;
    y: number;
    speed: number;
    health: number;
    maxHealth: number;
    attackDamage: number;
    attackRange: number;
    attackSpeed: number;
    specialDamage: number;
    specialRange: number;
    specialSpeed: number;
    faction: 'red' | 'blue';
    unitID: number;
}