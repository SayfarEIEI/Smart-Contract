// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.8.0;


contract SimpleLoan {
    address payable owner;
    struct DebtInfo {
        uint balance;
        uint lastBorrowed;
    }
    mapping (address => DebtInfo) public debts;
    uint public interestRateNumerator;
    uint public interestRateDenominator;
    uint public constant DEFAUL_INTEREST_NUMERATOR = 1;
    uint public constant DEFAUL_INTEREST_DENOMINATOR = 10;
    uint public constant PAYBACK_PERIOD = 60 * 60 * 24 * 7;

    address[] public borrowers;
    bool active;

    constructor(){
        owner = payable(msg.sender);
        interestRateNumerator = DEFAUL_INTEREST_NUMERATOR;
        interestRateDenominator = DEFAUL_INTEREST_DENOMINATOR;
        active = true;
    }

    modifier onlyOwneer {
        require(msg.sender == owner,"Only owner allowed");
        _;
    }

    modifier notAnOwneer {
        require(msg.sender != owner,"Owner not allowed");
        _;
    }

    modifier whenActive {
        require(active,"Only owner allowed");
        _;
    }

    function getBorrowers() public view  returns (address[] memory) {
        return borrowers;
    }

    function getDebts(address borrower) public view returns(uint){
        return debts[borrower].balance;
    }

    event Deposited(uint time,uint amount, uint balance);
    function deposit() public payable onlyOwneer whenActive{
        emit Deposited(block.timestamp,msg.value,
            address(this).balance);
    }

    event interestRateChanged(uint time,uint newRate);
    function setInterestRate(uint numerator) public onlyOwneer whenActive {
        require (numerator > 0 , "Invalid interest rate");
        interestRateNumerator = numerator;
        interestRateDenominator = 100;
        emit interestRateChanged(block.timestamp,numerator);
    }

    event Borrowed(uint time,uint amount,uint interest,address borrower);
    function borrow(uint amount) external notAnOwneer whenActive {
        require(address(this).balance >= amount ,"Not enough balance");
        uint interest = (amount * interestRateNumerator / interestRateDenominator );
        uint debt = amount + interest;
        if(debts[msg.sender].balance == 0){
            borrowers.push(msg.sender);
            debts[msg.sender] = DebtInfo(0,0);
        }
        debts[msg.sender].balance += debt;
        debts[msg.sender].lastBorrowed = block.timestamp;
        payable(msg.sender).transfer(amount);
        emit Borrowed(block.timestamp, amount ,interest,msg.sender);
    }

    event Paybacked (uint time,uint amount ,uint remaining,address borrower);
    event LatePaybacked (uint time,uint amount ,uint remaining,address borrower ,uint period);
    event DebtCleared (uint time,address borrower);
    function payBack()external payable notAnOwneer whenActive {
        require (msg.value <= debts[msg.sender].balance,"Overpaid allowed");
        debts[msg.sender].balance -= msg.value;
        if(block.timestamp - debts[msg.sender].lastBorrowed < PAYBACK_PERIOD) {
            emit Paybacked(block.timestamp ,msg.value,debts[msg.sender].balance,msg.sender);
        } else {
            emit LatePaybacked(block.timestamp ,msg.value,debts[msg.sender].balance,msg.sender,
                block.timestamp - debts[msg.sender].lastBorrowed - PAYBACK_PERIOD);
        }
        if(debts[msg.sender].balance == 0) {
            for (uint i = 0; i < borrowers.length; i++) {
                if(borrowers[i]==msg.sender)
                {
                    delete borrowers[i];
                    delete debts[msg.sender];
                    emit DebtCleared(block.timestamp,msg.sender);
                    break;
                }
              
            }
        }
    }

    event Withdraw (uint time,uint amount);
    function withdraw(uint amount) external onlyOwneer whenActive{
        require(amount <= address(this).balance, "Not enough balance");
        owner.transfer(amount);
        emit Withdraw(block.timestamp,amount);
    }

    event CloseDown(uint time);
    function closeDown() external onlyOwneer whenActive{
        require (borrowers.length == 0,"Can not close due existing borrowers");
        emit CloseDown(block.timestamp);
        active = false;
        selfdestruct(owner);
    }
}
