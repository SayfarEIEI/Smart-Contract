// const { ast } = require("@truffle/contract/lib/contract/properties");


const WEB3_URL = 'ws://localhost:8545/';
// const WEB3_URL = 'http://localhost:9545/';
// Global variables
let web3, accounts, balances, borrowIndex, payerIndex, borrower, payer;
let owner, contractAddress, debts;
let simpleLoan;
const DEFAULT_OPTION = -1;

async function init() {
    let provider;
    if(WEB3_URL.toLocaleLowerCase().startsWith('ws'))
        provider = new Web3.providers.WebsocketProvider(WEB3_URL);
    else
        provider = new Web3.providers.HttpProvider(WEB3_URL);
    web3 = new Web3(provider);
    //1 Populate Account Table
    accounts = await web3.eth.getAccounts()
    // await getAccountsInfo();
    await deployContract();
    // await populateAccountTable();
}

async function setupBorrowButton(){
    $('#BorrowBtn').on('click',async e =>{
        let borrowAmount =parseFloat($('#BorrowAomunt').val());
        console.log("Test",borrowAmount,borrower);
        if (isNaN(borrowAmount) || typeof borrower =='undefined')
        return;
        const amount =web3.utils.toWei(String(borrowAmount),'ether');
        try {
            const estGas = await simpleLoan.borrow.estimateGas(amount,{from:borrower});
            const sendingGas =Math.ceil(estGas * 1.5);
            const { receipt } =await simpleLoan.borrow(amount,{from:borrower,gas:sendingGas});
            updateBorrowLog(receipt);
            await getLoanInfo();
            await populateAccountTable();
        } catch (err) {
            console.log(err);
            alert('Unable to borrow');
            return;
        }finally{
            resetBorrowControl();
        }
    });
}

function resetBorrowControl(){
    $('#BorrowAmount').val('');
    $('#Borrowers').val(-1);
}

function updateBorrowLog(receipt){
    const logEntry =
    '<li><p>TxHash:'+ receipt.transactionHash + '</p>'+
    '<p>BlockNumber:' + receip.blocknumber + '</p>' +
    '<p>Borrower:' + receipt.from + '</p>'+
    '<p>Gas used:' + receipt.cumulativeGasUsed +'</p>'+
    '</li>';
    $('#BorrowTxLog').append(logEntry);
}
async function setupPayBackButton(){
    $('#PaybackBtn').on('click',async e =>{
        let paybackAmount =parseFloat($('#PaybackAmount').val());
        if (isNaN(paybackAmount) || typeof borrower =='undefined')
        return;
        const amount =web3.utils.toWei(String(paybackAmount),'ether');
        try {
            const estGas = await simpleLoan.payer.estimateGas({value: amount,from:payer});
            const sendingGas =Math.ceil(estGas * 1.5);
            const {receipt} = await simpleLoan.payer({value:amount,from:payer,gas:sendingGas});
            updatePayBackLog();
            await getLoanInfo();
            await populateAccountTable();
        } catch (error) {
            console.log(err);
            alert('Unable to borrow');
            return;
        }finally{
            resetPayBackControl();
        }
    });
}

function resetPayBackControl(){
    $('#aybackAmount').val('');
    $('#PaybackBorrowers').val(-1);
}

