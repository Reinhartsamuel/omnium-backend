require('dotenv').config({
    path: '.env.local'
});
const { ethers } = require("ethers");
const PAYMENT_GATEWAY_ABI = require('./abis/paymentGateway.json');

// Contract setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;



// Example: seller callback URL mapping (ideally in DB)
// const sellerCallbackMap = {
//     "0xSellerAddress1".toLowerCase(): "https://merchant1.com/webhook",
//     "0xSellerAddress2".toLowerCase(): "https://merchant2.com/webhook"
// };

const contract = new ethers.Contract(contractAddress, PAYMENT_GATEWAY_ABI, provider);

console.log("Listening for PaymentReceived events...");
console.log(`contractAddress: ${contractAddress}`);
console.log("process.env.RPC_URL", process.env.RPC_URL);

contract.on("PaymentReceived", async (buyer, seller, token, amount, data, event) => {
    try {
        // console.log("📥 Event received:", event);
        const txHash = event?.log?.transactionHash;
        console.log("📥 event.transactionHash::", txHash);
    } catch (error) {
        console.error(error, "1. Error logging eventttt:",);
    }
    try {
        console.log("📥 Event logs received:");
        console.log("buyer:", buyer);
        console.log("seller:", seller);
        console.log("token:", token);
        console.log("amount:", amount.toString());
        console.log("data:", {
            product: data.productName,
            orderId: data.orderId.toString(),
            quantity: data.quantity.toString(),
        });

        try {
            console.log('calling backend started');
            const res = await fetch('https://omnium-backend-production.up.railway.app/api/order', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    txHash: event?.log?.transactionHash,
                    orderId: data.orderId.toString()
                }),
            });
            const result = await res.json();
            console.log(result, 'result from backend');
            console.log('calling backend finished');
        } catch (error) {
            console.log(error, 'error calling backend')
        }

    } catch (err) {
        console.error("❌ Error handling event:", err);
    }
});