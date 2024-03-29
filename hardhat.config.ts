import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@nomiclabs/hardhat-solhint'
import '@openzeppelin/hardhat-upgrades'
import 'hardhat-abi-exporter'
import * as dotenv from 'dotenv'

dotenv.config()

const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY_DEV1!
const INFURA_API_KEY = process.env.INFURA_API_KEY!

const ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY!
const OP_ETHERSCAN_KEY = process.env.ETHERSCAN_API_KEY!
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY!
const ARBITRUM_API_KEY = process.env.ARBITRUM_API_KEY!
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY!

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.17',
		settings: {
			viaIR: true,
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	paths: {
		sources: './contracts',
		tests: './test/contracts'
	},
	defaultNetwork: 'hardhat',
	networks: {
		localhost: {
			chainId: 31337
		},
		goerli: {
			url: 'https://goerli.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		ropsten: {
			gasPrice: 'auto',
			url: 'https://ropsten.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		kovan: {
			gasPrice: 'auto',
			url: 'https://kovan.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		mainnet: {
			gasPrice: 'auto',
			url: 'https://mainnet.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		optimisticEthereum: {
			url: 'https://optimism-mainnet.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		optimisticGoerli: {
			gasPrice: 10000,
			chainId: 420,
			url: 'https://optimism-goerli.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		polygonMumbai: {
			url: 'https://polygon-mumbai.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY],
			gasPrice: 80000000000
		},
		polygon: {
			url: 'https://polygon-mainnet.infura.io/v3/' + INFURA_API_KEY,
			accounts: [PRIVATE_KEY]
		},
		bsc: {
			url: 'https://bsc-dataseed.binance.org/',
			chainId: 56,
			//gasPrice: 5000000000,
			accounts: [PRIVATE_KEY]
		},
		arbitrumOne: {
			url: 'https://arbitrum-mainnet.infura.io/v3/' + INFURA_API_KEY,
			chainId: 42161,
			//gasPrice: 5000000000,
			accounts: [PRIVATE_KEY]
		},
		baseMainnet: {
			url: 'https://mainnet.base.org',
			chainId: 8453,
			accounts: [PRIVATE_KEY],
			gasPrice: 1000000000
		}
	},
	gasReporter: {
		enabled: process.env.REPORT_GAS ? true : false,
		outputFile: 'gas-report.txt',
		noColors: true
	},
	abiExporter: {
		path: './scripts/abi',
		clear: true,
		flat: true,
		only: [],
		spacing: 2
	},
	etherscan: {
		customChains: [
			{
				network: 'optimisticGoerli',
				chainId: 420,
				urls: {
					apiURL: 'https://api-goerli-optimism.etherscan.io/api',
					browserURL: 'https://goerli-optimism.etherscan.io/'
				}
			},
			{
				network: 'baseMainnet',
				chainId: 8453,
				urls: {
					apiURL: 'https://api.basescan.org/api',
					browserURL: 'https://basescan.org/'
				}
			}
		],
		apiKey: {
			mainnet: ETHERSCAN_KEY,
			ropsten: ETHERSCAN_KEY,
			rinkeby: ETHERSCAN_KEY,
			goerli: ETHERSCAN_KEY,
			kovan: ETHERSCAN_KEY,

			// optimism
			optimisticEthereum: OP_ETHERSCAN_KEY,
			optimisticGoerli: OP_ETHERSCAN_KEY,

			// polygon
			polygon: POLYGONSCAN_API_KEY,
			polygonMumbai: POLYGONSCAN_API_KEY,

			arbitrumOne: ARBITRUM_API_KEY,
			baseMainnet: BASESCAN_API_KEY
		}
	}
}

export default config
