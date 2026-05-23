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
        string externalMarketId;
        string platform;
        string question;
        string category;
        string resolutionSource;
        uint256 deadline;
        uint256 createdAt;
        MarketStatus status;
        address creator;
        uint256 liquidityHint;
        uint16 impliedProbability;
        string marketType;
        string marketUrl;
        bytes32 metadataHash;
    }

    uint256 private nextMarketId = 1;
    uint256[] private marketIds;
    mapping(uint256 => Market) private markets;

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string category,
        string resolutionSource,
        uint256 deadline,
        uint256 liquidityHint,
        string marketType,
        address indexed creator
    );

    event ExternalMarketImported(
        uint256 indexed marketId,
        string externalMarketId,
        string platform,
        string question,
        string category,
        string resolutionSource,
        uint256 deadline,
        uint256 liquidityHint,
        uint16 impliedProbability,
        string marketType,
        string marketUrl,
        bytes32 indexed metadataHash,
        address indexed creator
    );

    event MarketStatusUpdated(uint256 indexed marketId, MarketStatus status);

    function createMarket(
        string calldata question,
        string calldata category,
        string calldata resolutionSource,
        uint256 deadline,
        uint256 liquidityHint,
        string calldata marketType
    ) external returns (uint256 marketId) {
        marketId = _storeMarket(
            "",
            "Arc Testnet",
            question,
            category,
            resolutionSource,
            deadline,
            liquidityHint,
            0,
            marketType,
            "",
            keccak256(abi.encode(question, category, resolutionSource, deadline, liquidityHint, marketType))
        );

        emit MarketCreated(
            marketId,
            question,
            category,
            resolutionSource,
            deadline,
            liquidityHint,
            marketType,
            msg.sender
        );
    }

    function importExternalMarket(
        string calldata externalMarketId,
        string calldata platform,
        string calldata question,
        string calldata category,
        string calldata resolutionSource,
        uint256 deadline,
        uint256 liquidityHint,
        uint16 impliedProbability,
        string calldata marketType,
        string calldata marketUrl,
        bytes32 metadataHash
    ) external returns (uint256 marketId) {
        require(bytes(externalMarketId).length > 0, "EXTERNAL_ID_REQUIRED");
        require(bytes(platform).length > 0, "PLATFORM_REQUIRED");
        require(bytes(marketUrl).length > 0, "MARKET_URL_REQUIRED");
        require(metadataHash != bytes32(0), "METADATA_HASH_REQUIRED");

        marketId = _storeMarket(
            externalMarketId,
            platform,
            question,
            category,
            resolutionSource,
            deadline,
            liquidityHint,
            impliedProbability,
            marketType,
            marketUrl,
            metadataHash
        );

        emit ExternalMarketImported(
            marketId,
            externalMarketId,
            platform,
            question,
            category,
            resolutionSource,
            deadline,
            liquidityHint,
            impliedProbability,
            marketType,
            marketUrl,
            metadataHash,
            msg.sender
        );
    }

    function _storeMarket(
        string memory externalMarketId,
        string memory platform,
        string memory question,
        string memory category,
        string memory resolutionSource,
        uint256 deadline,
        uint256 liquidityHint,
        uint16 impliedProbability,
        string memory marketType,
        string memory marketUrl,
        bytes32 metadataHash
    ) private returns (uint256 marketId) {
        require(bytes(question).length > 0, "QUESTION_REQUIRED");
        require(bytes(resolutionSource).length > 0, "SOURCE_REQUIRED");
        require(deadline > block.timestamp, "DEADLINE_IN_PAST");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            marketId: marketId,
            externalMarketId: externalMarketId,
            platform: platform,
            question: question,
            category: category,
            resolutionSource: resolutionSource,
            deadline: deadline,
            createdAt: block.timestamp,
            status: MarketStatus.OPEN,
            creator: msg.sender,
            liquidityHint: liquidityHint,
            impliedProbability: impliedProbability,
            marketType: marketType,
            marketUrl: marketUrl,
            metadataHash: metadataHash
        });
        marketIds.push(marketId);
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
