import { AIPlayer } from '../AIPlayer';
import { UnitProps } from '../helpers/UnitProps';
import { Player } from '../Player';

const State = {
    SAVE: 'SAVE',
    ATTACK: 'ATTACK',
    DEFEND: 'DEFEND',
    IDLE: 'IDLE'
};

export class AIController {
    private player: AIPlayer;
    private state: string = State.IDLE;
    private lastDecision: number = 0;
    private difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    private decisionTime: number = 0;
    enemy: Player;

    constructor(parent: AIPlayer, enemy: Player, difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY') {
        this.player = parent;
        this.enemy = enemy;
        this.difficulty = difficulty;

        switch (this.difficulty) {
            case 'EASY':
                this.decisionTime = 5000;
                break;
            case 'MEDIUM':
                this.decisionTime = 3000;
                break;
            case 'HARD':
                this.decisionTime = 1000;
                break;
            default:
                break;
        }
    }

    update(time: number) {
        // Every desired time, reconsider current strategy (state)
        if (time - this.lastDecision > this.decisionTime) {
            this.lastDecision = time;
            this.voteOnStrategy();
        }

        this.handleState();
    }
    handleState() {
        if(this.player.isSpawning) return;
        switch (this.state) {
            case State.IDLE:
                this.idle();
                break;
            case State.ATTACK:
                this.attack()
                break;
            case State.DEFEND:
                this.defend();
                break;
            case State.SAVE:
                this.save();
                break;
            default:
                throw new Error('Invalid state');
        }
        //console.log("I have this many units: " + this.player.ownUnitsPhysics.getChildren().length);
    }

    changeState(state: string) { 
        if(this.state === state) return;
        console.log("AI has decided to " + state);
        this.state = state;
    }

    /**
     * Votes on the best strategy based on the current state of the game and available units.
     */
    private voteOnStrategy() {
        let strategyVote = {
            attack: 0,
            defend: 0,
            save: 0,
        };

        /* ENEMY UNITS VOTE */
        const enemies = this.player.enemyUnitsPhysics.getChildren();
        strategyVote.defend += Math.min(enemies.length * 0.5, 5); // The more enemies the more defensive
        strategyVote.attack += Math.max(5 - enemies.length, -3); // The less enemies the more aggressive

        /* OWN UNITS VOTE */
        const ownUnits = this.player.ownUnitsPhysics.getChildren();
        strategyVote.attack += Math.min(ownUnits.length * 0.5, 5); // The more units we have, the more aggresive to be
        strategyVote.defend += Math.max(5 - ownUnits.length, -3); // The less units we have, the more defensive to be

        /* MONEY VOTE */
        const money = this.player.getMoney();
        if (money <= 200) {
            strategyVote.save += 6 * (1 - money / 200); // At 0 money, vote = 6. At 100 money, vote = 3. At 200 money, vote = 0.
        }
        else if (money > 300) {  
            strategyVote.save += Math.max((300 - money) / 100, -5); // Decreases linearly (-1 vote for every 100 money over 300).
        }

        /* STATE OF THE GAME VOTE */
        if(this.player.getHealth(false) > 0.9) {
            strategyVote.save += 2; // Prefer to save if very healthy   
            strategyVote.attack += 1; // Prefer to attack if very healthy
        }
        else if(this.player.getHealth(false) < 0.3) {
            strategyVote.defend += 1; // Prefer to defend if very hurt
            strategyVote.attack -= 1; // Prefer to not attack if very hurt
        }

        if(this.enemy.getHealth(false) > 0.9) {
            strategyVote.save += 1; // Prefer to save if enemy is very healthy
        }
        else if(this.enemy.getHealth(false) < 0.3) {
            strategyVote.attack += 2; // Prefer to attack if enemy is very hurt
            strategyVote.save -= 1; // Prefer to not save if enemy is very hurt
        }

        /* Decide strategy */
        if (strategyVote.attack > strategyVote.defend && strategyVote.attack > strategyVote.save) {
            this.changeState(State.ATTACK);
        }
        else if (strategyVote.defend >= strategyVote.attack && strategyVote.defend >= strategyVote.save) {
            this.changeState(State.DEFEND);
        }
        else if (strategyVote.save > strategyVote.attack && strategyVote.save > strategyVote.defend) {
            this.changeState(State.SAVE);
        }
        else {
            this.changeState(State.IDLE);
        }

    }

    /**
     * Filters the available units based on a required tag (e.g., 'melee', 'ranged').
     * @param requiredTag The tag to search for.
     * @returns An array of units that contain the required tag.
     */
    private getUnitsByTag(requiredTag: string) : Array<{unitType: string, unitConfig: UnitProps}> {
        return Array.from(this.player.selectedUnits.entries())
        .filter(([unitType, unitData]) => {
            return unitData.unitConfig.tags.includes(requiredTag);
        })
        .map(([unitType, unitData]) => ({
            unitType: unitType,
            unitConfig: unitData.unitConfig
        }));
    }

    /**
     * 
     * @param stat Which stat to check
     * @param highest If should find unit with highest or lowest stat
     * @param unitsToCheck Units to check, all selected units by default
     * @returns Object {unitType: string, unitConfig: UnitProps}
     */
    private getBestUnitByStat(stat: keyof UnitProps, highest: boolean = true, unitsToCheck: Array<{unitType: string, unitConfig: UnitProps}>): {unitType: string, unitConfig: UnitProps} {
        if(highest){
            return unitsToCheck.reduce((prev, curr) => {
                return prev.unitConfig[stat] > curr.unitConfig[stat] ? prev : curr;
            });
        }
        else{
            return unitsToCheck.reduce((prev, curr) => {
                return prev.unitConfig[stat] < curr.unitConfig[stat] ? prev : curr;
            });
        }
        
    }

    idle(){ // Idle strategy - just ocassionally send unit out
        if(this.player.ownUnitsPhysics.getChildren().length > 0){
            return;
        }
        else{
            const unit = this.getBestUnitByStat('cost', false, this.getUnitsByTag('generic'));
            this.player.canAfford(unit.unitConfig.cost) && this.player.addUnitToQueue(unit.unitType);
        }
    }

    attack() { // Offensive strategy - prioritize dps
        let units = this.getUnitsByTag('dps');
        
        if (units.length === 0) {
            units = this.getUnitsByTag('ranged');
            if(units.length === 0) {
                units = this.getUnitsByTag('generic');
            }
        }
        const bestUnit = this.getBestUnitByStat('damage', true, units);
        this.player.canAfford(bestUnit.unitConfig.cost) && this.player.addUnitToQueue(bestUnit.unitType);
    }

    defend(){ // Defensive strategy - prioritize stalling
        let units = this.getUnitsByTag('tank');
        if (units.length === 0) {
            units = this.getUnitsByTag('melee');
            if(units.length === 0) {
                units = this.getUnitsByTag('generic');
            }
        }
        const bestUnit = this.getBestUnitByStat('maxHealth', true, units);
        this.player.canAfford(bestUnit.unitConfig.cost) && this.player.addUnitToQueue(bestUnit.unitType);
    }

    save(){ // Money saving strategy, do not summon units unless necessary
        if(this.player.enemyUnitsPhysics.getChildren().length === 0){
            return;
        }
        else{
            const unit = this.getBestUnitByStat('cost', false, this.getUnitsByTag('generic'));
            this.player.canAfford(unit.unitConfig.cost) && this.player.addUnitToQueue(unit.unitType);
        }
    }
}
