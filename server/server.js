const express = require('express');
const bodyParser = require('body-parser');  // used to parse data in HTTP requests
const {Web3} = require('web3');
const { BlobServiceClient, BlockBlobClient } = require('@azure/storage-blob');
const cors = require('cors');
const app = express();

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
const contractAddress = '0x3ded9addbf7c46db95bd9faa339d0595c17557ad'; //contract deply address
const contract = new web3.eth.Contract(contractABI,contractAddress);
const systemAddress = '0xe3F292F78B90127Ec3c90850c30388B13EfCFEbb'; //wallet address


//Microsoft Azure Integration
const blobServiceClient = BlobServiceClient.fromConnectionString('DefaultEndpointsProtocol=https;AccountName=blockchain01;AccountKey=i+BcRRJvxth/wk2h9SDKczuo5xja+h/eH+ALaJk+6eMSmEPKJX/hs+GA/D6VsiqYhJGrqbFQQ8Mr+AStujInHg==;EndpointSuffix=core.windows.net'); //Azure storage connection string
const containerClient = blobServiceClient.getContainerClient('blockchain01'); //Container name

//Admin criteria
let adminCriteria = {};

app.post('/admin-interface',(req, res) => {
    adminCriteria = req.body;
    res.json({ message: 'Criteria saved succesfully'});
});

//User submits water qualit data
app.post('/user-interface',async (req, res) => {
    const userData = req.body;

    //Validation
    const result = validateData(userData);

    //Save Json file to the blob storage
    const fileName = 'result-${Date.now()}.json'; //The file name is stored as the Date 
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(JSON.stringify(userData), Buffer.byteLength(JSON.stringify(userData)));
    
    //get the file URL
    const fileUrl = blockBlobClient.url;

    //prepare trasaction data for metamask
    const tx = contract.methods.storeFileMetadata(userData.ph, userData.temp, userData.turbidity, fileUrl);
    const txData = tx.encodeABI();

    res.json({
        validation: result,
        contractAddress: contractAddress,
        txData: txData,
        fileUrl: fileUrl
    });

    //Add metadata to the blockchain
    await contract.methods.storeFileMetadata(userData.ph, userData.temp, userData.turbidity, fileUrl).send({ from: systemAddress});
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});