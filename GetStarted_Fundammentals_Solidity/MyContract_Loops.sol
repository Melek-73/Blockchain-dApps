// SPDX-License-Identifier: MIT
//***UNDERSTAND Conditionals and Loops***//
pragma solidity ^0.8.34;

contract MyContract_Loops {
    //Conditionnals : are control flow structure
        //if, else if, else
    //Loops : are control flow structure
        //for, while, do while
    //Break and continue
    //Loops
    uint[] public numbers = [1,2,3,4,5,6];
    address public owner;
    constructor() {
        owner = msg.sender;
    }

    function isOwner() public view returns (bool){
        return(msg.sender == owner);
    }

    function countEvenNumbers() public view returns(uint){
        uint count = 0;
        for (uint i =0; i < numbers.length ;i++) {
            if (isEvenNumber(numbers[i])) {
                count++;
            }
        }
        return count; 
    }

    function isEvenNumber(uint _number) public pure returns(bool){
        if (_number % 2 == 0) {
            return true;
        } else {
            return false;
        }
    }
}