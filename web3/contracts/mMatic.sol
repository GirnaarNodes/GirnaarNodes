// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract mMatic is Ownable, ERC20 {
    
    mapping(address => bool) public whitelisted;

    constructor() ERC20("mMatic", "mMatic") {
        whitelisted[msg.sender] = true;
    }

    function addToWhitelist(address account) external onlyOwner {
        whitelisted[account] = true;
    }

    function removeFromWhitelist(address account) external onlyOwner {
        whitelisted[account] = false;
    }

    function mint(address to, uint256 amount) external {
        require(whitelisted[msg.sender], "not whitelisted");
        
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(whitelisted[msg.sender], "not whitelisted");
        
        _burn(from, amount);
    }
}