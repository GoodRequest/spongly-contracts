// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IParlayMarketsAMM {
    function buyQuoteFromParlay(
        address[] calldata _sportMarkets,
        uint256[] calldata _positions,
        uint256 _sUSDPaid
    )
        external
        view
        returns (
            uint256 sUSDAfterFees,
            uint256 totalBuyAmount,
            uint256 totalQuote,
            uint256 initialQuote,
            uint256 skewImpact,
            uint256[] memory finalQuotes,
            uint256[] memory amountsToBuy
        );
}
