require('dotenv').config();
const { ethers } = require("ethers");

// Contract setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;

// Minimal ABI with only the event
const abi = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "productName",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "quantity",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct PaymentGateway.PaymentData",
                "name": "data",
                "type": "tuple"
            }
        ],
        "name": "payWithToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "token",
                "type": "address"
            }
        ],
        "name": "SafeERC20FailedOperation",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "buyer",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "seller",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "token",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "productName",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "orderId",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "quantity",
                        "type": "uint8"
                    }
                ],
                "indexed": false,
                "internalType": "struct PaymentGateway.PaymentData",
                "name": "data",
                "type": "tuple"
            }
        ],
        "name": "PaymentReceived",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// Example: seller callback URL mapping (ideally in DB)
// const sellerCallbackMap = {
//     "0xSellerAddress1".toLowerCase(): "https://merchant1.com/webhook",
//     "0xSellerAddress2".toLowerCase(): "https://merchant2.com/webhook"
// };

const contract = new ethers.Contract(contractAddress, abi, provider);

console.log("Listening for PaymentReceived events...");
console.log(`contractAddress: ${contractAddress}`);
console.log(`provider: ${JSON.stringify(provider)}`);

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
            const res = await fetch('http://localhost:3000/api/order', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    txHash: event?.log?.transactionHash,
                    orderId : data.orderId.toString()
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