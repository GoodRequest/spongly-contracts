// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// external
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// interfaces
import "./interfaces/IParlayMarketsAMM.sol";
import "./interfaces/IParlayMarketData.sol";

contract TicketSystem is Initializable {
    struct TicketDetail {
        address owner;
        uint256 copiedCount;
        uint256 lastCopiedTime;
    }

    address private admin;

    mapping(address => TicketDetail) internal tickets; // ticketAddress -> TicketDetail
    mapping(address => address[]) internal ticketToWallets; // ticketAddress -> walletAddress[]
    mapping(address => address[]) internal walletToTickets; // walletAddress -> ticketAddress[]

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

    // data stores
    function storeNewParlay(address _ticketAddress) private {
        require(tickets[_ticketAddress].owner == address(0), "Ticket already exists");
        TicketDetail memory newTicket = TicketDetail(msg.sender, 0, 0);
        tickets[_ticketAddress] = newTicket;
    }

    function storeExistingParlay(address _ticketAddress) private {
        TicketDetail storage ticket = tickets[_ticketAddress];
        require(ticket.owner != address(0), "Ticket does not exist");

        // update the ticket's fields
        ticket.copiedCount++;
        ticket.lastCopiedTime = block.timestamp;

        // update the ticket mappings
        ticketToWallets[_ticketAddress].push(msg.sender);
        walletToTickets[msg.sender].push(_ticketAddress);

        emit TicketCopied(_ticketAddress, msg.sender);
    }

    // actions
    function buyFromParlay(
        address[] calldata _sportMarkets,
        uint256[] calldata _positions,
        uint256 _sUSDPaid
    ) public view {
        parlayMarketsAMM.buyQuoteFromParlay(_sportMarkets, _positions, _sUSDPaid);
    }

    function copyFromParlay(address _originalTicketAddress, uint _sUSDpaid) public {
        // get data from original ticket
        (, , , , , , , , address[] memory markets, uint[] memory positions, , , , ) = parlayMarketData.getParlayDetails(
            _originalTicketAddress
        );

        // create new ticket on overtime
        parlayMarketsAMM.buyQuoteFromParlay(markets, positions, _sUSDpaid);

        emit TicketCopied(_originalTicketAddress, msg.sender);

        // if ticket does not exist
        if (tickets[_originalTicketAddress].owner != address(0)) {
            storeNewParlay(_originalTicketAddress);
        } else {
            storeExistingParlay(_originalTicketAddress);
        }
    }

    // getters
    function getTicketDetail(address _ticketAddress) public view returns (TicketDetail memory) {
        return tickets[_ticketAddress];
    }

    function getTicketWallets(address _ticketAddress) public view returns (address[] memory) {
        return ticketToWallets[_ticketAddress];
    }

    function getWalletTickets(address _walletAddress) public view returns (address[] memory) {
        return walletToTickets[_walletAddress];
    }

    // aggregations
    function getTicketCopiedCount(address _ticketAddress) public view returns (uint256) {
        return tickets[_ticketAddress].copiedCount;
    }

    function getWalletsByTicketAddress(address _ticketAddress) public view returns (address[] memory) {
        return ticketToWallets[_ticketAddress];
    }

    function getTicketsByWalletAddress(address _walletAddress) public view returns (address[] memory) {
        return walletToTickets[_walletAddress];
    }

    // default fallbacks
    fallback() external payable {
        emit Log("fallback");
    }

    receive() external payable {
        emit Log("receive");
    }

    // events
    event Log(string typeOfFunction);
    event TicketCopied(address indexed ticketAddress, address indexed walletAddress);
}
