const networks = {
    "0x1": "Mainnet",
    "0x3": "Ropsten",
    "0x2a": "Kovan",
    "0x4": "Rinkeby",
    "0x5": "Goerli",
    "0x61": "BSC Testnet",
    "0x38": "BSC Mainnet",
    "0x89": "Polygon Mainnet",
    "0x13881": "Polygon Mumbai Testnet",
    "0xa86a": "AVAX Mainnet",
    "0xfa": "Fantom",
    "0xfa2": "Fantom Testnet"    
  }

  const getNetworkName = (chainId) => {
    try {
        const network = networks[chainId];
        if (network !== undefined) { return network; }
    } catch(error) {
    }
    return `Unknown (${chainId})`;
  }
  
  export { networks, getNetworkName };