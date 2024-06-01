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

        // console.log("REWARDER: ", rewarder.address.toString(), "BALANCE: ", await rewarder.getBalance());

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

    it.only('should reward user', async ()=>{
        console.log("ALICE BALANCE BEFORE: ", await alice.getBalance());

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
            },
            {
                $$type: 'RewardUser',
                user: alice.address,
            }
        );

        console.log("ALICE REWARD: ", await lootBox.getUserReward(alice.address));

        // expect(txs.transactions).
        // expect(txs.transactions).toHaveTransaction({
        //     // from: rewarder.address,
        //     to: lootBox.address,
        //     success: true,
        // });

        console.log("ALICE BALANCE AFTER: ", await alice.getBalance());
        // console.log("TXS: ", txs.transactions);
        console.log("EVENTS: ", txs.events);
        console.log("RESULT: ", txs.result);
    })
});


