import "@stdlib/deploy";
import "@stdlib/ownable";

contract LootBox with Deployable, Ownable {
    owner: Address;

    init() {
        self.owner = sender();
    }

   

    receive(msg: SetRewarder) {
        self.requireOwner();
        let _oldRewarder: Address = self.rewarder;
        self.rewarder = msg.rewarder;
        emit(RewarderAssigned{oldRewarder: _oldRewarder, newRewarder:msg.rewarder}.toCell());
        self.notify("RewarderSet".asComment());
    }

    receive(msg: RewardUser) {
        require(self.rewarder == sender(), "LB:NOT_REWARDER_ROLE");
        require(myBalance() > self.minKeep + context().value, "LB:EXTREMELY_LOW_BALANCE");
        let user: Address = msg.user;
        let state: Int? = self.userState.get(user);
        
        require(state == null, "LB:ALREADY_REWARDED");

        let leftBalance: Int = myBalance() - self.minKeep - context().value;
        require(leftBalance >= self.maxReward, "LB:BALANCE_NOT_ENOUGH");
        let _minReward: Int = min(leftBalance, self.minReward);
        let _maxReward: Int = min(leftBalance, self.maxReward);
        let amount: Int = random(_minReward, _maxReward);
        
        send(SendParameters{
            to: user,
            bounce: true,
            value: amount,
            mode: SendIgnoreErrors,
        });

        self.userState.set(user, amount);
        
        emit(UserRewarded{user: user, amount: amount}.toCell());
        
        self.notify("Rewarded".asComment());
    }

    get fun balance(): Int {
        return myBalance();
    }

}
