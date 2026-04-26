/*
Ethers.js is a compact, popular JavaScript library designed to interact with the Ethereum blockchain and its ecosystem. 
It enables developers to create, deploy, and interact with smart contracts, manage private keys, and build decentralized applications (dApps) in a secure, efficient manner.
*/
const { expect } = require('chai');
const { ethers } = require('hardhat');
//Check the behaviour of the smart contract functions and interactions, ensuring they work as intended and handle edge cases correctly.
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}
//Converts a number into Wei Blockchain doesn’t use normal numbers like: 1 ETH , It uses: 1000000000000000000 Wei


describe('Escrow', () => {
  //Groups tests related to Escrow contract
  let buyer, seller, inspector, lender;
  let realEstate, escrow;


  //Runs before each test, setting up the environment for testing :
  beforeEach(async () => {
    //This runs before every single it() test
    // Setup accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy Real Estate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy(); //Deploys contract to local blockchain
    console.log("Real Estate deployed to: ", realEstate.address);

    // Mint
    let transaction = await realEstate //This sends a transaction to the blockchain and Returns a transaction object (not confirmed yet)
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS",
      );
    await transaction.wait(); //Waits until the transaction is mined (confirmed)

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.address,
      seller.address,
      inspector.address,
      lender.address,
    );
    // Approve Property
    transaction = await realEstate.connect(seller).approve(escrow.address, 1); //Allow escrow contract to move the NFT
    await transaction.wait();
    //Because ERC-721 security rule: : A contract CANNOT transfer your NFT unless you explicitly approve it

    // List Property :  Registers a sale agreement inside escrow:
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });



  describe("Deployment", () => {
    //it for defines one specific test
    it("saves the addresses", async () => {
      //const signers = await ethers.getSigners(); //Get list of accounts from local blockchain
      //console.log("Signers: ", signers.length);
    });
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress(); //This returns what was stored in constructor:
      expect(result).to.be.equal(realEstate.address);
    });
    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(buyer.address);
    });

    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });

    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address);
    });
  });

  describe("Deposits", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) }); //Buyer deposits 5 ETH into escrow for property #1
      await transaction.wait();
    });

    it("Updates contract balance", async () => {
      const result = await escrow.getBalance();
      expect(result).to.be.equal(tokens(5)); // this chek if the escrow contract correctly receive the ETH
    });
  });

  describe("Inspection", () => {
    beforeEach(async () => {
      const transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();
    });

    it("Updates inspection status", async () => {
      const result = await escrow.inspectionPassed(1);
      expect(result).to.be.equal(true);
    });
  });

  describe("Approval", () => {
    beforeEach(async () => {
      let transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();
    });

    it("Updates approval status", async () => {
      expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
      expect(await escrow.approval(1, seller.address)).to.be.equal(true);
      expect(await escrow.approval(1, lender.address)).to.be.equal(true);
    });
  });

  describe("Sale", () => {
    beforeEach(async () => {
      let transaction = await escrow
        .connect(buyer)
        .depositEarnest(1, { value: tokens(5) }); // Buyer deposits 5 ETH into escrow for property #1
      await transaction.wait();

      transaction = await escrow
        .connect(inspector)
        .updateInspectionStatus(1, true);
      await transaction.wait();

      transaction = await escrow.connect(buyer).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(seller).approveSale(1);
      await transaction.wait();

      transaction = await escrow.connect(lender).approveSale(1);
      await transaction.wait();

      await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

      transaction = await escrow.connect(seller).finalizeSale(1);
      await transaction.wait();
    });

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
    });

    it("Updates balance", async () => {
      expect(await escrow.getBalance()).to.be.equal(0);
    });
  });
})
//take the NFT out of the user wallet and transfer it to escrow contract