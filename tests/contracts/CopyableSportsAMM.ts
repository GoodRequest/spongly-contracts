import { ethers, getNamedAccounts } from 'hardhat'
import { expect } from 'chai'
import { Contract } from 'ethers'
import { deploy as copyableSportsAMM } from '../../scripts/deploys/copyableSportsAMM'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { getSportMarkets, SportMarket } from '../helpers'

describe('CopyableSportsAMM', async () => {
	let contract: Contract
	let deployer: SignerWithAddress, acc1: SignerWithAddress
	let sportMarkets: SportMarket[]
	before(async () => {
		contract = await copyableSportsAMM()
		let accounts = await ethers.getSigners()
		deployer = accounts[0]
		acc1 = accounts[1]
		sportMarkets = await getSportMarkets()
	})

	it('Should be deployed', async () => {
		expect(contract.address).to.be.properAddress
	})

	it('Deployer should be an owner', async () => {
		expect(await contract.owner()).to.eq(deployer.address)
	})

	describe('buyFromAMMWithCopy', () => {
		it('Test success scenario', async () => {
			// await contract.connect(acc1.address).buyFromAMMWithCopy(sportMarkets[0].address, sportMarkets[0].)
		})
	})

	describe('buyFromParlayWithCopyAndDifferentCollateral', () => {
		it('test', async () => {
		})
	})

	describe('getMarketWallets', () => {
		it('test', async () => {
		})
	})

	describe('getWalletMarkets', () => {
		it('test', async () => {
		})
	})

	describe('getMarketCopiedCount', () => {
		it('test', async () => {
		})
	})

	describe('setAddresses', () => {
		it('test', async () => {
		})
	})

	describe('setCurveSUSD', () => {
		it('test', async () => {
		})
	})
})
