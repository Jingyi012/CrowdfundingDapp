import './App.css';
import {PeraWalletConnect} from '@perawallet/connect';
import algosdk, { waitForConfirmation } from 'algosdk';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useEffect, useState } from 'react';

// Create the PeraWalletConnect instance outside the component
const peraWallet = new PeraWalletConnect();

// The app ID on testnet
const appIndex = 404166216;
// app address
const applicationAddress = "P46444XOJB5GQSSIEHVR64BKKI5HQQEEJQRY6WRRQDQJ4MWIX6UDEXO6PE";

// connect to the algorand node
const algod = new algosdk.Algodv2('','https://testnet-api.algonode.cloud', 443);

function App() {
  const [accountAddress, setAccountAddress] = useState(null);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [localDonateAmt, setlocalDonateAmt] = useState(0);
  const [globalTotalFundRaised, setglobalTotalFundRaised] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [creator, setCreator] = useState(null);
  const [is_creator, setIsCreator] = useState(false);
  const [donateAmt, setDonateAmt] = useState(0);
  const [startDateConvert, setStartDateConvert] = useState("");
  const [endDateConvert, setEndDateConvert] = useState("");
  const [isGoalAchieve, setGoalAchieve] = useState(false);
  const [on_fundraising, setOnFundraising] = useState(true);
  const isConnectedToPeraWallet = !!accountAddress;

  useEffect(() => {
    checkUserDonation();
    checkAllGlobalState();
    if(accountAddress == creator){
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
    
    if(globalTotalFundRaised >= currentGoal){
      setGoalAchieve(true);
    } else {
      setGoalAchieve(false);
    }

    function getCurrentUnixTimestamp() {
      const currentTimestamp = new Date().getTime() / 1000;
      return Math.floor(currentTimestamp);
    }
    
    const unixTimestamp = getCurrentUnixTimestamp();

    //check on fundraising period and not reach goal
    if(unixTimestamp <= endDate && !isGoalAchieve){
      setOnFundraising(true);
    } else {
      setOnFundraising(false);
    }

    const sdate = new Date(startDate * 1000);
    const syear = sdate.getFullYear();
    const smonth = String(sdate.getMonth() + 1).padStart(2, '0'); 
    const sday = String(sdate.getDate()).padStart(2, '0'); 
    const shours = String(sdate.getHours()).padStart(2, '0'); 
    const sminutes = String(sdate.getMinutes()).padStart(2, '0'); 
    const sseconds = String(sdate.getSeconds()).padStart(2, '0');
    setStartDateConvert(`${syear}-${smonth}-${sday} ${shours}:${sminutes}:${sseconds}`) ;

    const edate = new Date(endDate * 1000);
    const eyear = edate.getFullYear();
    const emonth = String(edate.getMonth() + 1).padStart(2, '0');
    const eday = String(edate.getDate()).padStart(2, '0');
    const ehours = String(edate.getHours()).padStart(2, '0');
    const eminutes = String(edate.getMinutes()).padStart(2, '0');
    const eseconds = String(edate.getSeconds()).padStart(2, '0');
    setEndDateConvert(`${eyear}-${emonth}-${eday} ${ehours}:${eminutes}:${eseconds}`);

    // reconnect to session when the component is mounted
    peraWallet.reconnectSession().then((accounts) => {
      // Setup disconnect event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);

      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    })

  },[startDate, endDate, on_fundraising, isGoalAchieve, is_creator, currentGoal,globalTotalFundRaised]);
  
  return (
    <div className='pageWrapper'>
      <div class="pageContainer">
        <meta name="name" content="Crowdfunding" />
        <h1> Crowdfunding Application</h1>
        {isConnectedToPeraWallet ? (<div className="walletAddress">Hi, {accountAddress}</div>) : ""}
        <div class="walletBtns">
          <Button className="btn-wallet"
            onClick={
              isConnectedToPeraWallet ? handleDisconnectWalletClick : handleConnectWalletClick
            }>
            {isConnectedToPeraWallet ? "Disconnect" : "Connect to Pera Wallet"}
          </Button>
          <Button className="btn-wallet"
            onClick={
              () => optInToApp()
            }>
            Opt-in
          </Button>
        </div>

        <div className="fundInfoContainer">
          <div className="FundRaiseInfo">
            <h3>Start Date: {startDateConvert}</h3>
            <h3>End Date: {endDateConvert}</h3>
            <h3>Goal: </h3>
            <div className="goal-text">{currentGoal} Algo</div>
          </div>
          <div className="totalFundRaised">
            <h3>Total Fund Raised: </h3>
            <div className="total-fund-text">{globalTotalFundRaised} Algo</div>
          </div>
          
          {isConnectedToPeraWallet ? 
          <>
            <div className="totalUserDonation">
              <h3>Your donation amount: </h3>
              <div className="total-donation-text">{localDonateAmt} Algo</div>
            </div>
            <hr/>

            {on_fundraising?<>
            <form method="post" action="" id="donateInputForm" onSubmit={(e)=>{
                e.preventDefault();
                if(donateAmt > 0.001){
                  makeDonation('donate', donateAmt*1000000);
                } else{
                  alert('Donation amount must be greater 0.001 Algo');
                }
              }}>
              <h4>Enter the amount of algo to donate: </h4>
              <input type="text" name="donateInput" id="donateInput" onChange={(e)=> {
                const inputValue = e.target.value;
                const parsedValue = parseFloat(inputValue);
                if (!isNaN(parsedValue)) {
                  setDonateAmt(parsedValue);
                } else {
                  setDonateAmt(0);
                }
                }}/>
              <button type="submit" className='donateBtn btn-primary btn'>Donate</button>
            </form>
            <hr /></> : null}

            {is_creator ? 
            (<div className="creatorFunction">
              <h4>Creator Function:</h4>
              <div className="creatorFunctionBtns">
                <Button className="withdrawBtn" id="withdrawBtn"
                  onClick={
                  () => callFundRaiseApplication('withdrawAll')
                  }>
                  Withdrawal
                </Button> 
                <Button className="update_goal_btn" id="update_goal_btn"
                  onClick={
                  () => {
                    const newgoal = parseFloat(prompt("Enter new goal in unit Algo"));
                    if(isNaN(newgoal)){
                      return;
                    } else {
                      callFundRaiseApplication2("update_goal", (newgoal*1000000));
                    }
                  }
                  }>
                  Update Goal
                </Button>
                <Button className="update_end_date_btn" id="update_end_date_btn"
                  onClick={
                  () => {
                    const newEndDate = parseInt(prompt("Enter new end time in unix (second)"));
                    if (isNaN(newEndDate)) {
                      return;
                    }
                    if(newEndDate <= startDate){
                      alert("The new end time must greater than start time");
                    } else {
                      callFundRaiseApplication2("update_end_date", newEndDate);
                    }
                  }
                  }>
                  Update End Date
                </Button>
              </div>
            </div>): null}
          </> : (
            isGoalAchieve ? (<div className="message">😊 Goal achieved, thanks for all contributors.</div>) : 
            <div className="message">💡Please connect to wallet and opt-in if you wish to contribute.</div>
          )}
        </div>
      </div>
    </div>
  );

  function handleConnectWalletClick() {
    peraWallet.connect().then((newAccounts) => {
      // setup the disconnect event listener
      peraWallet.connector?.on('disconnect', handleDisconnectWalletClick);

      setAccountAddress(newAccounts[0]);
      checkAllGlobalState();
      checkUserDonation();
      if(accountAddress == creator){
        setIsCreator(true);
      } else {
        setIsCreator(false);
      }
    });
  }

    function handleDisconnectWalletClick() {
      peraWallet.disconnect();
      setAccountAddress(null);
    }

    async function optInToApp() {
      const suggestedParams = await algod.getTransactionParams().do();
      const optInTxn = algosdk.makeApplicationOptInTxn(
        accountAddress,
        suggestedParams,
        appIndex
      );

      const optInTxGroup = [{txn: optInTxn, signers: [accountAddress]}];

        const signedTx = await peraWallet.signTransaction([optInTxGroup]);
        console.log(signedTx);
        const { txId } = await algod.sendRawTransaction(signedTx).do();
        const result = await waitForConfirmation(algod, txId, 2);
    }

    async function checkAllGlobalState() {
      try {
        const contractInfo = await algod.getApplicationByID(appIndex).do();

        const creator = contractInfo.params['global-state'].find((entry) => entry.key === Buffer.from('Creator').toString('base64'));
        const currentGoal = contractInfo.params['global-state'].find((entry) => entry.key === Buffer.from('Goal').toString('base64'));
        const startDate = contractInfo.params['global-state'].find((entry) => entry.key === Buffer.from('FundRaiseStart').toString('base64'));
        const endDate = contractInfo.params['global-state'].find((entry) => entry.key === Buffer.from('FundRaiseEnd').toString('base64'));
        const totalFundRaised = contractInfo.params['global-state'].find((entry) => entry.key === Buffer.from('TotalBalance').toString('base64'));
        if (!!creator) {  
          setCreator(algosdk.encodeAddress(new Uint8Array(Buffer.from(creator.value.bytes, 'base64'))));
        } else {
          setCreator(null);
        }

        if (!!currentGoal) {
          setCurrentGoal(currentGoal.value.uint / 1000000);
        } else {
          setCurrentGoal(0);
        }

        if (!!startDate) {
          setStartDate(startDate.value.uint);
        } else {
          setStartDate(0);
        }

        if (!!endDate) {
          setEndDate(endDate.value.uint);
        } else {
          setEndDate(0);
        }

        if (!!totalFundRaised.value.uint) {
          setglobalTotalFundRaised(totalFundRaised.value.uint / 1000000);
        } else {
          setglobalTotalFundRaised(0);
        }
        
      } catch (e) {
        console.error('There was an error connecting to the algorand node: ', e)
      }
    }

    async function checkUserDonation() {
      try {
        const accountInfo = await algod.accountApplicationInformation(accountAddress,appIndex).do();
        
        if (!!accountInfo['app-local-state']['key-value'][0].value.uint) {
          setlocalDonateAmt(accountInfo['app-local-state']['key-value'][0].value.uint / 1000000);
        } else {
          setlocalDonateAmt(0);
        }
        
      } catch (e) {
        console.error('There was an error connecting to the algorand node: ', e)
      }
    }

    async function callFundRaiseApplication(action) {
      try {
        // get suggested params
        const suggestedParams = await algod.getTransactionParams().do();
        const appArgs = [new Uint8Array(Buffer.from(action))];
        
        const actionTx = algosdk.makeApplicationNoOpTxn(
          accountAddress,
          suggestedParams,
          appIndex,
          appArgs
          );

        const actionTxGroup = [{txn: actionTx, signers: [accountAddress]}];

        const signedTx = await peraWallet.signTransaction([actionTxGroup]);
        console.log(signedTx);
        const { txId } = await algod.sendRawTransaction(signedTx).do();
        const result = await waitForConfirmation(algod, txId, 2);
        checkAllGlobalState();
        checkUserDonation();
      
      } catch (e) {
        console.error(`There was an error calling the crowdfunding app: ${e}`);
      }
    }
    function intToUint8Array(value, numBytes = 8) {
      if (numBytes <= 0 || numBytes > 8) {
        throw new Error("Invalid number of bytes. Must be between 1 and 8.");
      }
    
      // Convert the integer to a binary string with leading zeros
      const binaryString = value.toString(2).padStart(numBytes * 8, '0');
    
      // Initialize an array to hold the bytes
      const bytes = [];
    
      // Split the binary string into 8-bit chunks and convert to integers
      for (let i = 0; i < numBytes; i++) {
        const startIndex = i * 8;
        const endIndex = startIndex + 8;
        const byte = parseInt(binaryString.slice(startIndex, endIndex), 2);
        bytes.push(byte);
      }
    
      // Create a Uint8Array from the array of bytes
      return new Uint8Array(bytes);
    }
    async function callFundRaiseApplication2(action, arg2) {
      try {
        const suggestedParams = await algod.getTransactionParams().do();
        const appArgs = [new Uint8Array(Buffer.from(action)), intToUint8Array(arg2)];
        const actionTx = algosdk.makeApplicationNoOpTxn(
          accountAddress,
          suggestedParams,
          appIndex,
          appArgs
          );

        const actionTxGroup = [{txn: actionTx, signers: [accountAddress]}];

        const signedTx = await peraWallet.signTransaction([actionTxGroup]);
        const { txId } = await algod.sendRawTransaction(signedTx).do();
        const result = await waitForConfirmation(algod, txId, 2);
        checkAllGlobalState();
        checkUserDonation();
      
      } catch (e) {
        console.error(`There was an error calling the crowdfunding app: ${e}`);
      }
    }

    async function makeDonation(action, donationAmount) {
      try {
        // get suggested params
        const suggestedParams = await algod.getTransactionParams().do();
        const appArgs = [new Uint8Array(Buffer.from(action))];
        
        const actionTx = algosdk.makeApplicationNoOpTxn(
          accountAddress,
          suggestedParams,
          appIndex,
          appArgs
          );
        
        const paymentTx = algosdk.makePaymentTxnWithSuggestedParams(
          accountAddress,
          applicationAddress, // Replace with the recipient's address
          donationAmount,   // Specify the donation amount here
          undefined,
          undefined,
          suggestedParams
        );
        
        const txnsArray = [actionTx, paymentTx];
        algosdk.assignGroupID(txnsArray);

        try{
          const signedTxnGroups = await peraWallet.signTransaction([
            [{txn: actionTx, signers: [accountAddress]}],
            [{txn: paymentTx, signers: [accountAddress]}],
          ]);

          const { txId } = await algod.sendRawTransaction(signedTxnGroups).do();
          console.log(txId);
          const result = await waitForConfirmation(algod, txId, 2);
          console.log(result);
          checkAllGlobalState();
          checkUserDonation();
        } catch(e){
          console.log("Could not sign all transactions", e);
        }

      } catch (e) {
        console.error(`There was an error making donation: ${e}`);
      }
    }
}

export default App;
