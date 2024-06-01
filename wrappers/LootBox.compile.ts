import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/loot_box.tact',
    options: {
        debug: true,
    },
};
