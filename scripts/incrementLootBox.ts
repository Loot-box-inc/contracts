import { Address, toNano } from '@ton/core';
import { LootBox } from '../wrappers/LootBox';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('LootBox address'));
    const amount = parseInt(args.length > 1 ? args[1]: await ui.input('Increment amount'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const lootBox = provider.open(LootBox.fromAddress(address));

    await lootBox.send(
        provider.sender(),
        {
            value: toNano(amount.toString()),
            bounce: false,
        },
        "Increment",
    );

    ui.clearActionPrompt();
    ui.write('Incremented successfully!');
}
