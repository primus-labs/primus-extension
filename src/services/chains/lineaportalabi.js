export const lineaportalabi = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "feeParams",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "recvAddr",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "AccessDenied",
		"type": "error"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "schemaId",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expirationDate",
						"type": "uint64"
					},
					{
						"internalType": "bytes",
						"name": "subject",
						"type": "bytes"
					},
					{
						"internalType": "bytes",
						"name": "attestationData",
						"type": "bytes"
					}
				],
				"internalType": "struct AttestationPayload",
				"name": "attestationPayload",
				"type": "tuple"
			},
			{
				"internalType": "bytes[]",
				"name": "validationPayload",
				"type": "bytes[]"
			}
		],
		"name": "attest",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "schema",
						"type": "bytes32"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "recipient",
								"type": "address"
							},
							{
								"internalType": "uint64",
								"name": "expirationTime",
								"type": "uint64"
							},
							{
								"internalType": "bool",
								"name": "revocable",
								"type": "bool"
							},
							{
								"internalType": "bytes32",
								"name": "refUID",
								"type": "bytes32"
							},
							{
								"internalType": "bytes",
								"name": "data",
								"type": "bytes"
							},
							{
								"internalType": "uint256",
								"name": "value",
								"type": "uint256"
							}
						],
						"internalType": "struct PADOPortal.AttestationRequestData",
						"name": "data",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct PADOPortal.EIP712Signature",
						"name": "signature",
						"type": "tuple"
					},
					{
						"internalType": "address",
						"name": "attester",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "deadline",
						"type": "uint64"
					}
				],
				"internalType": "struct PADOPortal.DelegatedProxyAttestationRequest",
				"name": "attestationRequest",
				"type": "tuple"
			}
		],
		"name": "attest",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "schema",
						"type": "bytes32"
					},
					{
						"components": [
							{
								"internalType": "address",
								"name": "recipient",
								"type": "address"
							},
							{
								"internalType": "uint64",
								"name": "expirationTime",
								"type": "uint64"
							},
							{
								"internalType": "bool",
								"name": "revocable",
								"type": "bool"
							},
							{
								"internalType": "bytes32",
								"name": "refUID",
								"type": "bytes32"
							},
							{
								"internalType": "bytes",
								"name": "data",
								"type": "bytes"
							},
							{
								"internalType": "uint256",
								"name": "value",
								"type": "uint256"
							}
						],
						"internalType": "struct PADOPortal.AttestationRequestData",
						"name": "data",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint8",
								"name": "v",
								"type": "uint8"
							},
							{
								"internalType": "bytes32",
								"name": "r",
								"type": "bytes32"
							},
							{
								"internalType": "bytes32",
								"name": "s",
								"type": "bytes32"
							}
						],
						"internalType": "struct PADOPortal.EIP712Signature",
						"name": "signature",
						"type": "tuple"
					},
					{
						"internalType": "address",
						"name": "attester",
						"type": "address"
					},
					{
						"internalType": "uint64",
						"name": "deadline",
						"type": "uint64"
					}
				],
				"internalType": "struct PADOPortal.DelegatedProxyAttestationRequest[]",
				"name": "attestationsRequests",
				"type": "tuple[]"
			}
		],
		"name": "bulkAttest",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "schemaId",
						"type": "bytes32"
					},
					{
						"internalType": "uint64",
						"name": "expirationDate",
						"type": "uint64"
					},
					{
						"internalType": "bytes",
						"name": "subject",
						"type": "bytes"
					},
					{
						"internalType": "bytes",
						"name": "attestationData",
						"type": "bytes"
					}
				],
				"internalType": "struct AttestationPayload[]",
				"name": "attestationsPayloads",
				"type": "tuple[]"
			},
			{
				"internalType": "bytes[][]",
				"name": "validationPayloads",
				"type": "bytes[][]"
			}
		],
		"name": "bulkAttest",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "DeadlineExpired",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "_modules",
				"type": "address[]"
			},
			{
				"internalType": "address",
				"name": "_moduleRegistry",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_attestationRegistry",
				"type": "address"
			}
		],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "InvalidShortString",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidSignature",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ModulePayloadMismatch",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "str",
				"type": "string"
			}
		],
		"name": "StringTooLong",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "UsedSignature",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [],
		"name": "EIP712DomainChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "version",
				"type": "uint8"
			}
		],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "feeParams",
				"type": "uint256"
			}
		],
		"name": "setFee",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address payable",
				"name": "recvAddr",
				"type": "address"
			}
		],
		"name": "setReceiveAddr",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "attestationRegistry",
		"outputs": [
			{
				"internalType": "contract AttestationRegistry",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			},
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			}
		],
		"name": "bulkRevoke",
		"outputs": [],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "eip712Domain",
		"outputs": [
			{
				"internalType": "bytes1",
				"name": "fields",
				"type": "bytes1"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "version",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "chainId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "verifyingContract",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "salt",
				"type": "bytes32"
			},
			{
				"internalType": "uint256[]",
				"name": "extensions",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fee",
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
		"inputs": [],
		"name": "getModules",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getName",
		"outputs": [
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
		"inputs": [],
		"name": "moduleRegistry",
		"outputs": [
			{
				"internalType": "contract ModuleRegistry",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "modules",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "receiveAddr",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			},
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "revoke",
		"outputs": [],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes4",
				"name": "interfaceID",
				"type": "bytes4"
			}
		],
		"name": "supportsInterface",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "VERSION",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];