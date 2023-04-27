// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// interfaces
import "./interfaces/IParlayMarketsAMM.sol";
import "./interfaces/IParlayMarketData.sol";

contract CopyableParlayAMM is Initializable {
    struct CoppiedParlayDetails {
        address owner;
        uint256 copiedCount;
        uint256 lastCopiedTime;
    }

    // admin account that inicialized this contract
    address private admin;

    // wallet that will recieve referral funds
    address private constant owner = 0xF21e489f84566Bd82DFF2783C80b5fC1A9dca608;

    mapping(address => CoppiedParlayDetails) public coppiedParlays; // parlayAddress -> CoppiedParlayDetails
    mapping(address => address[]) public parlayToWallets; // parlayAddress -> walletAddress[]
    mapping(address => address[]) public walletToParlays; // walletAddress -> parlayAddress[]

    IParlayMarketsAMM private parlayMarketsAMM;
    IParlayMarketData private parlayMarketData;

    function initialize(
        address _admin,
        address _parlayMarketsAMMAddress,
        address _parlayMarketDataAddress
    ) public initializer {
        admin = _admin;
        parlayMarketsAMM = IParlayMarketsAMM(_parlayMarketsAMMAddress);
        parlayMarketData = IParlayMarketData(_parlayMarketDataAddress);
    }

    function getAdmin() public view returns (address) {
        return admin;
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    function buyFromParlayWithReferrer(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid
    ) external {
        _buyFromParlayWithReferrer(_sportMarkets, _positions, _sUSDPaid, msg.sender, owner);
    }

    function copyFromParlayWithReferrer(address _originalParlayAddress, uint256 _sUSDPaid) external {
        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _originalParlayAddress
        );

        // create new parlay on overtime
        _buyFromParlayWithReferrer(markets, positions, _sUSDPaid, msg.sender, owner);

        // if parlay does not exist, add it to mappings
        if (coppiedParlays[_originalParlayAddress].owner != address(0)) {
            _storeNewParlay(_originalParlayAddress);
        } else {
            _storeExistingParlay(_originalParlayAddress);
        }

        emit ParlayCopied(_originalParlayAddress, msg.sender);
    }

    function buyFromParlayWithDifferentCollateralAndReferrer(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid,
        address _collateral,
        address _referrer
    ) external {
        _buyFromParlayWithDifferentCollateralAndReferrer(_sportMarkets, _positions, _sUSDPaid, _collateral, _referrer);
    }

    function copyFromParlayWithDifferentCollateralAndReferrer(
        address _originalParlayAddress,
        uint256 _sUSDPaid,
        address _collateral,
        address _referrer
    ) external {
        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _originalParlayAddress
        );

        // create new parlay on overtime
        _buyFromParlayWithDifferentCollateralAndReferrer(markets, positions, _sUSDPaid, _collateral, _referrer);

        // if parlay does not exist, add it to mappings
        if (coppiedParlays[_originalParlayAddress].owner != address(0)) {
            _storeNewParlay(_originalParlayAddress);
        } else {
            _storeExistingParlay(_originalParlayAddress);
        }

        emit ParlayCopied(_originalParlayAddress, msg.sender);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _buyFromParlayWithReferrer(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid,
        address _differentRecepient,
        address _referrer
    ) internal {
        // get parlay values required for creating new parlay
        (, uint totalBuyAmount, , , , , ) = parlayMarketsAMM.buyQuoteFromParlay(_sportMarkets, _positions, _sUSDPaid);

        parlayMarketsAMM.buyFromParlayWithReferrer(
            _sportMarkets,
            _positions,
            _sUSDPaid,
            1e16, // additional slippage - 1-2% => (0.01*1e18)
            totalBuyAmount, // expectedPayout
            _differentRecepient, // the owner of the parlay -> if 0x000000.. address is passed => parlayOwner == msg.sender
            _referrer
        );
    }

    function _buyFromParlayWithDifferentCollateralAndReferrer(
        address[] memory _sportMarkets,
        uint[] memory _positions,
        uint _sUSDPaid,
        address _collateral,
        address _referrer
    ) internal {
        // get parlay values required for creating new parlay
        (, , uint totalBuyAmount, , ) = parlayMarketsAMM.buyQuoteFromParlayWithDifferentCollateral(
            _sportMarkets,
            _positions,
            _sUSDPaid,
            _collateral
        );

        parlayMarketsAMM.buyFromParlayWithDifferentCollateralAndReferrer(
            _sportMarkets,
            _positions,
            _sUSDPaid,
            1e16, // additional slippage - 1-2% => (0.01*1e18)
            totalBuyAmount, // expectedPayout
            _collateral,
            _referrer
        );
    }

    function _storeNewParlay(address _parlayAddress) internal {
        require(coppiedParlays[_parlayAddress].owner == address(0), "Ticket already exists");

        coppiedParlays[_parlayAddress] = CoppiedParlayDetails(msg.sender, 0, 0);
    }

    function _storeExistingParlay(address _parlayAddress) internal {
        CoppiedParlayDetails memory coppiedParlay = coppiedParlays[_parlayAddress];
        require(coppiedParlay.owner != address(0), "Parlay does not exist");

        // update the coppiedParlayDetail's fields
        coppiedParlay.copiedCount++;
        coppiedParlay.lastCopiedTime = block.timestamp;

        // update the coppiedParlayDetail's mappings
        parlayToWallets[_parlayAddress].push(msg.sender);
        walletToParlays[msg.sender].push(_parlayAddress);

        emit ParlayCopied(_parlayAddress, msg.sender);
    }

    /* ========== VIEW FUNCTIONS ========== */

    function getCoppiedParlayDetails(address _parlayAddress) public view returns (CoppiedParlayDetails memory) {
        return coppiedParlays[_parlayAddress];
    }

    function getParlayWallets(address _parlayAddress) public view returns (address[] memory) {
        return parlayToWallets[_parlayAddress];
    }

    function getWalletParlays(address _walletAddress) public view returns (address[] memory) {
        return walletToParlays[_walletAddress];
    }

    function getParlayCopiedCount(address _parlayAddress) public view returns (uint256) {
        return coppiedParlays[_parlayAddress].copiedCount;
    }

    fallback() external payable {
        emit Log("fallback called");
    }

    receive() external payable {
        emit Log("receive called");
    }

    event Log(string message);
    event ParlayCopied(address indexed ticketAddress, address indexed walletAddress);
}
