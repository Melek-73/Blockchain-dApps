//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol"; //Helps safely increment token IDs
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";//Base standard for NFTs
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";//Extension that allows storing metadata


//This is a simple ERC-721 NFT smart contract written in Solidity that allows users to mint Real Estate NFTs

contract RealEstate is ERC721URIStorage { //inherits NFT functionality
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("RealEstate", "RE") {} //RE is the symbol for Real Estate
    //Each NFT represents a real estate asset (or any digital metadata linked via tokenURI).
    // The mint function allows users to create new NFTs by providing a tokenURI, 
    //which typically points to metadata about the real estate asset (like location, size, price, etc.). 
    //The function increments the token ID counter, mints a new NFT to the caller's address, and sets the token URI for that NFT.
    
    function mint(string memory tokenURI)
        public
        returns (uint256)
    {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}
