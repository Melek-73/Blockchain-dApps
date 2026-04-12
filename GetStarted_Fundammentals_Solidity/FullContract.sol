// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;
//***Ether payments , Modifiers , Visibility , Events , Enums ***//

contract HotelRoom {
    enum  Statuses {Vacant,Occupied} //enum is a datasrtucture that exist in Solidity , enum is a collection of options that never go on to change
    Statuses public currentStatus;

    event Occupy(address _occupant , uint _value);

    // in the following function , we will pay the person who create the smart contract who is actually the hotel owner
    address payable  public owner;// payable is a specific modifier , this modifier let's the address receive a Etherum cryptocurrency 
    constructor() payable{
        owner = payable(msg.sender);
        currentStatus = Statuses.Vacant; // the room is vacant at the begining , by default
    }
    // modifier allow us to run some code before execute some function , it is great for allow access control , valodating some arguments
    modifier onlyWhileVacant() {
        //check status
        require(currentStatus == Statuses.Vacant, "The room is not available");// if require(True)=> continue execution , if not stop execute the funct
        _;
    }
    modifier costs(uint _amount){
        //check price :
        require(msg.value >= _amount,"Not enough many provided ." ); //msv.value is the amount of cryptocurrency that the user want to send
        _;
    }


    function book()  public payable onlyWhileVacant costs(2 ether) {
        currentStatus = Statuses.Occupied;
        (bool sent , bytes memory data) = owner.call{value: msg.value}(""); // call : send the cryptocurrency to the owner , also .value refer to the amount of cryptocurrency that the user want to send}
        require(true);
        emit Occupy(msg.sender , msg.value);
    }
}