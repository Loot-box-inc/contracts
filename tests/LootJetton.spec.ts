import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { LootJetton } from '../wrappers/LootJetton';
import '@ton/test-utils';

describe('LootJetton', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let lootJetton: SandboxContract<LootJetton>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        lootJetton = blockchain.openContract(await LootJetton.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await lootJetton.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lootJetton.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and lootJetton are ready to use
    });
});
