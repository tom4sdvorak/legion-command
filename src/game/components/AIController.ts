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
        switch (this.state) {
            case State.IDLE:
                this.idle();
                break;
            case State.ATTACKING:
                this.attack()
                break;
            case State.DEFENDING:
                this.defend();
                break;
            case State.LOSING:
                this.defendDesperately();
                break;
            case State.DEAD:
                break;
            default:
                break;
        }
        //console.log("I have this many units: " + this.player.ownUnitsPhysics.getChildren().length);
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

    }

    /**
     * Filters the available units based on a required tag (e.g., 'melee', 'ranged').
     * @param requiredTag The tag to search for.
     * @returns An array of units that contain the required tag.
     */
    private getUnitsByTag(requiredTag: string) : Array<{unitType: string, unitConfig: UnitProps}> {
        return this.player.selectedUnits.filter(unitData => {
            // unitData.unitConfig.tags is string[] array (e.g., ['generic', 'melee', 'warrior'])
            return unitData.unitConfig.tags.includes(requiredTag);
        });
    }

    idle(){ // Idle strategy - just ocassionally send unit out
        if (this.player.canAfford(10) &&  this.player.ownUnitsPhysics.getChildren().length < 1){
            this.player.addUnitToQueue('warrior');
        }
    }

    attack() { // Offensive strategy - prioritize spamming melee/ranged combo
        if (this.player.canAfford(20)){
            if(this.player.ownUnitsPhysics.getLast(true) && this.player.ownUnitsPhysics.getLast(true).unitType === 'warrior'){
                this.player.addUnitToQueue('archer');
            }
            else{
                this.player.addUnitToQueue('warrior');
            }
            
        }
    }

    defend(){ // Defensive strategy - prioritize single melee/healer combo to protect base
        if (this.player.canAfford(20) && this.player.ownUnitsPhysics.getChildren().length < 3){ 
            if(this.player.ownUnitsPhysics.getLast(true) && this.player.ownUnitsPhysics.getLast(true).unitType === 'warrior'){
                this.player.addUnitToQueue('healer');
            }
            else{
                this.player.addUnitToQueue('warrior');
            }
        }
    }

    defendDesperately(){ // Losing defensive strategy - prioritize spamming melee/healer combo
        if (this.player.canAfford(20)){ // If player can afford units and has space in queue
            if(this.player.ownUnitsPhysics.getLast(true) &&this.player.ownUnitsPhysics.getLast(true).unitType === 'warrior'){
                this.player.addUnitToQueue('healer');
            }
            else{
                this.player.addUnitToQueue('warrior');
            }
        }
    }
}
