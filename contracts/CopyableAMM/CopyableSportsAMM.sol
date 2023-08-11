// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external
import {SafeERC20Upgradeable, IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// interfaces
import {ISportsAMM} from "../interfaces/ISportsAMM.sol";
import {ICurveSUSD} from "../interfaces/ICurveSUSD.sol";

// internal
import "../utils/proxy/solidity-0.8.0/ProxyReentrancyGuard.sol";
import "../utils/proxy/solidity-0.8.0/ProxyOwned.sol";
import "../utils/proxy/solidity-0.8.0/ProxyPausable.sol";

contract CopyableSportsAMM is Initializable, ProxyOwned, ProxyPausable, ProxyReentrancyGuard {
	using SafeERC20Upgradeable for IERC20Upgradeable;

	uint private constant ONE = 1e18;
	uint private constant ONE_PERCENT = 1e16;
	uint private constant MAX_APPROVAL = type(uint256).max;

	struct CopiedMarketDetails {
		bool wasCopied;
		uint256 copiedCount;
		uint256 modifiedCount;
		uint256 lastCopiedTime;
	}

	mapping(string => CopiedMarketDetails) private copiedMarkets;
	mapping(string => address[]) private marketToWallets;
	mapping(address => string[]) private walletToMarkets;

	ISportsAMM private sportsAMM;

	/// @return The sUSD contract used for payment
	IERC20Upgradeable public sUSD;

	/// @return The address of the Curve contract for multi-collateral
	ICurveSUSD public curveSUSD;

	/// @return The address of USDC
	address public usdc;

	/// @return The address of USDT (Tether)
	address public usdt;

	/// @return The address of DAI
	address public dai;

	/// @return Curve usage is enabled?
	bool public curveOnrampEnabled;

	/// @return maximum supported discount in percentage on sUSD purchases with different collaterals
	uint public maxAllowedPegSlippagePercentage;

	function initialize(
		address _owner,
		address _sportsAMMAddress,
		IERC20Upgradeable _sUSD,
		uint _maxAllowedPegSlippagePercentage
	) public initializer {
		setOwner(_owner);
		initNonReentrant();
		sportsAMM = ISportsAMM(_sportsAMMAddress);
		sUSD = _sUSD;
		maxAllowedPegSlippagePercentage = _maxAllowedPegSlippagePercentage;

		// approve sUSD to sportsAMM
		sUSD.approve(address(sportsAMM), MAX_APPROVAL);
	}

	/* ========== EXTERNAL FUNCTIONS ========== */

	function buyFromAMMWithCopy(
		address _sportMarket,
		ISportsAMM.Position _position,
		uint256 _sUSDPaid,
		uint _additionalSlippage,
		uint _expectedPayout,
		address _refferer,
		string calldata _copiedFromMarket,
		bool _modified
	) external nonReentrant notPaused {
		// transfer sUSD from msg.sender
		sUSD.safeTransferFrom(msg.sender, address(this), _sUSDPaid);

		sportsAMM.buyFromAMMWithReferrer(
			_sportMarket,
			_position,
			_sUSDPaid,
			_expectedPayout,
			_additionalSlippage,
			_refferer
		);

		// store new copied parlay
		if (bytes(_copiedFromMarket).length > 0) {
			_handleDataStore(_copiedFromMarket, _modified);
		}
	}

	// write a solidity jsdoc comment for this function parameters
	function buyFromParlayWithCopyAndDifferentCollateral(
		address _sportMarket,
		ISportsAMM.Position _position,
		uint256 _sUSDPaid,
		uint _additionalSlippage,
		uint _expectedPayout,
		address _collateral,
		address _refferer,
		string calldata _copiedFromMarket,
		bool _modified
	) external nonReentrant notPaused {
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

		require((collateralQuote * ONE) / (_sUSDPaid) <= (ONE + _additionalSlippage), "Slippage too high!");

		IERC20Upgradeable collateralToken = IERC20Upgradeable(_collateral);
		collateralToken.safeTransferFrom(msg.sender, address(this), collateralQuote);
		curveSUSD.exchange_underlying(curveIndex, 0, collateralQuote, _sUSDPaid);

		sportsAMM.buyFromAMMWithDifferentCollateralAndReferrer(
			_sportMarket,
			_position,
			_sUSDPaid,
			_expectedPayout,
			_additionalSlippage,
			_collateral,
			_refferer
		);

		// store new copied parlay
		if (bytes(_copiedFromMarket).length > 0) {
			_handleDataStore(_copiedFromMarket, _modified);
		}
	}

	/* ========== INTERNAL FUNCTIONS ========== */

	function _handleDataStore(string calldata _marketAddress, bool _modified) internal {
		CopiedMarketDetails storage market = copiedMarkets[_marketAddress];

		if (market.wasCopied == false) {
			uint256 modifiedCount = 0;

			if (_modified) {
				modifiedCount++;
			}

			copiedMarkets[_marketAddress] = CopiedMarketDetails(true, 1, modifiedCount, block.timestamp);
		} else {
			market.copiedCount++;
			market.lastCopiedTime = block.timestamp;

			if (_modified) {
				market.modifiedCount++;
			}
		}

		marketToWallets[_marketAddress].push(msg.sender);
		walletToMarkets[msg.sender].push(_marketAddress);

		emit MarketCopied(_marketAddress, msg.sender);
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

	function getCopiedMarketDetails(string calldata _marketAddress) public view returns (CopiedMarketDetails memory) {
		return copiedMarkets[_marketAddress];
	}

	function getMarketWallets(string calldata _marketAddress) public view returns (address[] memory) {
		return marketToWallets[_marketAddress];
	}

	function getWalletMarkets(address _walletAddress) public view returns (string[] memory) {
		return walletToMarkets[_walletAddress];
	}

	function getMarketCopiedCount(string calldata _marketAddress) public view returns (uint256[2] memory) {
		CopiedMarketDetails memory market = copiedMarkets[_marketAddress];
		return [market.copiedCount, market.modifiedCount];
	}

	/* ========== SETTERS FUNCTIONS ========== */

	function setAddresses(address _sportsAMMAddress) external onlyOwner {
		sportsAMM = ISportsAMM(_sportsAMMAddress);
		sUSD.approve(address(sportsAMM), MAX_APPROVAL);
		emit AddressesSet(_sportsAMMAddress);
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

	event AddressesSet(address sportsAMMAddress);
	event MarketCopied(string indexed marketID, address indexed walletAddress);
	event CurveParametersUpdated(address curveSUSD, address dai, address usdc, address usdt, bool curveOnrampEnabled);
}
