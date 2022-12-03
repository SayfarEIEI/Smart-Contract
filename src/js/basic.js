// const { ast } = require("@truffle/contract/lib/contract/properties");

const WEB3_URL = 'http://localhost:9545/';
// Global variables
let web3,accounts,balances,transactionCounts;
let sender,receiver,senderIndex,receiverIndex;
let amount;
async function init(){
    const provider = new Web3.providers.HttpProvider(WEB3_URL);
    web3 = new Web3(provider);
    //1 Populate Account Table
    await populateAccountTable();
    //2 Common Information
    await updateSelectOptions();
    await setupTransferButton();
    //3 Setup account creation interface
    
    //4 Tranfer Operation
}

async function populateAccountTable(){
    try{
        accounts = await web3.eth.getAccounts();
        await getBalances();
        if(Array.isArray(accounts)&& accounts.length > 0){
            let htmlStr = ''
            for(let i = 0;i < accounts.length; i++){
                const balanceEth = await web3.utils.fromWei(balances[i],'ether')
                htmlStr += '<tr>';
                htmlStr += '<th scope="row">' +(i+1)+'</th>';
                htmlStr += '<td>' + accounts[i] + '</td>';
                htmlStr += '<td>' + Number(balanceEth).toFixed(8) + '</td>';
                htmlStr += '<td>' + transactionCounts[i] + '</td>';
                htmlStr += '</tr>';
            }
            $('#AccountList').html(htmlStr);
        }
    }
    catch(err){
        console.log(err);
    }
 
}
async function getBalances(){
 balances = await Promise.all(accounts.map(async account => await web3.eth.getBalance(account)));

 transactionCounts = await Promise.all(accounts.map(async account => await web3.eth.getTransactionCount(account)));
}
async function updateSelectOptions(){
    if(Array.isArray(accounts)&&accounts.length>0){
        let sOptions = "<option value='-1'>Select Sender Account </option>";
        let rOptions = "<option value='-1'>Select Receiver Account </option>";
        for(let i =0;i<accounts.length;i++)
        {
            sOptions +='<option value="'+i+'">'+(i+1)+')'+accounts[i]+'</option>';
            rOptions +='<option value="'+i+'">'+(i+1)+')'+accounts[i]+'</option>';
        }
        $('#Sender').html(sOptions);
        $('#Receiver').html(rOptions);
        $('#Sender').on('change',e =>{
            senderIndex = e.target.value;
            sender = accounts[senderIndex];
            console.log('sender',sender);
        });
        $('#Receiver').on('change',e =>{
            receiverIndex = e.target.value;
            receiver = accounts[receiverIndex];
            console.log('receiver',receiver);
        });
    }

} 
async function setupTransferButton(){
    $('#TransferBtn').on('click',async e =>{
        if(typeof sender == 'undefined' || typeof receiver == 'undefined' || sender == receiver)return;
        amount = web3.utils.toWei($('#TransferAmount').val(),'ether');
        console.log('amount',amount);
        const senderBalance = await web3.eth.getBalance(sender);
        console.log('sender balance',senderBalance);
        const sBalanceBN = new web3.utils.BN(senderBalance);
        const amountBN = new web3.utils.BN(amount);
        let receipt;
        try{
            if(amountBN.gt(sBalanceBN)) 
                alert("Insufficient Balance");
            else{
                const estimatedGas = await web3.eth.estimateGas({value:amountBN,from:sender,to:receiver});
                const sendingGas = Math.ceil(estimatedGas * 1.5);
                receipt = await web3.eth.sendTransaction({value:amountBN,from:sender,to:receiver,gas:sendingGas});
            }
        }catch(er){
            console.log(er);
            alert('Unable to make a transfer');
        }finally{
            resetControl();
        }
        await populateAccountTable();
        updateTransactionLog(receipt);
    });
}
async function updateTransactionLog(receipt){
    const logEntry = '<li><p>Tx ID:' + receipt.transactionHash+'</p>'+'<p>Sender:'+receipt.from+'</p>'+
    '<p>Gas used:'+receipt.cumulativeGaseUserd+'</p>'+'<p>Gas price:'+receipt.effectiveGasPrice+'</p>'+
    '</li>';
    $('#TransactionLog').append(logEntry);
}
function resetControl(){
    $('#Sender').val(-1);
    $('#Receiver').val(-1);
    $('#TransferAmount').val('');
}