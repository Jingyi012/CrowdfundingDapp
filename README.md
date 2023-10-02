# CrowdfundingDapp
This is the dapp for crowdfunding smart contract.\
To create the smart contract, you need to go into the contract directory and pass 3 parameters which is the goal, start date and end date to goal app create command.

Example:
``` 
goal app create --creator $ONE --approval-prog approval.teal --clear-prog clear.teal --global-ints 4 --global-byteslices 2  --local-ints 1 --local-byteslices 0 --app-arg "int:10000000" --app-arg "int:1696063684" --app-arg "int:1696121284"
```
-First arg is goal amount of algo in microalgo\
-Second arg is the start date and time in unix (second)\
-Third arg is the end date and time in unix (second)
