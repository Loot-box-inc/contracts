import { NetworkProvider } from '@ton/blueprint';
import { toNano } from '@ton/core';
import { LootJetton } from '../wrappers/LootJetton';
import { buildOnchainMetadata } from './jettonHelpers';

export async function run(provider: NetworkProvider) {
    const jettonParams = {
        name: "LOOT Jetton Token",
        description: "This is description of LOOT Jetton Token",
        symbol: "LOOT",
        image: "https://placehold.co/256/png?text=LOOT",
    };
    const owner = provider.sender().address!;
    const deployAmount = toNano("0.15");

    // Create content Cell
    const content = buildOnchainMetadata(jettonParams);
    const max_supply = toNano(123456766689011); // Set the specific total supply in nano
    let supply = toNano(1000000000); // Specify total supply in nano
    const lootContract = await LootJetton.fromInit(
        owner,
        content,
        max_supply,
    );
    const lootJetton = provider.open(lootContract);

    await lootJetton.send(
        provider.sender(),
        { value: deployAmount },
        {
            $$type: "Mint",
            amount: supply,
            receiver: owner,
        }
    );
    await provider.waitForDeploy(lootJetton.address);
    const jettonWalletAddress = await lootJetton.getGetWalletAddress(owner);
    await provider.waitForDeploy(jettonWalletAddress);
}
