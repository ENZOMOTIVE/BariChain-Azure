const express = require('express');
const bodyParser = require('body-parser');  // used to parse data in HTTP requests
const {Web3} = require('web3');
const { BlobServiceClient, BlockBlobClient } = require('@azure/storage-blob');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
require('dotenv').config();  


app.use(morgan('dev')); // Log requests to the console
app.use(bodyParser.json());
app.use(cors());

//integration with the blockchain
const web3 = new Web3(new Web3.providers.HttpProvider('https://rpc.ankr.com/bsc_testnet_chapel'));
const contractABI= [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "MetadataStored",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "index",
				"type": "uint256"
			}
		],
		"name": "getUserMetadata",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserMetadataCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "pH",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "temperature",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "turbidity",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "fileUrl",
				"type": "string"
			}
		],
		"name": "storeFileMetadata",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userMetadata",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "pH",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "temperature",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "turbidity",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "fileUrl",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
const contractAddress = '0x93365aa2fe482860073619e00a1da6ed4a2b0b17'; //contract deply address
const contract = new web3.eth.Contract(contractABI,contractAddress);
const systemAddress = '0xe3F292F78B90127Ec3c90850c30388B13EfCFEbb'; //wallet address


//Microsoft Azure Integration
const blobServiceClient = BlobServiceClient.fromConnectionString('DefaultEndpointsProtocol=https;AccountName=blockchain01;AccountKey=i+BcRRJvxth/wk2h9SDKczuo5xja+h/eH+ALaJk+6eMSmEPKJX/hs+GA/D6VsiqYhJGrqbFQQ8Mr+AStujInHg==;EndpointSuffix=core.windows.net'); //Azure storage connection string
const containerClient = blobServiceClient.getContainerClient('blockchain-container'); //Container name

//Admin criteria
let adminCriteria = {};


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.post('/admin-interface',(req, res) => {
    adminCriteria = req.body;
    res.json({ message: 'Criteria saved succesfully'});
});

//User submits water quality data
app.post('/user-interface', async (req, res) => {
    const userData = req.body;
    const { ph, temp, turbidity, walletAddress } = userData;

    // Validation
    const result = validateData(userData);

    // Save JSON file to the blob storage
    const fileName = `result-${Date.now()}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(JSON.stringify({ ...userData, result }), Buffer.byteLength(JSON.stringify({ ...userData, result })));

    // Get the file URL
    const fileUrl = blockBlobClient.url;

    // Prepare transaction data for MetaMask
    const tx = contract.methods.storeFileMetadata(ph, temp, turbidity, fileUrl);
    const txData = tx.encodeABI();

    // Send transaction using the user's wallet address
    const nonce = await web3.eth.getTransactionCount(systemAddress);
    const txObject = {
        nonce: web3.utils.toHex(nonce),
        to: contractAddress,
        gasLimit: web3.utils.toHex(300000),  // You can adjust this value
        gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
        data: txData
    };

    try {
        const signedTx = await web3.eth.accounts.signTransaction(txObject, process.env.PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        res.json({
            validation: result,
            contractAddress: contractAddress,
            transactionHash: receipt.transactionHash,
            fileUrl: fileUrl
        });
    } catch (error) {
        res.status(500).json({ error: 'Transaction failed', details: error.message });
    }
});

function validateData(userData) {
    //we can implement the logic
    if (userData.ph > adminCriteria.ph && userData.temp > adminCriteria.temp && userData.turbidity === adminCriteria.turbidity) {
        return 'Good';
    } else {
        return 'Bad';
    }
}


// Start the server
const PORT = process.env.PORT || 3000 ;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});