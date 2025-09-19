import { AIPlayer } from '../AIPlayer';
import { Player } from '../Player';

const State = {
    IDLE: 'idle',
    ATTACKING: 'attacking',
    DEFENDING: 'defending',
    LOSING: 'losing',
    DEAD: 'dead'
};

export class AIController {
    private player: AIPlayer;
    private state: string = State.IDLE;
    private lastDecision: number = 0;
    enemy: Player;

    constructor(parent: AIPlayer, enemy: Player) {
        this.player = parent;
        this.enemy = enemy;
    }

    update(time: number) {
        // Every desired time, reconsider current strategy (state)
        if (time - this.lastDecision > 5000) {
            this.lastDecision = time;
            this.decideStrategy();
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

    private decideStrategy() {
        const enemies = this.player.enemyUnitsPhysics.getChildren();

        if (enemies.length > 1) { // If more than 1 enemy are coming for attack
            if (this.player.getHealth(false)/this.enemy.getHealth(false) < 0.5) { // If significantly below HP compared to enemy, get desperate
                this.state = State.LOSING;
            }
            else{
                this.state = State.DEFENDING; // otherwise just focus on defense
            }
        }
        else{
            if(this.player.getMoney() > 100) { // If rich, switch to offensive
                this.state = State.ATTACKING;                
            }
            else{ // otherwise let base defend itself and save up
                this.state = State.IDLE;
            }
        }

        console.log("Decided new strategy: " + this.state);
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
