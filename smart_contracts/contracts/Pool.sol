pragma solidity >= 0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";


contract pToken is ERC20Detailed, ERC20, Ownable {
  constructor() public ERC20Detailed("pToken", "Pooled token", 18) {
  }
  
  function mint(address account, uint256 amount) public onlyOwner returns(bool) {
    _mint(account, amount);
    return true;
  }
  
  function burn(address account, uint256 amount) public onlyOwner returns(bool) {
    _burn(account, amount);
    return true;
  }
}

contract Pool is Ownable {
  using SafeMath for uint256;
  uint256 peth_multiplier = DECIMAL_MULTIPLIER;
  uint256 total_borrowed;
  uint256 total_collected;
  IERC20 public token;
  
  pToken public ptoken;
  uint256 constant DECIMAL_MULTIPLIER = 1e18;
  uint256 constant INCOME_FEE = 1e16;
  
  constructor(address _token) public {
    token = IERC20(_token);
    ptoken = new pToken();
  }
  
  function _ensureTransferFrom(uint256 amount) internal {
    if (address(token)==address(0))
      require(msg.value==amount);
    else
      require(token.transferFrom(msg.sender, address(this), amount));
  }
  
  function _release(address payable account, uint256 amount) internal {
    if (address(token)==address(0))
      account.transfer(amount);
    else 
      token.transfer(account, amount);
  }
  
  function _increaseInterest(uint interest) internal {
    peth_multiplier = peth_multiplier.add(interest.mul(DECIMAL_MULTIPLIER).div(ptoken.totalSupply()));
  }
  
  function _decreaseInterest(uint interest) internal {
    peth_multiplier = peth_multiplier.sub(interest.mul(DECIMAL_MULTIPLIER).div(ptoken.totalSupply()));
  }
  
  function collect(uint amount) public payable returns(bool) {
    _ensureTransferFrom(amount);
    uint totalSupply = ptoken.totalSupply();
    if(totalSupply > 0){
      uint256 fee = msg.value.mul(INCOME_FEE).div(DECIMAL_MULTIPLIER);
      _increaseInterest(fee);
      ptoken.mint(msg.sender, (msg.value-fee).mul(DECIMAL_MULTIPLIER).div(peth_multiplier));
    } else {
      ptoken.mint(msg.sender, msg.value);
    }
    total_collected = total_collected.add(msg.value);
    return true;
  }
  
  function release(uint256 amount) public returns(bool) {
    require(ptoken.burn(msg.sender, amount));
    uint to_release = amount.mul(peth_multiplier).div(DECIMAL_MULTIPLIER);
    total_collected=total_collected.sub(to_release);
    _release(msg.sender, to_release);
    return true;
  }
  
  function invest(address receiver, bytes memory data, uint256 gas, uint256 amount) public onlyOwner returns(bool) {
    //TODO write restrictions here
    (bool success, bytes memory result) = receiver.call.gas(gas).value(amount)(data);
    total_borrowed = total_borrowed.add(amount);
    require(success);
    return true;
  }
  
  function computeRedeem(uint borrowed, uint redeemed) public onlyOwner returns(bool) {
    total_borrowed = total_borrowed.sub(borrowed);
    total_collected = total_collected.add(redeemed).sub(borrowed);
    require(total_collected <= address(this).balance);
    if (borrowed > redeemed) 
      _decreaseInterest(borrowed-redeemed); 
    else 
      _increaseInterest(redeemed-borrowed);

  }
  
}