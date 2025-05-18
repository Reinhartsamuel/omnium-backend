require('dotenv').config({
    path: '.env.local'
});
const { ethers } = require("ethers");
const PAYMENT_GATEWAY_ABI = require('./abis/paymentGateway.json');

// Contract setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, PAYMENT_GATEWAY_ABI, provider);

console.log("Listening for PaymentReceived events...");
console.log(`contractAddress: ${contractAddress}`);
console.log("process.env.RPC_URL", process.env.RPC_URL);

// Helper function to add delay between retries
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Setup event listener with retry mechanism
async function setupEventListener() {
    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // Start with 1 second delay

    while (true) {
        try {
            contract.on("PaymentReceived", async (buyer, seller, token, amount, data, event) => {
                try {
                    const txHash = event?.log?.transactionHash;
                    console.log("📥 event.transactionHash::", txHash);
                } catch (error) {
                    console.error(error, "1. Error logging event:");
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
                        console.log(error, 'error calling backend');
                    }
                } catch (err) {
                    console.error("❌ Error handling event:", err);
                }
            });

            // Reset retry count on successful connection
            retryCount = 0;
            console.log("✅ Event listener setup successfully");

            // Keep the listener running
            await new Promise(() => {}); // This promise never resolves

        } catch (error) {
            console.error("❌ Error in event listener:", error);

            if (error.code === 'UNKNOWN_ERROR' && error.error?.message === 'filter not found') {
                console.log("🔄 Filter expired, recreating...");
            } else {
                retryCount++;
                if (retryCount >= maxRetries) {
                    console.error("❌ Max retries reached, stopping listener");
                    process.exit(1);
                }
            }

            // Exponential backoff
            const waitTime = baseDelay * Math.pow(2, retryCount);
            console.log(`⏳ Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}`);
            await delay(waitTime);
        }
    }
}

// Start the event listener
setupEventListener().catch(error => {
    console.error("❌ Fatal error in setupEventListener:", error);
    process.exit(1);
});