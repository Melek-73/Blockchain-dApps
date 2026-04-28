import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Navigation from "./components/Navigation";
import Search from "./components/Search";
import Home from "./components/Home";

// ABIs
import RealEstate from "./abis/RealEstate.json";
import Escrow from "./abis/Escrow.json";

// Config
import config from "./config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);

  const [account, setAccount] = useState(null);

  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    //window.ethereum = injected by MetaMask in your browser
    //Web3Provider (from Ethers.js) wraps MetaMask so you can use it to send transactions, interact with the blockchain, and so on.
    const network = await provider.getNetwork();
    console.log(network);

    //This creates a JS object that represents the realEstate smart contract and allows us to interact with it :
    const realEstate = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate,
      provider,
    );
    //address → where the contract is deployed
    //RealEstate → ABI (contract interface)
    //provider → how you want to interact with the contract (read-only or read/write)

    const totalSupply = await realEstate.totalSupply();
    const homes = [];
    console.log("Loading blockchain...");
    console.log(totalSupply.toString());

    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i); // asks blockchain: Where is the metadata? Get metadata URL
      const response = await fetch(uri); // Fetch the metadata from the URL (this is usually stored on IPFS or a centralized server) asks the internet:“Give me the JSON file”
      const metadata = await response.json(); // Convert the response  to JSON
      homes.push(metadata);
    }

    setHomes(homes);

    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow,
      provider,
    );
    setEscrow(escrow);

    //Listen for account changes in MetaMask and update the account state accordingly. This ensures that the application stays in sync with the user's current account and can react to changes, such as when the user switches accounts or disconnects from MetaMask.
    window.ethereum.on("accountsChanged", async () => {
      //Ask MetaMask to give the connected accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const togglePop = (home) => {
    setHome(home);
    toggle ? setToggle(false) : setToggle(true);
  };

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className="cards__section">
        <h3>Homes For You</h3>

        <hr />

        <div className="cards">
          {homes.map((home, index) => (
            <div className="card" key={index} onClick={() => togglePop(home)}>
              <div className="card__image">
                <img src={home.image} alt="Home" />
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          togglePop={togglePop}
        />
      )}
    </div>
  );
}

export default App;
