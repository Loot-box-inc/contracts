import "@stdlib/deploy";
import "@stdlib/ownable";

message RewardUser {
    user: Address;
}

message RewarderAssigned {
    oldRewarder: Address;
    newRewarder: Address;
}

message UserRewarded {
    user: Address;
    amount: Int as coins;
}

message SetRewarder {
    rewarder: Address;
}

contract LootBox with Deployable, Ownable {
    owner: Address;
    rewarder: Address;
    userState: map<Address, Int>;
    minKeep: Int as coins;
    minReward: Int as coins;
    maxReward: Int as coins;


    init(_minKeep: Int, _minReward: Int, _maxReward: Int) {
        self.owner = sender();
        self.minKeep = _minKeep;
        self.rewarder = sender();
        self.minReward = _minReward;
        self.maxReward = _maxReward;
        self.userState = emptyMap();
    }

    get fun rewarder(): Address {
        return self.rewarder;
    }

    get fun minKeep(): Int {
        return self.minKeep;
    }

    get fun minReward(): Int {
        return self.minReward;
    }

    get fun maxReward(): Int {
        return self.maxReward;
    }

    get fun balance(): Int {
        return myBalance();
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

        let amount: Int = random(leftBalance - self.minReward, leftBalance - self.maxReward);
        
        send(SendParameters{
            to: user,
            bounce: true,
            value: amount,
            mode: SendRemainingValue + SendIgnoreErrors,
        });

        self.userState.set(user, amount);
        
        emit(UserRewarded{user: user, amount: amount}.toCell());
        
        self.notify("Rewarded".asComment());
    }

    receive("Increment") {
        dump(context().value);
    }

    get fun userReward(user: Address): Int? { 
        return self.userState.get(user);
    }
}
