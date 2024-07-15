import fs from 'fs';
import csv from 'csv-parser';
import TonWeb from 'tonweb';

interface Recipient {
    address: string;
    amount: string;
}

const NETWORK: 'mainnet' | 'testnet' = 'testnet';

const NETWORK_URLS: { [key: string]: string } = {
    mainnet: 'https://toncenter.com/api/v2/jsonRPC',
    testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC'
};

const tonweb = new TonWeb(new TonWeb.HttpProvider(NETWORK_URLS[NETWORK], {
    apiKey: 'YOUR_API_KEY'
}));

const WalletClass = TonWeb.Wallets.all.v3R2;
//add secret and public key
const walletSecretKey: Uint8Array = new TextEncoder().encode();
const walletPublicKey: Uint8Array = new TextEncoder().encode();

const wallet = new WalletClass(tonweb.provider, {
    publicKey: walletPublicKey,
});

async function sendTON(recipient: string, amount: string): Promise<void> {
    const seqno: number = <number>await wallet.methods.seqno().call();

    const transfer = wallet.methods.transfer({
        secretKey: walletSecretKey,
        toAddress: recipient,
        amount: TonWeb.utils.toNano(amount),
        seqno: seqno,
        payload: undefined,
        sendMode: 3,
    });

    await transfer.send();
}

function readRecipientsAndSendTON(): void {
    const recipients: Recipient[] = [];

    fs.createReadStream('recipients.csv')
        .pipe(csv())
        .on('data', (row: Recipient) => {
            recipients.push(row);
        })
        .on('end', async () => {
            for (const recipient of recipients) {
                try {
                    await sendTON(recipient.address, recipient.amount);
                    console.log(`send ${recipient.amount} TON to address: ${recipient.address}`);
                } catch (error) {
                    console.error(`Error when tried send TON to address: ${recipient.address}:`, error);
                }
            }
        });
}

readRecipientsAndSendTON();
