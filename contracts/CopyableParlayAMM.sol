// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external
import {SafeERC20Upgradeable, IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// interfaces
import {IParlayMarketsAMM} from "./interfaces/IParlayMarketsAMM.sol";
import {IParlayMarketData} from "./interfaces/IParlayMarketData.sol";

// internal
import "./utils/proxy/solidity-0.8.0/ProxyReentrancyGuard.sol";
import "./utils/proxy/solidity-0.8.0/ProxyOwned.sol";
import "./utils/proxy/solidity-0.8.0/ProxyPausable.sol";

contract CopyableParlayAMM is Initializable, ProxyOwned, ProxyPausable, ProxyReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct CoppiedParlayDetails {
        address owner;
        uint256 copiedCount;
        uint256 lastCopiedTime;
    }

    // admin account that inicialized this contract
    address private admin;

    // wallet that will recieve referral funds
    address private constant reffererAddress = 0xF21e489f84566Bd82DFF2783C80b5fC1A9dca608;

    mapping(address => CoppiedParlayDetails) private coppiedParlays; // parlayAddress -> CoppiedParlayDetails
    mapping(address => address[]) private parlayToWallets; // parlayAddress -> walletAddress[]
    mapping(address => address[]) private walletToParlays; // walletAddress -> parlayAddress[]

    IParlayMarketsAMM private parlayMarketsAMM;
    IParlayMarketData private parlayMarketData;
    IERC20Upgradeable public sUSD;

    function initialize(
        address _owner,
        address _parlayMarketsAMMAddress,
        address _parlayMarketDataAddress,
        IERC20Upgradeable _sUSD
    ) public initializer {
        setOwner(_owner);
        initNonReentrant();
        parlayMarketsAMM = IParlayMarketsAMM(_parlayMarketsAMMAddress);
        parlayMarketData = IParlayMarketData(_parlayMarketDataAddress);
        sUSD = _sUSD;
        sUSD.approve(_parlayMarketsAMMAddress, type(uint256).max);
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    function buyFromParlayWithReferrer(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid
    ) external nonReentrant notPaused {
        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        _buyFromParlayWithReferrer(_sportMarkets, _positions, _sUSDPaid, msg.sender, reffererAddress);
    }

    function buyFromParlayWithDifferentCollateralAndReferrer(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid,
        address _collateral
    ) external nonReentrant notPaused {
        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        _buyFromParlayWithDifferentCollateralAndReferrer(_sportMarkets, _positions, _sUSDPaid, _collateral, reffererAddress);
    }

    function copyFromParlayWithReferrer(address _originalParlayAddress, uint256 _sUSDPaid) external nonReentrant notPaused {
        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _originalParlayAddress
        );

        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        // create new parlay on overtime
        _buyFromParlayWithReferrer(markets, positions, _sUSDPaid, msg.sender, reffererAddress);

        // store new coppied parlay
        _handleParlayStore(_originalParlayAddress);
    }

    function copyFromParlayWithDifferentCollateralAndReferrer(
        address _originalParlayAddress,
        uint256 _sUSDPaid,
        address _collateral
    ) external nonReentrant notPaused {
        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _originalParlayAddress
        );

        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        // create new parlay on overtime
        _buyFromParlayWithDifferentCollateralAndReferrer(markets, positions, _sUSDPaid, _collateral, reffererAddress);

        // store new coppied parlay
        _handleParlayStore(_originalParlayAddress);
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

    function _handleParlayStore(address _parlayAddress) internal {
        // if parlay does not exist, add it to mappings
        if (coppiedParlays[_parlayAddress].owner != address(0)) {
            _storeNewParlay(_parlayAddress);
        } else {
            _storeExistingParlay(_parlayAddress);
        }

        emit ParlayCopied(_parlayAddress, msg.sender);
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

    event ParlayCopied(address indexed ticketAddress, address indexed walletAddress);
}
