//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

//Our escrow contract will use transferFrom to transfer property NFTs
interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    //State variables to store the addresses of the involved parties and the NFT contract
    address public nftAddress; //address of the RealEstate NFT contract , On Ethereum, every deployed smart contract has a unique address
    address payable public seller;
    //payable : It means this address can receive ETH (money).
    //Without payable, Solidity prevents sending Ether to that address.
    address public inspector;
    address public lender;

    //Modeifiers to restrict access to certain functions based on the caller's role (buyer, seller, inspector) :
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }
    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }
    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inspector can call this method");
        _;
    }

    //Each NFT (_nftID  uint256) has: isListed, purchasePrice, escrowAmount(deposit required), buyer, inspectionPassed, approval (mapping of who approved the sale)
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval; //For each NFT , Each person (buyer, seller, lender) ,Can approve or not

     constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }
    /* List a property” = make it available for sale through escrow , technically : Move NFT from seller → escrow contract*/ 
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable  onlySeller{
        /* Transfer NFT from seller to this contract */
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice; //The price the buyer will pay for the property
        escrowAmount[_nftID] = _escrowAmount; //The amount the buyer must deposit to escrow when they make an offer (1-5% of purchase price) , small deposit (commitment) it prouve that the buyer is serious about buying
        buyer[_nftID] = _buyer; //The buyer's address
        /* example : 
        Total price = 10 ETH
            Buyer pays:
            - 1 ETH earnest (initial deposit)
            - 3 ETH down payment
            - 6 ETH loan from lender
        */ 

    }
    // Put Under Contract (only buyer - payable escrow)
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]); //Reject transaction if buyer didn’t send enough money
        // msg.value is the amount of ETH sent with the transaction. This checks that the buyer has sent at least the required escrow amount.
    }

    // Update Inspection Status (only inspector)
    function updateInspectionStatus(uint256 _nftID, bool _passed) // this function allows the inspector to record whether a property passed inspection or not.
        public
        onlyInspector
    {
        inspectionPassed[_nftID] = _passed;
    }

    // Approve Sale
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller
    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID]); //Property must be approved by inspector , If false → sale cannot proceed
        require(approval[_nftID][buyer[_nftID]]); // Buyer must approve the sale
        require(approval[_nftID][seller]); // Seller must approve the sale
        require(approval[_nftID][lender]); // Lender must approve the sale
        require(address(this).balance >= purchasePrice[_nftID]); // Escrow contract must have enough funds to cover the purchase price (from buyer's earnest deposit + lender's loan + buyer's down payment)

        isListed[_nftID] = false; // Mark the property as no longer listed for sale

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);
        /* 
        ✔ address(this).balance
        👉 All ETH inside escrow
        ✔ .call{value: ...}
        👉 Transfers ETH to seller
        ✔ require(success)
        👉 Ensures transfer worked
         */

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID); // Transfer the NFT from escrow to the buyer, completing the sale. The buyer now owns the property NFT.
    }

    // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller
    function cancelSale(uint256 _nftID) public {
        if (inspectionPassed[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    receive() external payable {}
    function getBalance() public view returns (uint256) {
        return address(this).balance; //address of this contract, balance is the amount of ETH held by the contract
    }
}