// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external
import {SafeERC20Upgradeable, IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// interfaces
import {IParlayMarketsAMM} from "./interfaces/IParlayMarketsAMM.sol";
import {IParlayMarketData} from "./interfaces/IParlayMarketData.sol";
import {ICurveSUSD} from "./interfaces/ICurveSUSD.sol";

// internal
import "./utils/proxy/solidity-0.8.0/ProxyReentrancyGuard.sol";
import "./utils/proxy/solidity-0.8.0/ProxyOwned.sol";
import "./utils/proxy/solidity-0.8.0/ProxyPausable.sol";

contract CopyableParlayAMM is Initializable, ProxyOwned, ProxyPausable, ProxyReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint private constant ONE = 1e18;
    uint private constant ONE_PERCENT = 1e16;
    uint private constant MAX_APPROVAL = type(uint256).max;

    struct CopiedParlayDetails {
        address owner;
        uint256 copiedCount;
        uint256 lastCopiedTime;
    }

    mapping(address => CopiedParlayDetails) private copiedParlays; // parlayAddress -> CopiedParlayDetails
    mapping(address => address[]) private parlayToWallets; // parlayAddress -> walletAddress[]
    mapping(address => address[]) private walletToParlays; // walletAddress -> parlayAddress[]

    IParlayMarketsAMM private parlayMarketsAMM;
    IParlayMarketData private parlayMarketData;
    IERC20Upgradeable public sUSD;
    ICurveSUSD public curveSUSD;

    address private refferer;
    address public usdc;
    address public usdt;
    address public dai;

    bool public curveOnrampEnabled;
    uint public maxAllowedPegSlippagePercentage;

    function initialize(
        address _owner,
        address _parlayMarketsAMMAddress,
        address _parlayMarketDataAddress,
        IERC20Upgradeable _sUSD,
        address _referrer,
        uint _maxAllowedPegSlippagePercentage
    ) public initializer {
        setOwner(_owner);
        initNonReentrant();
        parlayMarketsAMM = IParlayMarketsAMM(_parlayMarketsAMMAddress);
        parlayMarketData = IParlayMarketData(_parlayMarketDataAddress);
        sUSD = _sUSD;
        refferer = _referrer;
        maxAllowedPegSlippagePercentage = _maxAllowedPegSlippagePercentage;
        sUSD.approve(address(parlayMarketsAMM), MAX_APPROVAL);
    }

    /* ========== EXTERNAL FUNCTIONS ========== */

    function buyFromParlay(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid
    ) external nonReentrant notPaused {
        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        _buyFromParlayWithReferrer(_sportMarkets, _positions, _sUSDPaid, msg.sender, refferer);
    }

    function copyFromParlay(address _parlayAddress, uint256 _sUSDPaid) external nonReentrant notPaused {
        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _parlayAddress
        );

        // // transfer sUSD from msg.sender
        sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

        // // create new parlay on overtime
        _buyFromParlayWithReferrer(markets, positions, _sUSDPaid, msg.sender, refferer);

        // // store new copied parlay
        _handleParlayStore(_parlayAddress);
    }

    function buyFromParlayWithDifferentCollateral(
        address[] memory _sportMarkets,
        uint256[] memory _positions,
        uint256 _sUSDPaid,
        address _collateral
    ) external nonReentrant notPaused {
        uint additionalSlippage = 1e16; // 1-2% => (0.01*1e18)

        int128 curveIndex = _mapCollateralToCurveIndex(_collateral);
        require(curveIndex > 0 && curveOnrampEnabled, "unsupported collateral");

        // cant get a quote on how much collateral is needed from curve for sUSD,
        // so rather get how much of collateral you get for the sUSD quote and add 0.2% to that
        uint collateralQuote = (curveSUSD.get_dy_underlying(0, curveIndex, _sUSDPaid) * (ONE + (ONE_PERCENT / (5)))) / ONE;

        uint transformedCollateralForPegCheck = _collateral == usdc || _collateral == usdt
            ? collateralQuote * 1e12
            : collateralQuote;
        require(
            maxAllowedPegSlippagePercentage > 0 &&
                transformedCollateralForPegCheck >= (_sUSDPaid * (ONE - maxAllowedPegSlippagePercentage)) / ONE,
            "Amount below max allowed peg slippage"
        );

        require((collateralQuote * ONE) / (_sUSDPaid) <= (ONE + additionalSlippage), "Slippage too high!");

        IERC20Upgradeable collateralToken = IERC20Upgradeable(_collateral);
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralQuote);
        curveSUSD.exchange_underlying(curveIndex, 0, collateralQuote, _sUSDPaid);

        _buyFromParlayWithDifferentCollateralAndReferrer(_sportMarkets, _positions, _sUSDPaid, _collateral, refferer);
    }

    function copyFromParlayWithDifferentCollateral(
        address _parlayAddress,
        uint256 _sUSDPaid,
        address _collateral
    ) external nonReentrant notPaused {
        uint additionalSlippage = 1e16; // 1-2% => (0.01*1e18)

        int128 curveIndex = _mapCollateralToCurveIndex(_collateral);
        require(curveIndex > 0 && curveOnrampEnabled, "unsupported collateral");

        // cant get a quote on how much collateral is needed from curve for sUSD,
        // so rather get how much of collateral you get for the sUSD quote and add 0.2% to that
        uint collateralQuote = (curveSUSD.get_dy_underlying(0, curveIndex, _sUSDPaid) * (ONE + (ONE_PERCENT / (5)))) / ONE;

        uint transformedCollateralForPegCheck = _collateral == usdc || _collateral == usdt
            ? collateralQuote * 1e12
            : collateralQuote;
        require(
            maxAllowedPegSlippagePercentage > 0 &&
                transformedCollateralForPegCheck >= (_sUSDPaid * (ONE - maxAllowedPegSlippagePercentage)) / ONE,
            "Amount below max allowed peg slippage"
        );

        require((collateralQuote * ONE) / (_sUSDPaid) <= (ONE + additionalSlippage), "Slippage too high!");

        IERC20Upgradeable collateralToken = IERC20Upgradeable(_collateral);
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralQuote);
        curveSUSD.exchange_underlying(curveIndex, 0, collateralQuote, _sUSDPaid);

        // get values from original parlay
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _parlayAddress
        );

        // create new parlay on overtime
        _buyFromParlayWithDifferentCollateralAndReferrer(markets, positions, _sUSDPaid, _collateral, refferer);

        // store new copied parlay
        _handleParlayStore(_parlayAddress);
    }

    function retrieveSUSDAmount(address payable account, uint amount) external onlyOwner {
        sUSD.safeTransfer(account, amount);
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
        CopiedParlayDetails storage parlay = copiedParlays[_parlayAddress];

        if (parlay.owner == address(0)) {
            // Create new the copiedParlayDetails
            copiedParlays[_parlayAddress] = CopiedParlayDetails(msg.sender, 1, block.timestamp);
        } else {
            // Update the copiedParlayDetails
            parlay.copiedCount++;
            parlay.lastCopiedTime = block.timestamp;

            // Update the wallet-to-parlays and parlay-to-wallets mappings
            parlayToWallets[_parlayAddress].push(msg.sender);
            walletToParlays[msg.sender].push(_parlayAddress);
        }

        emit ParlayCopied(_parlayAddress, msg.sender);
    }

    function _mapCollateralToCurveIndex(address collateral) internal view returns (int128) {
        if (collateral == dai) {
            return 1;
        }
        if (collateral == usdc) {
            return 2;
        }
        if (collateral == usdt) {
            return 3;
        }
        return 0;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function getCopiedParlayDetails(address _parlayAddress) public view returns (CopiedParlayDetails memory) {
        return copiedParlays[_parlayAddress];
    }

    function getParlayWallets(address _parlayAddress) public view returns (address[] memory) {
        return parlayToWallets[_parlayAddress];
    }

    function getWalletParlays(address _walletAddress) public view returns (address[] memory) {
        return walletToParlays[_walletAddress];
    }

    function getParlayCopiedCount(address _parlayAddress) public view returns (uint256) {
        return copiedParlays[_parlayAddress].copiedCount;
    }

    /* ========== SETTERS FUNCTIONS ========== */

    function setAddresses(address _parlayMarketsAMM, address _parlayMarketData) external onlyOwner {
        parlayMarketsAMM = IParlayMarketsAMM(_parlayMarketsAMM);
        parlayMarketData = IParlayMarketData(_parlayMarketData);
        sUSD.approve(address(parlayMarketsAMM), MAX_APPROVAL);
        emit AddressesSet(_parlayMarketsAMM, _parlayMarketData);
    }

    /// @notice Setting the Curve collateral addresses for all collaterals
    /// @param _curveSUSD Address of the Curve contract
    /// @param _dai Address of the DAI contract
    /// @param _usdc Address of the USDC contract
    /// @param _usdt Address of the USDT (Tether) contract
    /// @param _maxAllowedPegSlippagePercentage maximum discount AMM accepts for sUSD purchases
    function setCurveSUSD(
        address _curveSUSD,
        address _dai,
        address _usdc,
        address _usdt,
        bool _curveOnrampEnabled,
        uint _maxAllowedPegSlippagePercentage
    ) external onlyOwner {
        curveSUSD = ICurveSUSD(_curveSUSD);
        dai = _dai;
        usdc = _usdc;
        usdt = _usdt;
        IERC20Upgradeable(dai).approve(_curveSUSD, MAX_APPROVAL);
        IERC20Upgradeable(usdc).approve(_curveSUSD, MAX_APPROVAL);
        IERC20Upgradeable(usdt).approve(_curveSUSD, MAX_APPROVAL);
        // not needed unless selling into different collateral is enabled
        // sUSD.approve(_curveSUSD, MAX_APPROVAL);
        curveOnrampEnabled = _curveOnrampEnabled;
        maxAllowedPegSlippagePercentage = _maxAllowedPegSlippagePercentage;
        emit CurveParametersUpdated(_curveSUSD, _dai, _usdc, _usdt, _curveOnrampEnabled);
    }

    /// @notice Setting the refferer address
    /// @param _refferer Address of the refferer
    function setRefferer(address _refferer) external onlyOwner {
        refferer = _refferer;
        emit ReffererUpdated(_refferer);
    }

    event AddressesSet(address _parlayMarketsAMM, address _parlayMarketData);
    event ParlayCopied(address indexed ticketAddress, address indexed walletAddress);
    event CurveParametersUpdated(address curveSUSD, address dai, address usdc, address usdt, bool curveOnrampEnabled);
    event ReffererUpdated(address reffererAddress);
}
