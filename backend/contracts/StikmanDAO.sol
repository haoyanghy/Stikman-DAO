// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFakeNFTMarketplace {
    // Return price of one NFT in wei
    function getPrice() external view returns (uint256);
    // Return whether the selected NFT has been purchased or not (true or false)
    function available(uint256 _tokenId) external view returns (bool);
    // Purchse NFT from FakeNFTMarketplace
    function purchase(uint256 _tokenId) external payable;
}

interface IStikmanNFT {
    // Returns the number of NFTs owned by the given address
    function balanceOf(address owner) external view returns (uint256);

    // Returns a tokenID at given index for owner
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256);
}

contract Stikman is Ownable {
    struct Proposal {
    // The tokenID of the NFT to purchase from FakeNFTMarketplace if the proposal passes
    uint256 nftTokenId;
    // The UNIX timestamp until which this proposal is active. Proposal can be executed after the deadline has been exceeded.
    uint256 deadline;
    // Number of yay votes for this proposal
    uint256 yayVotes;
    // Number of nay votes for this proposal
    uint256 nayVotes;
    // Whether or not this proposal has been executed yet. Cannot be executed before the deadline has been exceeded.
    bool executed;
    // A mapping of StikmanNFT tokenIDs to booleans indicating whether that NFT has already been used to cast a vote or not
    mapping(uint256 => bool) voters;
    }

    // Mapping of ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    // Number of proposals that have been created
    uint256 public numProposals;

    IFakeNFTMarketplace nftMarketplace;
    IStikmanNFT stikmanNFT;

    // Possible options for a vote
    enum Vote {
        YAY, // YAY = 0
        NAY // NAY = 1
    }

    // Initialize contract instances
    // Payable allows this constructor to accept an ETH deposit when it is being deployed
    constructor(address _nftMarketplace, address _stikmanNFT) payable {
        nftMarketplace = IFakeNFTMarketplace(_nftMarketplace);
        stikmanNFT = IStikmanNFT(_stikmanNFT);
    }

    // _nftTokenId - the tokenID of the NFT to be purchased from FakeNFTMarketplace if this proposal passes
    // Returns the proposal index for the created proposal
    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns (uint256) {
        require(nftMarketplace.available(_nftTokenId), "Selected NFT is not available");
        Proposal storage proposal = proposals[numProposals];
        proposal.nftTokenId = _nftTokenId;
        // Set proposal's voting deadline to be (current time + 5 minutes)
        proposal.deadline = block.timestamp + 5 minutes;
        numProposals++;
        return numProposals - 1;
    }

    function voteOnProposal(uint256 proposalIndex, Vote vote) external 
        nftHolderOnly activeProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];

        uint256 voterNFTBalance = stikmanNFT.balanceOf(msg.sender);
        uint256 numVotes = 0;

        // Calculate how many NFTs are owned by the voter that haven't already been used for voting on this proposal
        for (uint256 i = 0; i < voterNFTBalance; i++) {
            uint256 tokenId = stikmanNFT.tokenOfOwnerByIndex(msg.sender, i);
            if (proposal.voters[tokenId] == false) {
                numVotes++;
                proposal.voters[tokenId] = true;
            }
        }
        require(numVotes > 0, "You have no more votes");

        if (vote == Vote.YAY) {
            proposal.yayVotes += numVotes;
        } else {
            proposal.nayVotes += numVotes;
        }
    }

    function executeProposal(uint256 proposalIndex) external
        nftHolderOnly inactiveProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];
        // Execute to purchase NFT from FakeNFTMarketplace if yay votes > nay votes
        if (proposal.yayVotes > proposal.nayVotes) {
            uint256 nftPrice = nftMarketplace.getPrice();
            require(address(this).balance >= nftPrice, "Contract doesn't have enough funds");
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }
        proposal.executed = true;
    }

    // Allows the contract owner (deployer) to withdraw all the ETH from the contract
    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    modifier nftHolderOnly() {
        require(stikmanNFT.balanceOf(msg.sender) > 0, "You don't own any Stikman NFT");
        _;
    }

    // Called if the given proposal's deadline has not been exceeded yet
    modifier activeProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline > block.timestamp,
            "The deadline of this proposal is exceeded"
        );
        _;
    }

    // Called if the given proposals' deadline has been exceeded and if the proposal has not yet been executed
    modifier inactiveProposalOnly(uint256 proposalIndex) {
        require(
            proposals[proposalIndex].deadline <= block.timestamp,
            "The deadline of this is not exceeded yet"
        );
        require(
            proposals[proposalIndex].executed == false,
            "This selected proposal has been executed already"
        );
        _;
    }

    // Allows contract to accept ETH deposits directly from a wallet without calling a function
    receive() external payable {}
    fallback() external payable {}
}