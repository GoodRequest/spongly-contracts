// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IParlayMarketData {
    function getParlayDetails(address _parlayMarket)
        external
        view
        returns (
            uint numOfSportMarkets,
            uint amount,
            uint sUSDPaid,
            uint totalResultQuote,
            bool resolved,
            bool parlayPaused,
            bool alreadyLost,
            bool fundsIssued,
            address[] memory markets,
            uint[] memory positions,
            uint[] memory oddsOnCreation,
            uint[] memory marketResults,
            bool[] memory resolvedMarkets,
            bool[] memory exercisedMarkets
        );
}
