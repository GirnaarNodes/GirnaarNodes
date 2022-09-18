// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMatic is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract GirnaarPolygon is Ownable, ReentrancyGuard {
    IMatic public mMatic;

    uint256 private constant THRESHOLD_AMOUNT = 10000 ether;
    uint256 private constant TRANSFER_TICK = 5000 ether;

    address public ethContractAddress;

    uint256 public dAppId;
    uint256 public APR;
    uint256 public lastRewardDistribution;
    uint256 public rewardPeriod;
    uint256 public cancellationFees;

    uint256 public readyToStake;
    

    struct User {
        uint256 planAmount;
        uint256 planValidity;
    }

    struct Plan {
        bool live;
        uint256 price; // in WEI
        uint256 validity; // in Days
    }

    struct DApp {
        bool live;
        address rewardWallet;
        uint256 balance;
        uint256 paid;
        uint256 cancellationFees; // in % multiplied with 100
    }

    // mapping of DApp id to DApp
    mapping(uint256 => DApp) public dApp;

    // mapping of DApp id to DApp plans
    mapping(uint256 => Plan[]) public dAppPlan;

    // mapping of user to dApp to plan to User
    mapping(address => mapping(uint256 => mapping(uint256 => User)))
        public userInfo;

    event DAppRegister(uint256 indexed dAppId, address rewardWallet);
    event RemoveDApp(uint256 indexed dAppId);
    event Subscribe(
        address indexed account,
        uint256 indexed dAppId,
        uint256 planId,
        uint256 amount,
        uint256 validity
    );
    event Renew(
        address indexed account,
        uint256 indexed dAppId,
        uint256 planId,
        uint256 newValidity
    );
    event Unsubscribe(
        address indexed account,
        uint256 indexed dAppId,
        uint256 planId,
        uint256 amount
    );
    event Cancel(
        address indexed account,
        uint256 indexed dAppId,
        uint256 planId,
        uint256 amount
    );

    constructor(
        address _mMatic,
        uint256 _APR,
        uint256 _rewardPeriod
    ) {
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

    function setCancellationFees(uint256 _cancellationFees) external onlyOwner {
        cancellationFees = _cancellationFees;
    }

    function registerDApp(
        address _rewardWallet,
        uint256 _cancellationFees,
        uint256[] memory _price,
        uint256[] memory _validity
    ) external onlyOwner {
        require(_price.length == _validity.length, "length mismatch");

        dApp[dAppId].live = true;
        dApp[dAppId].rewardWallet = _rewardWallet;
        dApp[dAppId].cancellationFees = _cancellationFees;

        for (uint256 i = 0; i < _price.length; i++) {
            dAppPlan[dAppId].push(
                Plan({live: true, price: _price[i], validity: _validity[i]})
            );
        }

        emit DAppRegister(dAppId, _rewardWallet);

        dAppId = dAppId + 1;
    }

    function removeDApp(uint256 _dAppId) external onlyOwner {
        delete dApp[_dAppId].live;
        delete dApp[_dAppId].rewardWallet;

        delete dAppPlan[dAppId];

        emit RemoveDApp(_dAppId);
    }

    function addSubPlans(
        uint256 _dAppId,
        uint256[] memory _price,
        uint256[] memory _validity
    ) external onlyOwner {
        require(_price.length == _validity.length, "length mismatch");

        for (uint256 i = 0; i < _price.length; i++) {
            dAppPlan[_dAppId].push(
                Plan({live: true, price: _price[i], validity: _validity[i]})
            );
        }
    }

    function removeSubPlan(uint256 _dAppId, uint256 _planId)
        external
        onlyOwner
    {
        dAppPlan[_dAppId][_planId].live = false;
    }

    function setDAppCancellationFees(uint256 _dAppId, uint256 _cancellationFees)
        external
        onlyOwner
    {
        dApp[_dAppId].cancellationFees = _cancellationFees;
    }

    function bridgeable() public view returns (uint256 amount) {
        if (address(this).balance > THRESHOLD_AMOUNT + TRANSFER_TICK) {
            amount = address(this).balance - THRESHOLD_AMOUNT;
        }
    }

    function subscribe(uint256 _dAppId, uint256 _planId)
        external
        payable
        nonReentrant
    {
        require(dApp[_dAppId].live, "dApp not live");
        require(dAppPlan[_dAppId][_planId].live, "plan not live");

        User storage user = userInfo[msg.sender][_dAppId][_planId];
        uint256 price = dAppPlan[_dAppId][_planId].price;

        require(user.planValidity <= block.timestamp, "plan is active");
        require(msg.value >= price, "invalid value");

        dApp[_dAppId].balance += price;

        user.planAmount += price;
        user.planValidity =
            block.timestamp +
            (dAppPlan[_dAppId][_planId].validity * 1 days);

        mMatic.mint(msg.sender, price);

        emit Subscribe(msg.sender, _dAppId, _planId, price, user.planValidity);
    }

    function renewSubscription(uint256 _dAppId, uint256 _planId)
        external
        nonReentrant
    {
        require(dApp[_dAppId].live, "dApp not live");
        require(dAppPlan[_dAppId][_planId].live, "plan not live");

        User storage user = userInfo[msg.sender][_dAppId][_planId];

        require(
            user.planAmount >= dAppPlan[_dAppId][_planId].price,
            "invalid value"
        );

        if (user.planValidity > block.timestamp) {
            user.planValidity += (dAppPlan[_dAppId][_planId].validity * 1 days);
        } else {
            user.planValidity =
                block.timestamp +
                (dAppPlan[_dAppId][_planId].validity * 1 days);
        }

        emit Renew(msg.sender, _dAppId, _planId, user.planValidity);
    }

    function unsubscribe(uint256 _dAppId, uint256 _planId)
        external
        nonReentrant
    {
        require(
            userInfo[msg.sender][_dAppId][_planId].planValidity <
                block.timestamp,
            "plan is active"
        );

        uint256 price = dAppPlan[_dAppId][_planId].price;

        require(mMatic.balanceOf(msg.sender) >= price, "invalid amount");

        require(
            address(this).balance >= price,
            "not enough balance, come back after some time"
        );

        userInfo[msg.sender][_dAppId][_planId].planAmount -= price;
        dApp[_dAppId].balance -= price;

        mMatic.burn(msg.sender, price);

        (bool sent, ) = payable(msg.sender).call{value: price}("");
        require(sent, "transfer failed");

        emit Unsubscribe(msg.sender, _dAppId, _planId, price);
    }

    function cancelSubscription(uint256 _dAppId, uint256 _planId)
        external
        nonReentrant
    {
        uint256 price = dAppPlan[_dAppId][_planId].price;

        require(mMatic.balanceOf(msg.sender) >= price, "invalid amount");

        require(
            address(this).balance >= price,
            "not enough balance, come back after some time"
        );

        mMatic.burn(msg.sender, price);

        uint256 amountToPlatform = (price * cancellationFees) / 10000;
        uint256 amountToUser = price -
            ((price * dApp[_dAppId].cancellationFees) / 10000) -
            amountToPlatform;

        dApp[_dAppId].balance -= amountToUser;

        if (amountToPlatform > 0) {
            dApp[_dAppId].balance -= amountToPlatform;
        }

        (bool sent, ) = payable(msg.sender).call{value: amountToUser}("");
        require(sent, "transfer failed");

        emit Cancel(msg.sender, _dAppId, _planId, amountToUser);

        userInfo[msg.sender][_dAppId][_planId].planAmount -= price;
    }

    function distributeDAppRewards(
        uint256[] memory _dAppId,
        uint256[] memory _amount
    ) external payable onlyOwner {
        require(_dAppId.length == _amount.length, "length mismatch");

        address to;

        for (uint256 i; i < _dAppId.length; i++) {
            to = dApp[_dAppId[i]].rewardWallet;
            require(to != address(0), "zero address");

            dApp[_dAppId[i]].paid += _amount[i];

            (bool sent, ) = payable(to).call{value: _amount[i]}("");
            require(sent, "Failed to withdraw");
        }

        lastRewardDistribution = block.timestamp;
    }

    function withdraw(address to, uint256 weiAmount) external onlyOwner {
        require(address(this).balance >= weiAmount, "insufficient balance");
        (bool sent, ) = payable(to).call{value: weiAmount}("");
        require(sent, "Failed to withdraw");
    }

    receive() external payable {}
}
