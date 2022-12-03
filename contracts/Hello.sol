// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.0;

contract Hello {
   uint8 public myValue;
   function increase()  public returns (uint8) {
    myValue++;
    return myValue;
   }
   function decrease()  public returns (uint8) {
    myValue--;
    return myValue;
   }
   function setvalue(uint8 newValue)  public {
    myValue = newValue;
   }
   function getvalue()  public view returns (uint8) {
    return myValue;
   }
}