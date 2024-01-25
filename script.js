window.onload = function() {
    var path = window.location.pathname;
    var tkID = path.substring(1); // Remove the leading '/' from the path

    if (tkID) {
        document.getElementById('token-id').value = tkID;
    }
};


function fetchTokenInfo() {
    const tokenId = document.getElementById('token-id').value;
    if (!tokenId) {
        alert('Please enter a Hedera token ID.');
        return;
    }

    const url = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const maxSupply = parseInt(data.max_supply, 10);
            const isMaxSupplyInfinite = maxSupply === 0;
            const totalSupply = parseInt(data.total_supply, 10);

            const tokenData = {
                releasedSupply: isMaxSupplyInfinite ? 100 : calculatePercentage(totalSupply, maxSupply),
                totalSupply: isMaxSupplyInfinite ? 100 : calculatePercentage(totalSupply, maxSupply),
                maxSupply: isMaxSupplyInfinite ? -1 : 100
            };

            updateSupplyBars(tokenData, isMaxSupplyInfinite);
            fetchCreatorsTokenBalance(tokenId, data.auto_renew_account, totalSupply);
            fetchTokenHoldersCount(data.token_id);
            console.log(data.token_id, data.auto_renew_account)
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function calculatePercentage(partialValue, totalValue) {
    if (totalValue === 0) {
        return -1; // Flag for infinite supply
    }
    return (partialValue / totalValue) * 100;
}

function updateSupplyBars(data, isMaxSupplyInfinite) {
    const supplyFill = document.getElementById('supply-fill');

    if (isMaxSupplyInfinite) {
        supplyFill.style.width = '100%';
        supplyFill.style.backgroundColor = 'orange';
    } else {
        supplyFill.style.width = data.totalSupply + '%';
        supplyFill.style.backgroundColor = 'blue'; // Or any other color for normal supply
    }
}


// Existing fetchTokenInfo function...

function fetchCreatorsTokenBalance(tokenId, creatorAccountId, totalSupply) {
    const balanceUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}/balances?account.id=${creatorAccountId}`;

    fetch(balanceUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            const creatorBalance = parseInt(data.balances[0].balance, 10);

            const creatorTokenData = {
                creatorSupply: calculatePercentage(creatorBalance, totalSupply)
               
            };
            console.log(calculatePercentage(creatorBalance, totalSupply))
            updateCreatorSupplyBar(creatorTokenData);
        })
        .catch(error => {
            console.error('Error fetching creator balance:', error);
        });
}

function updateCreatorSupplyBar(data) {
    const creatorSupplyFill = document.getElementById('creator-supply-fill');
    creatorSupplyFill.style.width = data.creatorSupply + '%';
}


function fetchTokenHoldersCount(tokenId, url = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}/balances?limit=10000`, count = 0) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log(data)
            // Count only holders with a balance greater than zero
            const validHolders = data.balances.filter(holder => parseInt(holder.balance, 10) > 0).length;
            count += validHolders;

            // Check if there's a link to the next page
            if (data.links && data.links.next) {
                const nextUrl = `https://mainnet-public.mirrornode.hedera.com${data.links.next}`;
                fetchTokenHoldersCount(tokenId, nextUrl, count);
            } else {
                updateHolderCountUI(count);
            }
        })
        .catch(error => {
            console.error('Error fetching token holders:', error);
        });
}


function updateHolderCountUI(count) {
    const holderCountElement = document.getElementById('holder-count');
    if (holderCountElement) {
        holderCountElement.textContent = count;
    }
}