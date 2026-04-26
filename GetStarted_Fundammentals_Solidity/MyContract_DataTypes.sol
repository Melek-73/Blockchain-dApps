// SPDX-License-Identifier: MIT
//***UNDERSTAND DATA TYPES***//
pragma solidity ^0.8.34;

contract MyContract {
    //State variable 
    uint public myUint  =1; // a state variable is stored in the blockchain
    // a scope means the place that you can access , read , update  the variable 
    // int and uint data type is for signed and unsigned integers , it is a data type in solidity language
    uint256 public myUint256 =1;
    int public myInt = -1;
    int256 public myInt256 = -1;

    string public myString = "Hello Word !";
    bytes32 public myBytes32 = "Hello Word !";

    address public myAddress = 0xd9145CCE52D386f254917e481eB44e9943F39138;
    // an address may refer to a specific smart contract or may refer to a username wallet

    // But with Solidity language  , you can create your own custom data type 
    struct MyStruct {
        uint256 myUint256;
        string myString;
    }
    MyStruct public myStruct = MyStruct(1,"Hello word !");
    //Arrays
    uint[] public uinArray = [1, 2, 3];
    string[] public stringArray = ["apple","banana","orange"];
    string[] public values;

    function addValue(string memory _value) public {
        values.push(_value); // add a new item at the end of the array , _value here is local variable
    }
    function valueCount() public view returns(uint){
        return values.length;
    }

    //2D Arrays
    uint256[][]  public array2D = [[1,2,3],[4,5,6],[7,8,9]];
    //Local variable;
    function getValue() public pure returns (uint) {
        uint value = 1; //This is local variable
        return value;
    }
}