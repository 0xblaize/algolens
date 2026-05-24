// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MarketAuditRegistry {
    enum AuditTargetStatus {
        OPEN,
        PAUSED,
        RESOLVED,
        CANCELLED
    }

    struct AuditTarget {
        uint256 auditTargetId;
        string title;
        string category;
        string sourceUrl;
        bytes32 sourceHash;
        uint256 deadline;
        uint256 createdAt;
        AuditTargetStatus status;
        address creator;
        bytes32 metadataHash;
    }

    uint256 private nextAuditTargetId = 1;
    uint256[] private auditTargetIds;
    mapping(uint256 => AuditTarget) private auditTargets;

    event AuditTargetCreated(
        uint256 indexed auditTargetId,
        string title,
        string category,
        string sourceUrl,
        bytes32 indexed sourceHash,
        uint256 deadline,
        bytes32 indexed metadataHash,
        address creator
    );

    event AuditTargetStatusUpdated(uint256 indexed auditTargetId, AuditTargetStatus status);

    function createAuditTarget(
        string calldata title,
        string calldata category,
        string calldata sourceUrl,
        bytes32 sourceHash,
        uint256 deadline,
        bytes32 metadataHash
    ) external returns (uint256 auditTargetId) {
        require(bytes(title).length > 0, "TITLE_REQUIRED");
        require(bytes(sourceUrl).length > 0, "SOURCE_URL_REQUIRED");
        require(sourceHash != bytes32(0), "SOURCE_HASH_REQUIRED");
        require(metadataHash != bytes32(0), "METADATA_HASH_REQUIRED");
        require(deadline > block.timestamp, "DEADLINE_IN_PAST");

        auditTargetId = nextAuditTargetId++;
        auditTargets[auditTargetId] = AuditTarget({
            auditTargetId: auditTargetId,
            title: title,
            category: category,
            sourceUrl: sourceUrl,
            sourceHash: sourceHash,
            deadline: deadline,
            createdAt: block.timestamp,
            status: AuditTargetStatus.OPEN,
            creator: msg.sender,
            metadataHash: metadataHash
        });
        auditTargetIds.push(auditTargetId);

        emit AuditTargetCreated(
            auditTargetId,
            title,
            category,
            sourceUrl,
            sourceHash,
            deadline,
            metadataHash,
            msg.sender
        );
    }

    function updateAuditTargetStatus(uint256 auditTargetId, AuditTargetStatus status) external {
        AuditTarget storage target = auditTargets[auditTargetId];
        require(target.creator != address(0), "AUDIT_TARGET_NOT_FOUND");
        require(msg.sender == target.creator, "ONLY_CREATOR");

        target.status = status;
        emit AuditTargetStatusUpdated(auditTargetId, status);
    }

    function getAuditTarget(uint256 auditTargetId) external view returns (AuditTarget memory) {
        AuditTarget memory target = auditTargets[auditTargetId];
        require(target.creator != address(0), "AUDIT_TARGET_NOT_FOUND");
        return target;
    }

    function getAuditTargets() external view returns (AuditTarget[] memory results) {
        results = new AuditTarget[](auditTargetIds.length);
        for (uint256 i = 0; i < auditTargetIds.length; i++) {
            results[i] = auditTargets[auditTargetIds[i]];
        }
    }
}
