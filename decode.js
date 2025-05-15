const ethers = require("ethers");


function main () {
    // Recompute hash on backend to compare with on-chain hash
    const productName = "sarung";
    const productId = 123;
    const quantity = 2;
    
    const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
      ["string", "uint256", "uint8"],
      [productName, productId, quantity]
    );
    
    const hash = ethers.keccak256(encoded); // should match dataHash
    console.log(`hash: ${hash}`);
    console.log(`encoded: ${encoded}`);
    console.log('raw:',"0x555f08ac19b319364aa4421fab7c67559c4962dca51ded96b29133c1b4573723");
    
}

main();