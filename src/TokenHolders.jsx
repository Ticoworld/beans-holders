import React, { useState } from 'react';

const TokenHolders = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenHolders, setTokenHolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const textToCopy = "SP1MASMF30DRR4KDR5TG4RZEEVHBKS1ZX4TJZ8P06.mrbeans-stxcity::Beans";

  // State for counts
  const [totalHolders, setTotalHolders] = useState(0);
  const [above10Trillion, setAbove10Trillion] = useState(0);
  const [above1Trillion, setAbove1Trillion] = useState(0);
  const [below1Trillion, setBelow1Trillion] = useState(0);

  // Handle input field changes
  const handleInputChange = (e) => {
    setTokenAddress(e.target.value);
  };

  // Convert token holders data to CSV
  const convertToCSV = (data) => {
    const headers = ['Address', 'Balance'];
    const rows = data.map((holder) => [holder.address, holder.balance]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');

    return csvContent;
  };

  // Download CSV file
  const downloadCSV = (csvData) => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'token_holders.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  // Fetch token holders from API
  const fetchTokenHolders = async () => {
    if (!tokenAddress) {
      setError('Please enter a token address.');
      return;
    }

    setLoading(true);
    setError('');
    let allHolders = [];
    let offset = 0;
    const limit = 200;
    const seenAddresses = new Set(); // To track unique addresses

    try {
      while (true) {
        const response = await fetch(
          `https://api.hiro.so/extended/v1/tokens/ft/${tokenAddress}/holders?limit=${limit}&offset=${offset}`
        );
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          // Filter out duplicate addresses
          const uniqueResults = data.results.filter((holder) => {
            if (seenAddresses.has(holder.address)) {
              return false; // Skip duplicates
            } else {
              seenAddresses.add(holder.address);
              return true; // Add unique addresses
            }
          });

          allHolders = [...allHolders, ...uniqueResults];
          offset += limit; // Move to the next batch
        } else {
          break; // Stop fetching when no more results are available
        }
      }

      // Count holders in different categories
      let countAbove10Trillion = 0;
      let countAbove1Trillion = 0;
      let countBelow1Trillion = 0;

      allHolders.forEach((holder) => {
        const balance = parseFloat(holder.balance);
        if (balance >= 10 * 1e12) {
          countAbove10Trillion += 1;
        } else if (balance >= 1 * 1e12) {
          countAbove1Trillion += 1;
        } else {
          countBelow1Trillion += 1;
        }
      });

      // Update state with counts
      setTotalHolders(allHolders.length);
      setAbove10Trillion(countAbove10Trillion);
      setAbove1Trillion(countAbove1Trillion);
      setBelow1Trillion(countBelow1Trillion);

      if (allHolders.length > 0) {
        setTokenHolders(allHolders);
        const csvData = convertToCSV(allHolders);
        downloadCSV(csvData);
      } else {
        setError('No token holders found.');
        setTokenHolders([]);
      }
    } catch (err) {
      setError('Error fetching token holders.');
    } finally {
      setLoading(false);
    }
  };

  // Handle copy functionality
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000); // Clear the success message after 2 seconds
    } catch (err) {
      setCopySuccess('Failed to copy!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        Beanns Holders
      </h1>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <input
          type="text"
          value={tokenAddress}
          onChange={handleInputChange}
          placeholder="Enter token address"
          className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
        />
        <button
          onClick={fetchTokenHolders}
          className="w-full px-6 py-3 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
        >
          Get Token Holders
        </button>
        <button
          onClick={handleCopy}
          className="w-full px-6 py-3 text-sm sm:text-base bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring focus:ring-green-300"
        >
          Copy Me Up
        </button>
        {copySuccess && <span className="text-green-600">{copySuccess}</span>}
      </div>

      {loading && <p className="text-gray-700 mt-4">Loading...</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {tokenHolders.length > 0 && (
        <div className="mt-6 w-full max-w-2xl bg-white rounded-md shadow-lg overflow-hidden">
          <div className="text-center mb-4">
            <p>Total Holders: {totalHolders}</p>
            <p>Holders with 10 Trillion and Above: {above10Trillion}</p>
            <p>Holders with 1 Trillion and Above: {above1Trillion}</p>
            <p>Holders with Below 1 Trillion: {below1Trillion}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-sm sm:text-base">
                    Address
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-sm sm:text-base">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokenHolders.map((holder, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 text-sm sm:text-base">
                      {holder.address}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-sm sm:text-base">
                      {holder.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenHolders;
