import { toNano } from '@ton/core';
import { LootJetton } from '../wrappers/LootJetton';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const lootJetton = provider.open(await LootJetton.fromInit());

    await lootJetton.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(lootJetton.address);

    // run methods on `lootJetton`
}
