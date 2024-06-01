import { toNano } from '@ton/core';
import { LootBox } from '../wrappers/LootBox';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const minKeep = toNano('0.03');
    const minReward = toNano('0.005');
    const maxReward = toNano('0.006');

    const lootBox = provider.open(await LootBox.fromInit(minKeep, minReward, maxReward));

    await lootBox.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(lootBox.address);
}