function updatePayBackLog(receipt){
    const logEntry =
    '<li><p>TxHash:'+ receipt.transactionHash + '</p>'+
    '<p>BlockNumber:' + receip.blocknumber + '</p>' +
    '<p>Payer:' + receipt.from + '</p>'+
    '<p>Gas used:' + receipt.cumulativeGasUsed +'</p>'+
    '</li>';
    $('#PaybackTx').append(logEntry);
}
async function setupEvenListener(){
    simpleLoan.Deposited().on('data',e =>{
       const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
       const money = web3.utils.fromWei(e.returnValues.amount,'ether');
       const html = '<li class="lead">[Deposited]:Owner has deposited '+money+'Ether at '+ dateTime +'</li>';
       $('#EventLog').append(html);
    });
    simpleLoan.interestRateChanged().on('data',e =>{
        const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
        const newRate =  e.returnValues.newRate;
        const oldRate =  e.returnValues.oldRate;
        const html = '<li class="lead">[InterestRate]:Interest Rate has changed form '
                        +oldRate+'% to '+ newRate+'% at '+dateTime +'</li>';
        $('#EventLog').append(html);
     });
     simpleLoan.Borrowed().on('data',e =>{
        const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
        const money = web3.utils.fromWei(e.returnValues.amount,'ether');
        const borrower = e.returnValues.borrower;
        const html = '<li class="lead">[Borrowed]:Borrower('+borrower+') has borrowed '+ money 
                        + 'Ether at' + dateTime +'</li>';
        $('#EventLog').append(html);
     });
     simpleLoan.Paybacked().on('data',e =>{
        const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
        const money = web3.utils.fromWei(e.returnValues.amount,'ether');
        const borrower = e.returnValues.borrower;
        const remainingEther = web3.utils.fromWei(e.returnValues.remaining,'ether')
        const html = '<li class="lead">[Paybacked]:Borrower('+borrower+') has repaid '
                     + money +'Ether(' +remainingEther+'Ether remaining ) at'  + dateTime +'</li>';
        $('#EventLog').append(html);
     });
     simpleLoan.LatePaybacked().on('data',e =>{
        const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
        const money = web3.utils.fromWei(e.returnValues.amount,'ether');
        const borrower = e.returnValues.borrower;
        const period = e.returnValues.period;
        const remainingEther = web3.utils.fromWei(e.returnValues.remaining,'ether')
        const html = '<li class="lead">[LatePaybacked]:Borrower('+borrower+') has repaid '
                     + money +'Ether(' +remainingEther+'Ether remaining ) at'  + dateTime +
                      '(LATE BY: '+ period +' Seconds)'+'</li>';
        $('#EventLog').append(html);
     });
     simpleLoan.DebtCleared().on('data',e =>{
        const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
        const borrower = e.returnValues.borrower;
        const html = '<li class="lead">[DebtCleared]:Borrower('+borrower+') has repaid all debt at '
                       + dateTime +'</li>';
        $('#EventLog').append(html);
        simpleLoan.Withdraw().on('data',e =>{
            const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
            const money = web3.utils.fromWei(e.returnValues.amount,'ether');
            const html = '<li class="lead">[Withdraw]:Owner has withdraw '+money+'Ether at '+ dateTime +'</li>';
            $('#EventLog').append(html);
         });
         $('#EventLog').append(html);
         simpleLoan.CloseDown().on('data',e =>{
             const dateTime =  (new Date(e.returnValues.time * 1000)).toLocaleString();
             const html = '<li class="lead">[CloseDown]:Simple Loan contract is detroyed at '+dateTime +'</li>';
             $('#EventLog').append(html);
          });
     });
}


async function updateSelectOptions(){
    if(!Array.isArray(accounts) || !accounts.length > 0) 
        return ;
    let borrowOptions ='<option value = "-1">Select Borrower Account</option>';
    for(let i = 1;i< accounts.length;i++){
        borrowOptions += '<option value="' + i +'">'+(i+1) + ') '+ accounts[i] + '</option>';
    }
    $('#Borrowers').html(borrowOptions);
    $('#PayBackBorrowers').html(borrowOptions);
    $('#Borrowers').on('change',async e =>{
        borrowIndex =e.target.value;
        borrower = accounts[borrowIndex];
        // console.log('borrower',borrower)
    });
    $('#PaybackBorrowers').on('change', async e =>{
        payerIndex = e.target.value;
        payer = accounts[payerIndex];
        // console.log('payer',payer);
    });
}

async function getLoanInfo() {
    // owner = accounts[0];
    $('#LoanOwner').html(owner);
    $('#LoanContractAddress').html(contractAddress);
    const firstDeposit = web3.utils.toWei('20', 'ether');
    // const firstDepositBN = new web3.utils.BN(firstDeposit);
    try {
        // await simpleLoan.deposit({ value: firstDeposit, from: owner });
        const contractBalance = await web3.eth.getBalance(contractAddress);
        $('#LoanContractBalance').html(web3.utils.fromWei(contractBalance, 'ether'));
        const borrowers =await simpleLoan.getBorrowers.call();
        $('#borrowerCount').html(borrowers.length);
        const rateNumerator = await simpleLoan.interestRateNumerator.call();
        const rateDenumerator =await simpleLoan.interestRateDenominator.call();
        const interestRate =Number(rateNumerator*100/rateDenumerator).toFixed(2);
        $('#InterestRate').html(interestRate);
    } catch (err) {
        console.log(err);
    }

    // await populateAccountTable();
}

