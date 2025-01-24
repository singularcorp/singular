import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from "bs58";
import fs from "fs";

const RPC_ENDPOINT = "Your RPC Endpoint";
const web3Connection = new Connection(
    RPC_ENDPOINT,
    'confirmed',
);

async function sendLocalCreateTx(){
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode("your-wallet-private-key"));

    // Generate a random keypair for token
    const mintKeypair = Keypair.generate(); 

    // Define token metadata
    const formData = new FormData();
    formData.append("file", await fs.openAsBlob("./example.png")), // Image file
    formData.append("name", "PPTest"),
    formData.append("symbol", "TEST"),
    formData.append("description", "This is an example token created via PumpPortal.fun"),
    formData.append("twitter", "https://x.com/a1lon9/status/1812970586420994083"),
    formData.append("telegram", "https://x.com/a1lon9/status/1812970586420994083"),
    formData.append("website", "https://pumpportal.fun"),
    formData.append("showName", "true");

    // Create IPFS metadata storage
    const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
    });
    const metadataResponseJSON = await metadataResponse.json();

    // Get the create transaction
    const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "publicKey": 'your-wallet-public-key',
            "action": "create",
            "tokenMetadata": {
                name: metadataResponseJSON.metadata.name,
                symbol: metadataResponseJSON.metadata.symbol,
                uri: metadataResponseJSON.metadataUri
            },
            "mint": mintKeypair.publicKey.toBase58(),
            "denominatedInSol": "true",
            "amount": 0, // dev buy of 1 SOL
            "slippage": 10, 
            "priorityFee": 0.0005,
            "pool": "pump"
        })
    });
    if(response.status === 200){ // successfully generated transaction
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        tx.sign([mintKeypair, signerKeyPair]);
        const signature = await web3Connection.sendTransaction(tx)
        console.log("Transaction: https://solscan.io/tx/" + signature);
    } else {
        console.log(response.statusText); // log error
    }
}

sendLocalCreateTx();