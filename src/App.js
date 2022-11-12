import { React, useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import contractAbi from './utils/contractABI.json';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = '.love';
const CONTRACT_ADDRESS = '0x8164e3aA43C6b1222A4e6BF84CCD317692861DA5';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	//const [loading, setLoading] = useState(false);	
	const [website, setWebsite] = useState('');
	const [email, setEmail] = useState('');
	const [twitter, setTwitter] = useState('');
	const [github, setGithub] = useState('');

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
	// Form to enter domain name and data
	const renderInputForm = () =>{
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>
				
				<div className="row">
					<button className='cta-button mint-button' disabled={null} onClick={mintDomain}>
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

				<input
					type="text"
					value={twitter}
					placeholder='twitter handle'
					onChange={e => setTwitter(e.target.value)}
				/>

				<input
					type="text"
					value={github}
					placeholder='github handle'
					onChange={e => setGithub(e.target.value)}
				/>

				<div className="button-container">
					<button className='cta-button mint-button' disabled={null} onClick={setDomainRecord}>
						Set data
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
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				console.log("Going to pop wallet now to pay gas...")
				let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
				
				// Wait for the transaction to be mined
				const receipt = await tx.wait();

				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash);
				}
				else {
					alert("Transaction failed! Please try again");
				}
			}
		}
		catch(error) {
			console.log(error);
		}
	}	

	const setDomainRecord = async () => {
		// Don't run if the domain is empty
		if (!domain) { return; }
		
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}

		console.log("Set domain record");
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);

				let tx = await contract.setRecord(domain, website, email, twitter, github);

				// Wait for the transaction to be mined
				const receipt = await tx.wait();

				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Record set! https://mumbai.polygonscan.com/tx/" + tx.hash);
				} else {
					alert("Transaction failed! Please try again");
				}
			}
		}
		catch(error) {
			console.log(error);
		}
	}	

	useEffect(() => {
		checkIfWalletIsConnected();
	}, [])

	return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
						<div className="left">
						<p className="title">💜 Love Name Service</p>
						<p className="subtitle">Your lovable API on the blockchain!</p>
						</div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}

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
