import { Address, beginCell, toNano } from '@ton/core';
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import '@ton/test-utils';
import { JettonDefaultWallet } from '../build/LootJetton/tact_JettonDefaultWallet';
import { buildOnchainMetadata } from '../scripts/jettonHelpers';
import { LootJetton, Mint, TokenBurn, TokenTransfer } from '../wrappers/LootJetton';

const jettonParams = {
    name: "LootJetton",
    description: "This is description of Test tact jetton",
    symbol: "LOOT",
    image: "https://placehold.co/256/png?text=LOOT",
};
let content = buildOnchainMetadata(jettonParams);
let max_supply = toNano(1234766689011); // Set the specific total supply in nano

describe('LootJetton', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let token: SandboxContract<LootJetton>;
    let jettonWallet: SandboxContract<JettonDefaultWallet>;

    beforeAll(async () => {
        // Create content Cell
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");

        token = blockchain.openContract(await LootJetton.fromInit(deployer.address, content, max_supply));

        // Send Transaction
        const deployResult = await token.send(deployer.getSender(), { value: toNano("10") }, {
            $$type: 'Mint',
            amount: toNano("100"),
            receiver: deployer.address,
        });
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            deploy: true,
            success: true,
        });

        const playerWallet = await token.getGetWalletAddress(deployer.address);
        jettonWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(playerWallet));
    });


    it("Test: Minting is successfully", async () => {
        let jettonData = await token.getGetJettonData();
        const totalSupplyBefore = jettonData.totalSupply;
        const mintAmount = toNano(100);
        const Mint: Mint = {
            $$type: "Mint",
            amount: mintAmount,
            receiver: deployer.address,
        };
        const mintResult = await token.send(deployer.getSender(), { value: toNano("10") }, Mint);
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: token.address,
            success: true,
        });

        const totalSupplyAfter = (await token.getGetJettonData()).totalSupply;
        expect(totalSupplyBefore + mintAmount).toEqual(totalSupplyAfter);

        const walletData = await jettonWallet.getGetWalletData();
        expect(walletData.owner).toEqualAddress(deployer.address);
        expect(walletData.balance).toBeGreaterThanOrEqual(mintAmount);
    });
    it("should transfer successfully", async () => {
        const sender = await blockchain.treasury("sender");
        const receiver = await blockchain.treasury("receiver");
        const initMintAmount = toNano(1000);
        const transferAmount = toNano(80);

        const mintMessage: Mint = {
            $$type: "Mint",
            amount: initMintAmount,
            receiver: sender.address,
        };
        await token.send(deployer.getSender(), { value: toNano("0.25") }, mintMessage);

        const senderWalletAddress = await token.getGetWalletAddress(sender.address);
        const senderWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(senderWalletAddress));

        // Transfer tokens from sender's wallet to receiver's wallet // 0xf8a7ea5
        const transferMessage: TokenTransfer = {
            $$type: "TokenTransfer",
            queryId: 0n,
            amount: transferAmount,
            destination: receiver.address,
            response_destination: sender.address,
            custom_payload: null,
            forward_ton_amount: toNano("0.1"),
            forward_payload: beginCell().storeUint(0, 1).storeUint(0, 32).endCell(),
        };
        const transferResult = await senderWallet.send(sender.getSender(), { value: toNano("0.5") }, transferMessage);
        expect(transferResult.transactions).toHaveTransaction({
            from: sender.address,
            to: senderWallet.address,
            success: true,
        });

        const receiverWalletAddress = await token.getGetWalletAddress(receiver.address);
        const receiverWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(receiverWalletAddress));

        const senderWalletDataAfterTransfer = await senderWallet.getGetWalletData();
        const receiverWalletDataAfterTransfer = await receiverWallet.getGetWalletData();

        expect(senderWalletDataAfterTransfer.balance).toEqual(initMintAmount - transferAmount); // check that the sender transferred the right amount of tokens
        expect(receiverWalletDataAfterTransfer.balance).toEqual(transferAmount); // check that the receiver received the right amount of tokens
    });

    it("Mint tokens then Burn tokens", async () => {
        const deployerWalletAddress = await token.getGetWalletAddress(deployer.address);
        const deployerWallet = blockchain.openContract(JettonDefaultWallet.fromAddress(deployerWalletAddress));
        let deployerBalanceInit = (await deployerWallet.getGetWalletData()).balance;

        const initMintAmount = toNano(100);
        const mintMessage: Mint = {
            $$type: "Mint",
            amount: initMintAmount,
            receiver: deployer.address,
        };
        await token.send(deployer.getSender(), { value: toNano("10") }, mintMessage);
        let deployerBalance = (await deployerWallet.getGetWalletData()).balance;
        expect(deployerBalance).toEqual(deployerBalanceInit + initMintAmount);

        let burnAmount = toNano(10);
        const burnMessage: TokenBurn = {
            $$type: "TokenBurn",
            queryId: 0n,
            amount: burnAmount,
            owner: deployer.address,
            response_destination: deployer.address,
        };

        await deployerWallet.send(deployer.getSender(), { value: toNano("10") }, burnMessage);
        let deployerBalanceAfterBurn = (await deployerWallet.getGetWalletData()).balance;
        expect(deployerBalanceAfterBurn).toEqual(deployerBalance - burnAmount);
    });

    it("Should return value", async () => {
        const player = await blockchain.treasury("player");
        const mintAmount = 1119000n;
        const Mint: Mint = {
            $$type: "Mint",
            amount: mintAmount,
            receiver: player.address,
        };
        await token.send(deployer.getSender(), { value: toNano("1") }, Mint);

        let totalSupply = (await token.getGetJettonData()).totalSupply;
        const messageResult = await token.send(player.getSender(), { value: 10033460n }, Mint);
        expect(messageResult.transactions).toHaveTransaction({
            from: player.address,
            to: token.address,
        });
        let totalSupply_later = (await token.getGetJettonData()).totalSupply;
        expect(totalSupply_later).toEqual(totalSupply);
    });

    it("Convert Address Format", async () => {
        console.log("Example Address(Jetton Root Contract: " + token.address);
        console.log("Is Friendly Address: " + Address.isFriendly(token.address.toString()));

        const testAddr = Address.parse(token.address.toString());
        console.log("✓ Address: " + testAddr.toString({ bounceable: false }));
        console.log("✓ Address: " + testAddr.toString());
        console.log("✓ Address(urlSafe: true): " + testAddr.toString({ urlSafe: true }));
        console.log("✓ Address(urlSafe: false): " + testAddr.toString({ urlSafe: false }));
        console.log("✓ Raw Address: " + testAddr.toRawString());
    });

});
