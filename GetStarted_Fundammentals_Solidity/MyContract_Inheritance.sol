/*We will understand how small contracts interact with each other*/
/*We will understand Inhertance , Factories , Interaction*/


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract Ownable{
    address owner;
    modifier onlyOwner() {
        require(msg.sender == owner , "must be owner") ;
        _;
    }
    constructor()  {
        owner = msg.sender;
    }
}

contract SecretVault {
    string secret;
    constructor(string memory _secret)  {
        secret = _secret;
    }

    function getSecret() public view returns(string memory) {
        return secret;
    }
}
// How create the  SecretVault once MyContract is deployed ==> this is called Factory : Factory is a smart contract that create other smart contracts 
contract MyContract is Ownable{
    address secretVault; // save secretVault address to reuse

    constructor(string memory _secret)  {
        SecretVault _secretVault = new SecretVault(_secret);
        secretVault = address(_secretVault);
        super;// in this way we call the constructor of the parent contract , it is as we write owner = msg.sender
    }
    // We want only the ownerof the contract can access or get the secret , no one else
    function getSecret() public view returns(string memory) {
        return SecretVault(secretVault).getSecret();
    }

}