async function deployContract() {
    $.getJSON('SimpleLoan.Json', async contractABI => {
        const contract = TruffleContract(contractABI);
        contract.setProvider(web3.currentProvider);
        try {
            simpleLoan = await contract.deployed();
            contractAddress = simpleLoan.address;
            console.log('simple loan contract', simpleLoan);
            await setupEvenListener();
            await firstTimeDeposit();
            await getLoanInfo();
            await populateAccountTable();
            await updateSelectOptions();
            await setupBorrowButton();
            await setupPayBackButton();
            await setupWithdrawButton();
            await setupNewInteresRateButton();
        }
        catch (err) {
            console.log(err)
        }
    });
}

async function getDebtsInfo(){
    const borrowers =await simpleLoan.getBorrowers.call();
    debts = await Promise.all(borrowers.map(async borrower => await simpleLoan.getDebts(borrower)));
}

async function populateAccountTable() {
    try {
        // accounts = await web3.eth.getAccounts();
        await getBalances();
        await getDebtsInfo();
        const borrowers =await simpleLoan.getBorrowers.call();
        const currentDebts =[];
        for(let i = 0;i<accounts.length;i++) {
            let found =false;
            for(let j = 0;j< borrowers.length;j++){
                if(accounts[i] ==borrowers[j])
                {
                 currentDebts[i] = web3.utils.fromWei(debts[j],'ether');
                found = true;
                break;
                }
            }
            if(!found)
            currentDebts[i] = 0;
        }

        if (Array.isArray(accounts) && accounts.length > 0) {
            let htmlStr = ''
            for (let i = 0; i < accounts.length; i++) {
                const balanceEth = await web3.utils.fromWei(balances[i], 'ether')
                htmlStr += '<tr>';
                htmlStr += '<th scope="row">' + (i + 1) + '</th>';
                htmlStr += '<td>' + accounts[i] + '</td>';
                htmlStr += '<td>' + Number(balanceEth).toFixed(8) + '</td>';
                htmlStr += '<td>' + currentDebts[i].toFixed(8) + '<td>';
                // htmlStr += '<td>' + web3.utils.fromWei(dents[i]), 'ether' + '</td>';
                htmlStr += '</tr>';
            }
            $('#AccountList').html(htmlStr);
        }
    }
    catch (err) {
        console.log(err);
    }

}

async function getBalances() {
    balances = await Promise.all(accounts.map(async account => await web3.eth.getBalance(account)));

    transactionCounts = await Promise.all(accounts.map(async account => await web3.eth.getTransactionCount(account)));
}
async function firstTimeDeposit(){
    owner = accounts[0];
    const firstDeposit = web3.utils.toWei('20','ether');
    try{
        await simpleLoan.deposit({value:firstDeposit,from:owner});
    }
    catch(err){
        console.log(err);
    }
}
async function setupNewInteresRateButton(){
    $('#InterestRate').on('click',async e =>{
        let newRate = $('#InterestRate').val();
        if(isNaN(newRate)|| newRate<=0) 
        {alert('Invalid Interest Rate'); return; }
        try {
            const estGas = await simpleLoan.setInteresyRate.estimateGas(newRate,{from:owner});
            const sendingGas = Math.ceil(estGas * 1.5);
            await simpleLoan.setInteresyRate(newRate,{from:owner,gas:sendingGas});
            const rateNumerator = await simpleLoan.interestRateNumerator.call();
            const rateDenominator = await simpleLoan.interestRateDenominator.call();
            $('#InterestRate').html(Number(rateNumerator * 100 / rateDenominator).toFixed(2));
        } catch (err) {
            console.log(err);
        }
        finally{
            $('#NewInterestRate').val('');
        }
    });
}
async function setupWithdrawButton(){
    $('#WithdrawBtn').on('click',async e => {
        let amount = String($('#WithdrawAmount').val());
        if(isNaN(amount)|| amount <= 0){
           return alert('Invalid Withdraw Amount');
        }
        const contractBalanceBN = new web3.utils.BN(await web3.eth.getBalances(contractAddress));
        let withdrawBN = new web3.utils.BN(web3.utils.toWei(amount,'ether'));
        if(withdrawBN.gt(contractBalanceBN)) return alert('Insufficient fund to withdraw');
        try {
            const estGas = await simpleLoan.Withdraw.estimateGas(withdrawBN,{from:owner});
            const sendingGas = Math.ceil(estGas * 1.5);
            await simpleLoan.Withdraw(withdrawBN,{from:owner,gas:sendingGas});
        } catch (err) {
            console.log(err);
        }
        finally{
            $('#WithdrawAmount').val('');
        }
        await populateAccountTable();
        await getLoanInfo();
    });
}



