// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
interface IMatic is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract Girnaar is Ownable, ReentrancyGuard {

    IMatic public mMatic;

    uint256 private constant THRESHOLD_AMOUNT = 10000 ether;
    uint256 private constant TRANSFER_TICK = 5000 ether;

    address public ethContractAddress;

    uint256 public dAppId;
    uint256 public APR;
    uint256 public lastRewardDistribution;
    uint256 public rewardPeriod; 

    mapping (uint256 => address) public dAppRewardWallet;
    mapping (uint256 => uint256) public dAppBalances;
    mapping (uint256 => uint256[]) public dAppSubPlans;  // in WEI
    mapping (address => mapping (uint256 => uint256)) public userToDApp;

    event DAppRegister(uint256 indexed dAppId, address rewardWallet);
    event Subscribe(address indexed account, uint256 indexed dAppId, uint256 amount);
    event Unsubscribe(address indexed account, uint256 indexed dAppId, uint256 amount);
    
    constructor(address _mMatic, uint256 _APR, uint256 _rewardPeriod) {
        mMatic = IMatic(_mMatic);

        APR = _APR;
        rewardPeriod = _rewardPeriod;
        lastRewardDistribution = block.number;
    }

    function setAPR(uint256 _APR) external onlyOwner {
        APR = _APR;
    }

    function setRewardPeriod(uint256 _rewardPeriod) external onlyOwner {
        rewardPeriod = _rewardPeriod;
    }

    function registerDApp(address rewardWallet, uint256[] calldata subPlans) external {
        dAppRewardWallet[dAppId] = rewardWallet;
        dAppSubPlans[dAppId] = subPlans;

        emit DAppRegister(dAppId, rewardWallet);
        
        dAppId = dAppId + 1;
    }

    function updateSubPlans(uint256 id, uint256[] calldata subPlans) external {
        dAppSubPlans[id] = subPlans;
    }

    function subscribe(uint256 id, uint256 planId) external payable nonReentrant {
        require(dAppRewardWallet[id] != address(0), "invalid id");
        require(msg.value >= dAppSubPlans[id][planId], "Invalid Value");

        userToDApp[msg.sender][id] += dAppSubPlans[id][planId];
        dAppBalances[id] += dAppSubPlans[id][planId];

        mMatic.mint(msg.sender, dAppSubPlans[id][planId]);


        if (address(this).balance > THRESHOLD_AMOUNT + TRANSFER_TICK) {
            uint256 transferAmount = address(this).balance - THRESHOLD_AMOUNT;
            // _bridgeMATIC (_ETH_CONTRACT_ADDRESS, _transfer_amount);   
        }

        emit Subscribe(msg.sender, id, dAppSubPlans[id][planId]);
    }

    function upgradeSubscription(uint256 id, uint256 oldPlanId, uint256 newPlanId) external payable nonReentrant {
        require(dAppRewardWallet[id] != address(0), "invalid id");

        uint256 upgradeAmount = dAppSubPlans[id][newPlanId] - dAppSubPlans[id][oldPlanId];
        require(msg.value >= upgradeAmount, "Invalid Value");

        userToDApp[msg.sender][id] += upgradeAmount;
        dAppBalances[id] += upgradeAmount;

        mMatic.mint(msg.sender, upgradeAmount);

        if (address(this).balance > THRESHOLD_AMOUNT + TRANSFER_TICK) {
            uint256 transferAmount = address(this).balance - THRESHOLD_AMOUNT;
            // _bridgeMATIC (_ETH_CONTRACT_ADDRESS, _transfer_amount);   
        }

        emit Subscribe(msg.sender, id, dAppSubPlans[id][newPlanId]);
    }

    function unsubscribe(uint256 id, uint256 planId) external nonReentrant {
        require(dAppRewardWallet[id] != address(0), "invalid id");
        require(mMatic.balanceOf(msg.sender) >= dAppSubPlans[id][planId], "invalid amount");

        if (dAppSubPlans[id][planId] > address(this).balance) {
            // _withdraw_from_ETH (_withdrawal_amount + _THRESHOLD_AMOUNT);	
            // Balance Inadequate in contract, come back after 3 days
			// return;
        }

        (bool sent, ) = payable(msg.sender).call{value: userToDApp[msg.sender][id]}("");
        require(sent, "transfer failed");

        if (address(this).balance < THRESHOLD_AMOUNT) {
            // _withdraw_from_ETH (max (_THRESHOLD_AMOUNT - _CURRENT_BALANCE), _TRANSFER_TICK);
        }

        emit Unsubscribe(msg.sender, id, userToDApp[msg.sender][id]);

        userToDApp[msg.sender][id] -= dAppSubPlans[id][planId];
        dAppBalances[id] -= dAppSubPlans[id][planId];

        mMatic.burn(msg.sender, dAppSubPlans[id][planId]);
    }

    // Rewards to DApp will be airdropped from backend.

    function withdraw(uint256 weiAmount, address to) external onlyOwner {
        require(address(this).balance >= weiAmount, "insufficient balance");
        (bool sent, ) = payable(to).call{value: weiAmount}("");
        require(sent, "Failed to withdraw");
    }
}