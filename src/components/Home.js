import { ethers } from "ethers";
import { useEffect, useState, useCallback } from "react";
import close from "../assets/close.svg";

const Home = ({ home, provider, account, escrow, togglePop }) => {
  const [hasBought, setHasBought] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasSold, setHasSold] = useState(false);

  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);

  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" });

  const [loanAmount, setLoanAmount] = useState("0");

  // Auto-hide status
  useEffect(() => {
    if (status.message) {
      const timer = setTimeout(
        () => setStatus({ message: "", type: "" }),
        4000,
      );
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Fetch all data
  const fetchDetails = useCallback(async () => {
    if (!escrow || !home?.id) return;

    try {
      const buyerAddr = await escrow.buyer(home.id);
      setBuyer(buyerAddr);
      setHasBought(await escrow.approval(home.id, buyerAddr));

      const sellerAddr = await escrow.seller();
      setSeller(sellerAddr);
      setHasSold(await escrow.approval(home.id, sellerAddr));

      const lenderAddr = await escrow.lender();
      setLender(lenderAddr);
      setHasLended(await escrow.approval(home.id, lenderAddr));

      const inspectorAddr = await escrow.inspector();
      setInspector(inspectorAddr);
      setHasInspected(await escrow.inspectionPassed(home.id));

      // Calculate loan amount
      const purchasePrice = await escrow.purchasePrice(home.id);
      const escrowAmount = await escrow.escrowAmount(home.id);
      const remaining = purchasePrice.sub(escrowAmount);
      setLoanAmount(ethers.utils.formatEther(remaining));

      // Owner logic
      const isListed = await escrow.isListed(home.id);
      setOwner(isListed ? null : buyerAddr);
    } catch (err) {
      console.error("Error fetching details:", err);
    }
  }, [escrow, home?.id]);

  const showStatus = (message, type = "success") => {
    setStatus({ message, type });
  };

  // ===================== BUY HANDLER =====================
  const buyHandler = async () => {
    if (!provider || !escrow) return;
    setLoading(true);
    const signer = await provider.getSigner();
    const buyerAddress = await signer.getAddress();

    try {
      const escrowAmount = await escrow.escrowAmount(home.id);

      console.log("=== BUYER DEPOSIT ===");
      console.log("Buyer:", buyerAddress);
      console.log(
        "Balance BEFORE:",
        ethers.utils.formatEther(await provider.getBalance(buyerAddress)),
        "ETH",
      );
      console.log(
        "Escrow Amount:",
        ethers.utils.formatEther(escrowAmount),
        "ETH",
      );

      let tx = await escrow
        .connect(signer)
        .depositEarnest(home.id, { value: escrowAmount });
      console.log("Deposit Tx:", tx.hash);
      await tx.wait();

      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      console.log("Buyer deposit and approval completed");

      showStatus(
        `Successfully deposited ${ethers.utils.formatEther(escrowAmount)} ETH`,
        "success",
      );
      await fetchDetails();
    } catch (error) {
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        showStatus("Transaction cancelled", "error");
      } else {
        console.error(error);
        showStatus("Buy failed. Try again.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================== INSPECT HANDLER =====================
  const inspectHandler = async () => {
    if (!provider || !escrow) return;
    setLoading(true);
    const signer = await provider.getSigner();

    try {
      console.log("=== INSPECTOR ACTION ===");
      console.log("Inspector:", await signer.getAddress());

      const tx = await escrow
        .connect(signer)
        .updateInspectionStatus(home.id, true);
      console.log("Inspection Tx:", tx.hash);
      await tx.wait();

      console.log("Inspection passed successfully");
      showStatus("Inspection approved", "success");
      await fetchDetails();
    } catch (error) {
      handleError(error, "Inspection failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================== LEND HANDLER =====================
  const lendHandler = async () => {
    if (!provider || !escrow) return;
    setLoading(true);
    const signer = await provider.getSigner();

    try {
      console.log("=== LENDER ACTION ===");
      const lenderAddr = await signer.getAddress();
      console.log("Lender:", lenderAddr);

      // Approve
      let tx = await escrow.connect(signer).approveSale(home.id);
      console.log("Lender approve Tx:", tx.hash);
      await tx.wait();

      // Send loan
      const purchasePrice = await escrow.purchasePrice(home.id);
      const escrowAmt = await escrow.escrowAmount(home.id);
      const lendAmt = purchasePrice.sub(escrowAmt);

      console.log(
        "Purchase Price :",
        ethers.utils.formatEther(purchasePrice),
        "ETH",
      );
      console.log(
        "Buyer Deposited :",
        ethers.utils.formatEther(escrowAmt),
        "ETH",
      );
      console.log(
        "Lender Sending  :",
        ethers.utils.formatEther(lendAmt),
        "ETH",
      );

      tx = await signer.sendTransaction({ to: escrow.address, value: lendAmt });
      console.log("Funds transfer Tx:", tx.hash);
      await tx.wait();

      console.log("Lending completed successfully");
      showStatus(
        `Successfully lent ${ethers.utils.formatEther(lendAmt)} ETH`,
        "success",
      );
      await fetchDetails();
    } catch (error) {
      handleError(error, "Lending failed");
    } finally {
      setLoading(false);
    }
  };

  // ===================== SELL HANDLER =====================
  const sellHandler = async () => {
    if (!provider || !escrow) return;
    setLoading(true);
    const signer = await provider.getSigner();

    try {
      console.log("=== SELLER ACTION ===");
      console.log("Seller:", await signer.getAddress());

      let tx = await escrow.connect(signer).approveSale(home.id);
      console.log("Seller approve Tx:", tx.hash);
      await tx.wait();

      tx = await escrow.connect(signer).finalizeSale(home.id);
      console.log("Finalize Sale Tx:", tx.hash);
      await tx.wait();

      console.log("Sale finalized successfully");
      showStatus("Sale finalized successfully!", "success");
      await fetchDetails();
    } catch (error) {
      handleError(error, "Sale finalization failed");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error, defaultMsg) => {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      showStatus("Transaction cancelled by user", "error");
    } else {
      console.error(error);
      showStatus(defaultMsg, "error");
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails, account]);

  const normalizedAccount = account?.toLowerCase();
  const isBuyer =
    normalizedAccount && buyer?.toLowerCase() === normalizedAccount;
  const isInspector =
    normalizedAccount && inspector?.toLowerCase() === normalizedAccount;
  const isLender =
    normalizedAccount && lender?.toLowerCase() === normalizedAccount;
  const isSeller =
    normalizedAccount && seller?.toLowerCase() === normalizedAccount;

  const renderBuyerProgress = () => (
    <div className="buyer-progress">
      <div className={`progress-item ${hasInspected ? "done" : "pending"}`}>
        <span className="status-icon"></span>
        <span>
          {hasInspected
            ? "Inspection approved"
            : "Waiting for inspection approval"}
        </span>
      </div>

      <div className={`progress-item ${hasLended ? "done" : "pending"}`}>
        <span className="status-icon"></span>
        <span>
          {hasLended
            ? `Loan funded (${loanAmount} ETH)`
            : `Waiting for loan (${loanAmount} ETH)`}
        </span>
      </div>

      <div className={`progress-item ${hasSold ? "done" : "pending"}`}>
        <span className="status-icon"></span>
        <span>
          {hasSold
            ? "Seller approved & sale finalized"
            : "Waiting for seller approval"}
        </span>
      </div>
    </div>
  );

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="Home" />
        </div>

        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>

          {owner ? (
            <div className="home__owned">
              Owned by {owner.slice(0, 6)}...{owner.slice(-4)}
            </div>
          ) : (
            <div>
              {isBuyer ? (
                hasBought ? (
                  renderBuyerProgress()
                ) : (
                  <button
                    className="home__buy"
                    onClick={buyHandler}
                    disabled={loading}
                  >
                    {loading ? "Processing Deposit..." : "Buy Now"}
                  </button>
                )
              ) : isInspector ? (
                <button
                  className="home__buy"
                  onClick={inspectHandler}
                  disabled={hasInspected || loading}
                >
                  {hasInspected
                    ? "Inspection Approved ✓"
                    : "Approve Inspection"}
                </button>
              ) : isLender ? (
                <div>
                  <button
                    className="home__buy"
                    onClick={lendHandler}
                    disabled={hasLended || loading}
                  >
                    {hasLended
                      ? "Loan Provided ✓"
                      : `Approve & Lend ${loanAmount} ETH`}
                  </button>
                  <div className="home__notes">
                    <p>Loan required: {loanAmount} ETH</p>
                  </div>
                </div>
              ) : isSeller ? (
                <div>
                  <button
                    className="home__buy"
                    onClick={sellHandler}
                    disabled={hasSold || loading}
                  >
                    {hasSold ? "Sale Finalized ✓" : "Approve & Sell"}
                  </button>
                  <div className="home__notes">
                    <p>Sale price: {home.attributes[0].value} ETH</p>
                  </div>
                </div>
              ) : (
                <button
                  className="home__buy"
                  onClick={buyHandler}
                  disabled={loading || !buyer}
                >
                  {loading ? "Processing Deposit..." : "Buy Now"}
                </button>
              )}

              <button className="home__contact">Contact agent</button>
            </div>
          )}

          <hr />
          <h2>Overview</h2>
          <p>{home.description}</p>

          <hr />
          <h2>Facts and features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
