// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarketRegistry {
    enum MarketStatus {
        OPEN,
        PAUSED,
        RESOLVED,
        CANCELLED
    }

    struct Market {
        uint256 marketId;
        string question;
        string category;
        string resolutionSource;
        bytes32 resolutionSourceHash;
        uint256 deadline;
        uint256 createdAt;
        MarketStatus status;
        address creator;
        uint256 liquidityHint;
        string marketType;
    }

    uint256 private nextMarketId = 1;
    uint256[] private marketIds;
    mapping(uint256 => Market) private markets;

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string category,
        string resolutionSource,
        bytes32 indexed resolutionSourceHash,
        uint256 deadline,
        uint256 liquidityHint,
        string marketType,
        address indexed creator
    );

    event MarketStatusUpdated(uint256 indexed marketId, MarketStatus status);

    function createMarket(
        string calldata question,
        string calldata category,
        string calldata resolutionSource,
        bytes32 resolutionSourceHash,
        uint256 deadline,
        uint256 liquidityHint,
        string calldata marketType
    ) external returns (uint256 marketId) {
        require(bytes(question).length > 0, "QUESTION_REQUIRED");
        require(bytes(resolutionSource).length > 0, "SOURCE_REQUIRED");
        require(deadline > block.timestamp, "DEADLINE_IN_PAST");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            marketId: marketId,
            question: question,
            category: category,
            resolutionSource: resolutionSource,
            resolutionSourceHash: resolutionSourceHash,
            deadline: deadline,
            createdAt: block.timestamp,
            status: MarketStatus.OPEN,
            creator: msg.sender,
            liquidityHint: liquidityHint,
            marketType: marketType
        });
        marketIds.push(marketId);

        emit MarketCreated(
            marketId,
            question,
            category,
            resolutionSource,
            resolutionSourceHash,
            deadline,
            liquidityHint,
            marketType,
            msg.sender
        );
    }

    function updateMarketStatus(uint256 marketId, MarketStatus status) external {
        Market storage market = markets[marketId];
        require(market.creator != address(0), "MARKET_NOT_FOUND");
        require(msg.sender == market.creator, "ONLY_CREATOR");

        market.status = status;
        emit MarketStatusUpdated(marketId, status);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        Market memory market = markets[marketId];
        require(market.creator != address(0), "MARKET_NOT_FOUND");
        return market;
    }

    function getMarkets() external view returns (Market[] memory results) {
        results = new Market[](marketIds.length);
        for (uint256 i = 0; i < marketIds.length; i++) {
            results[i] = markets[marketIds[i]];
        }
    }
}
