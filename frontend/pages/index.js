import { Contract, providers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  STIKMAN_DAO_ABI,
  STIKMAN_DAO_CONTRACT_ADDRESS,
  STIKMAN_NFT_ABI,
  STIKMAN_NFT_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";
import { motion } from "framer-motion";
import ThreeDotsWave from "../components/ThreeDotsWave";

export default function Home() {
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [nftBalance, setNftBalance] = useState(0);
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [selectedTab, setSelectedTab] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const web3ModalRef = useRef();

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  //
  const getUserNFTBalance = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = getStikmanNFTContractInstance(signer);
      const balance = await nftContract.balanceOf(signer.getAddress());
      setNftBalance(parseInt(balance.toString()));
    } catch (error) {
      console.error(error);
    }
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      // No contract instance needed because not calling any function from any of the contracts
      const balance = await provider.getBalance(STIKMAN_DAO_CONTRACT_ADDRESS);
      setTreasuryBalance(balance.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const getNumProposalsInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const contract = getDaoContractInstance(provider);
      const daoNumProposals = await contract.numProposals();
      setNumProposals(daoNumProposals.toString());
    } catch (error) {
      console.error(error);
    }
  };

  const createProposal = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await getNumProposalsInDAO();
      setLoading(false);
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  // Fetch and parse one proposal from the DAO contract based on the Proposal ID,
  // and converts the returned data into a Javascript object with values that we can use
  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoContract = getDaoContractInstance(provider);
      const proposal = await daoContract.proposals(id);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      return parsedProposal;
    } catch (error) {
      console.error(error);
    }
  };

  // Runs a loop `numProposals` times to fetch all proposals in the DAO and sets the `proposals` state variable
  const fetchAllProposals = async () => {
    try {
      const proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  };

  const voteOnProposal = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoContract.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  const executeProposal = async (proposalId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoContract = getDaoContractInstance(signer);
      const txn = await daoContract.executeProposal(proposalId);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to Rinkeby network!");
      throw new Error("Please switch to Rinkeby network");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // Returns DAO Contract instance
  const getDaoContractInstance = (providerOrSigner) => {
    return new Contract(
      STIKMAN_DAO_CONTRACT_ADDRESS,
      STIKMAN_DAO_ABI,
      providerOrSigner
    );
  };

  // Returns Stikman NFT Contract instance
  const getStikmanNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      STIKMAN_NFT_CONTRACT_ADDRESS,
      STIKMAN_NFT_ABI,
      providerOrSigner
    );
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet().then(() => {
        getUserNFTBalance();
        getDAOTreasuryBalance();
        getNumProposalsInDAO();
      });
    }
  }, [walletConnected]);

  // Used to re-fetch all proposals in the DAO when user switches to 'View Proposals' tab
  useEffect(() => {
    if (selectedTab === "View Proposals") {
      fetchAllProposals();
    }
  }, [selectedTab]);

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  function renderCreateProposalTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
          <div>
            <div className={styles.gridContainer}>
              <div>
                <ThreeDotsWave />
              </div>
              <div>
                <ThreeDotsWave />
              </div>
              <div>
                <ThreeDotsWave />
              </div>
            </div>
          </div>
        </div>
      );
    } else if (nftBalance === 0) {
      return (
        <div className={styles.description}>
          You do not own any Stikman NFTs. <br />
          <b>You cannot create or vote on any proposal.</b>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <label>Fake NFT Token ID to Purchase: </label>
          <input
            className={styles.containerInput}
            placeholder="0"
            type="number"
            onChange={(e) => setFakeNftTokenId(e.target.value)}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            className={styles.button3}
            onClick={createProposal}
          >
            Create
          </motion.button>
        </div>
      );
    }
  }

  function renderViewProposalsTab() {
    if (loading) {
      return (
        <div className={styles.description}>
          Loading... Waiting for transaction...
          <div className={styles.gridContainer}>
            <div>
              <ThreeDotsWave />
            </div>
            <div>
              <ThreeDotsWave />
            </div>
            <div>
              <ThreeDotsWave />
            </div>
          </div>
        </div>
      );
    } else if (proposals.length === 0) {
      return (
        <div className={styles.description}>
          No proposals have been created.
        </div>
      );
    } else {
      return (
        <div>
          {proposals.map((p, index) => (
            <div key={index} className={styles.proposalCard}>
              <p>Proposal ID: {p.proposalId}</p>
              <p>
                {"Fake NFT to Purchase (Index): "}
                {p.nftTokenId}
              </p>
              <p>Deadline: {p.deadline.toLocaleString()}</p>
              <p>Yay Votes: {p.yayVotes}</p>
              <p>Nay Votes: {p.nayVotes}</p>
              <p>Executed?: {p.executed.toString()}</p>
              {/* If deadline not exceeded and proposal not executed, display vote buttons */}
              {/* If deadline exceeded and proposal not executed, display execution button */}
              {/* If deadline exceeded and proposal executed, display "Proposal executed" */}
              {p.deadline.getTime() > Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "YAY")}
                  >
                    Vote YAY
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className={styles.button2}
                    onClick={() => voteOnProposal(p.proposalId, "NAY")}
                  >
                    Vote NAY
                  </motion.button>
                </div>
              ) : p.deadline.getTime() < Date.now() && !p.executed ? (
                <div className={styles.flex}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className={styles.button2}
                    onClick={() => executeProposal(p.proposalId)}
                  >
                    {"Execute Proposal "}
                    {p.yayVotes > p.nayVotes ? "(YAY)" : "(NAY)"}
                  </motion.button>
                </div>
              ) : (
                <div className={styles.description}>
                  <b>Proposal Executed</b>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>Stikman DAO</title>
        <meta name="description" content="Stikman DAO" />
        <link rel="icon" href="/1.png" />
      </Head>

      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Stikman!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your Stikman NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <motion.button
              className={styles.button}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </motion.button>
            <motion.button
              className={styles.button}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </motion.button>
          </div>
          {renderTabs()}
        </div>

        <div>
          <img className={styles.image} src="/1.png" />
        </div>
      </div>
    </div>
  );
}
