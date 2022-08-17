const { ethers } = require("hardhat");
const { STIKMAN_NFT_CONTRACT_ADDRESS } = require("../constants");

async function main() {
  // Deploy the FakeNFTMarketplace contract first
  const FakeNFTMarketplace = await ethers.getContractFactory(
    "FakeNFTMarketplace"
  );
  const fakeNftMarketplace = await FakeNFTMarketplace.deploy();
  await fakeNftMarketplace.deployed();

  console.log("FakeNFTMarketplace deployed to: ", fakeNftMarketplace.address);

  // Now deploy the StikmanDAO contract
  const StikmanDAO = await ethers.getContractFactory("StikmanDAO");
  const stikmanDAO = await StikmanDAO.deploy(
    fakeNftMarketplace.address,
    STIKMAN_NFT_CONTRACT_ADDRESS,
    {
      // This assumes your account has at least 1 ETH in it's account
      value: ethers.utils.parseEther("1"),
    }
  );
  await stikmanDAO.deployed();

  console.log("StikmanDAO deployed to: ", stikmanDAO.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
