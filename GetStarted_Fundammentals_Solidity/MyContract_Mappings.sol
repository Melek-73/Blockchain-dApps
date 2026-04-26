// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;
//***UNDERSTAND Mappings***//

contract MyContract_Mappings{
    //Mappings are similar to dictionnary in python , it is a data type that store data in keys and values on the blockchain
    mapping(uint => string) public names;

    mapping(uint => Book) public books;
    struct Book {
        string title;
        string author;
    }

    mapping(address => mapping(uint => Book)) public myBooks; // myBooks is nested mappings data type 

    constructor()  {
        names[1] = "Alice";
        names[2] = "Bob";
        names[3] = "Charlie";
    }

    function addBook(
        uint _id ,
        string memory _title,
        string memory _author
    ) public {
        books[_id] = Book(_title , _author);
    }

    function addMyBook(
        uint _id ,
        string memory _title,
        string memory _author
    ) public {
        myBooks[msg.sender][_id] = Book(_title , _author); // msg here is a global variable comes from solidity , also the sender is the person that called the smart contract
    }
}
