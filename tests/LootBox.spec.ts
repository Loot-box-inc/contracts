import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { LootBox } from '../wrappers/LootBox';
import '@ton/test-utils';

describe('LootBox', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let rewarder: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let lootBox: SandboxContract<LootBox>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        const minKeep = toNano('0.5');
        const minReward = toNano('1');
        const maxReward = toNano('3');

        lootBox = blockchain.openContract(await LootBox.fromInit(minKeep, minReward, maxReward));

        deployer = await blockchain.treasury('deployer');
        rewarder = await blockchain.treasury('rewarder');
        alice = await blockchain.treasury('alice');

        const deployResult = await lootBox.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lootBox.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lootBox are ready to use
    });

    it('should have good config', async()=>{
        expect((await lootBox.getOwner()).toRawString()).toBe(deployer.address.toRawString());
        expect(((await lootBox.getRewarder()).toRawString())).toBe(deployer.address.toRawString());
        expect(await lootBox.getMinKeep()).toBe(toNano('0.5'));
        expect(await lootBox.getMinReward()).toBe(toNano('1'));
        expect(await lootBox.getMaxReward()).toBe(toNano('3'));
    })

    it('should set rewarder', async()=>{
        const txs = await lootBox.send(
            deployer.getSender(), 
        {
            value: toNano('0.05'),
        }, 
        {
            $$type: 'SetRewarder',
            rewarder: rewarder.address,
        });

        expect(txs.transactions).toHaveTransaction({
            from: deployer.address, 
            to: lootBox.address,
            success: true,
        });

        expect((await lootBox.getRewarder()).toString()).toBe(rewarder.address.toString());
    })

    it('should reward user', async ()=>{
        console.log("DEPLOYER ADDRESS: ", deployer.address);
        console.log("REWARDER ADDRESS: ", rewarder.address);
        console.log("ALICE ADDRESS: ", alice.address);

        const aliceBalanceInitial = await alice.getBalance();
        console.log("ALICE BALANCE BEFORE: ", aliceBalanceInitial);

        await lootBox.send(
            deployer.getSender(),
            {
                value: toNano('100'),
                bounce: false,
            },
            "Increment",
        );

        await lootBox.send(
            deployer.getSender(), 
            {
                value: toNano('0.05'),
                bounce: true,
            },
            {
                $$type: 'SetRewarder',
                rewarder: rewarder.address,
            }
        );

        const lootBalance = await lootBox.getBalance();
        console.log("LOOT BALANCE: ", lootBalance);

        const txs = await lootBox.send(
            rewarder.getSender(), {
                value: toNano('0.05'),
                bounce: true,
            },
            {
                $$type: 'RewardUser',
                user: alice.address,
            }
        );

        const aliceReward = await lootBox.getUserReward(alice.address);
        expect(aliceReward).not.toBe(null);

        console.log("ALICE REWARD: ", aliceReward!!);

        console.log("LOOT BALANCE: ", await lootBox.getBalance());

        expect(txs.transactions).toHaveTransaction({
            from: rewarder.address,
            to: lootBox.address,
            success: true,
        });

        const aliceBalanceAfter1 = await alice.getBalance();
        console.log("ALICE BALANCE AFTER: ", aliceBalanceAfter1);

        // try to reward the same user once again
        const txs1 = await lootBox.send(
            rewarder.getSender(), 
            { 
                value: toNano('0.05'),
                bounce: true,
            },
            {
                $$type: 'RewardUser',
                user: alice.address,
            }
        );

        const aliceBalanceAfter2 = await alice.getBalance();
        console.log("ALICE BALANCE AFTER: ", aliceBalanceAfter2);

        // alice balance increased
        expect(aliceBalanceAfter1).toBeGreaterThan(aliceBalanceInitial);

        // second time alice balance not changed
        expect(aliceBalanceAfter1).toBe(aliceBalanceAfter2);
    })
});


