// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.0;

contract HelloEvent {
   uint8 public myValue;
   event Increased(uint8 newValue,string message);
   event Decreased(uint8 newValue,string message);
   event ValueSet(uint8 newValue,string message);
   function increase()  public {
    myValue++;
    emit Increased(myValue,"My value is increased by 1");
   }
   function decrease()  public {
    myValue--;
    emit Decreased(myValue,"My value is decreased by 1");
   }
   function setvalue(uint8 newValue)  public {
    myValue = newValue;
    emit ValueSet(myValue,"My value is set with new value");
   }
 
}