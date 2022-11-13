import { React, useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import contractAbi from './utils/contractABI.json';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { getNetworkName } from './utils/networks';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TLD = '.love';
const CONTRACT_ADDRESS = '0x6f270336Ab0A49390a9C3fB40DF003ecFA2a55f0';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	const [loading, setLoading] = useState(false);	
	const [website, setWebsite] = useState('');
	const [email, setEmail] = useState('');
	const [network, setNetwork] = useState('');
	const [mints, setMints] = useState([]);

  	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		// Check if we're authorized to access the user's wallet
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		// Users can have multiple authorized accounts, we grab the first one if its there!
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		const nw = getNetworkName(chainId);
		console.log(`Current network: ${nw}`);
		setNetwork(nw);
	
		ethereum.on('chainChanged', handleChainChanged);
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}		
  	};

	// Create a function to render if wallet is not connected yet
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif" alt="Momoa love gif" />
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>
				Connect Wallet
			</button>
		</div>
	);

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get MetaMask -> https://metamask.io/");
				return;
			}

			// Request access to account.
			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			// This should print out public address once we authorize Metamask.
			console.log("Connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}	

	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{
						chainId: '0x13881'
					}],
				});
			} catch (error) {
				// This error code means that the chain we want has not been added to MetaMask
				// In this case we ask the user to add it to their MetaMask
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [{
								chainId: '0x13881',
								chainName: 'Polygon Mumbai Testnet',
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
									name: "Mumbai Matic",
									symbol: "MATIC",
									decimals: 18
								},
								blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
							}, ],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If window.ethereum is not found then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		}
	}

	// Form to enter domain name and data
	const renderInputForm = () =>{
		if (network !== 'Polygon Mumbai Testnet') {
			return (
			  <div className="connect-wallet-container">
				<p>Please switch to the Polygon Mumbai Testnet</p>
				<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			  </div>
			);
		}

		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {TLD} </p>
				</div>
				
				<div className="row">
					<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
						Mint
					</button>  
				</div>

				<input
					type="text"
					value={website}
					placeholder='website'
					onChange={e => setWebsite(e.target.value)}
				/>

				<input
					type="text"
					value={email}
					placeholder='email'
					onChange={e => setEmail(e.target.value)}
				/>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={loading} onClick={setDomainRecord}>
						Set record
					</button>  
				</div>

			</div>
		);
	}	

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) { return; }
		
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}

		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.05' : domain.length === 4 ? '0.03' : '0.01';
		console.log("Minting domain", domain, "with price", price);
		setLoading(true);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				const domainAlreadyExists = await contract.domainIsRegistered(domain);
				if (domainAlreadyExists) {
					const mintMessage = `Domain ${domain} is already registered!!!`;
					console.log(mintMessage);
					alert(mintMessage);
				} else {
					console.log("Going to pop wallet now to pay gas...")
					let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
					
					// Wait for the transaction to be mined
					const receipt = await tx.wait();

					// Check if the transaction was successfully completed
					if (receipt.status === 1) {
						console.log("Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash);
						fetchMints();
					}
					else {
						alert("Transaction failed! Please try again");
					}
				}
			}
		}
		catch(error) {
			console.log(error);
		}
		setLoading(false);
	}	

	const setDomainRecord = async () => {
		// Don't run if the domain is empty
		if (!domain) { return; }
		
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}

		setLoading(true);
		console.log(`Updating domain ${domain} with website: ${website} / email: ${email}`);		

		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				const domainAlreadyExists = await contract.domainIsRegistered(domain);
				if (domainAlreadyExists) {
					let tx = await contract.setRecord(domain, website, email);

					// Wait for the transaction to be mined
					const receipt = await tx.wait();
	
					// Check if the transaction was successfully completed
					if (receipt.status === 1) {
						console.log("Record set! https://mumbai.polygonscan.com/tx/" + tx.hash);
						fetchMints();
					} else {
						alert("Transaction failed! Please try again");
					}	
				} else {
					console.log(`Unknown domain: ${domain}`);
					alert(`Unknown domain: ${domain}`);
				}
			}
		}
		catch(error) {
			console.log(error);
		}
		setLoading(false);
	}	

	const fetchMints = async () => {
		try {
			const {
				ethereum
			} = window;
			if (ethereum) {
				// You know all this
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				const records = await contract.getAllRecords();
				
				const mintRecords = await Promise.all(records.map(async (record) => {
					console.log(record);
					return {
						tokenId: record.tokenId.toNumber(),
						name: record.name,
						owner: record.addr,
						website: record.website,
						email: record.email,
					};
				}));
				
				setMints(mintRecords);
			}
		} catch (error) {
			console.log(error);
		}
	}

	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
		  return (
			<div className="mint-container">
			  <p className="subtitle"> Recently minted domains!</p>
			  <div className="mint-list">
				{ mints.map((mint, index) => {
				  return (
					<div className="mint-item" key={index}>
					  <div className='mint-row'>
						<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.tokenId}`} target="_blank" rel="noopener noreferrer">
						  <p className="bold domain-label">{' '}{mint.name}{TLD}{' '}</p>
						  <p className="record-label">Website:</p>
						  <p className="">{' '}{mint.website === '' ? '<none>' : mint.website }{' '}</p>
						  <p className="record-label">Email:</p>
						  <p className="">{' '}{mint.email === '' ? '<none>' : mint.email }{' '}</p>
						</a>
						{/* If mint.owner is currentAccount, add an "edit" button*/}
						{/* { mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
						  <button className="edit-button" onClick={() => editRecord(mint.name)}>
							<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
						  </button>
						  :
						  null
						} */}
					  </div>
				<p> {mint.record} </p>
			  </div>)
			  })}
			</div>
		  </div>);
		}
	  };

	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}
	}, [currentAccount, network]);

	return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
						<div className="left">
							<p className="title">💜 Love Name Service</p>
							<p className="subtitle">Your lovable API on the blockchain!</p>
						</div>
						<div className="right">
      						<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
      						{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
    					</div>						
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}

        		<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
