import { ethers } from 'hardhat'
import { deploy as deployCopyableParlayAMM } from '../../scripts/deploys/copyableParlayAMM'
import { Contract } from 'ethers'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {getSportMarkets, SportMarket} from "../helpers";

describe('CopyableParlayAMM', async () => {
	let contract: Contract
	let deployer: SignerWithAddress, acc1: SignerWithAddress
	let sportMarkets: SportMarket[]

	before(async () => {
		contract = await deployCopyableParlayAMM()
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

	describe('buyFromParlayWithCopy', () => {
		it('test', async () => {
			const response = await contract
				.connect(acc1.address)
				.buyFromParlayWithCopy([sportMarkets[0].address], 0, 10, 2, 20, deployer.address, 'token')
			console.log('!!!!!!!!!!!!!',response)
		})
	})

	describe('buyFromParlayWithCopyAndDifferentCollateral', () => {
		it('test', async () => {

		})
	})

	describe('getCopiedParlayDetails', () => {
		it('test', async () => {

		})
	})

	describe('getParlayWallets', () => {
		it('test', async () => {

		})
	})

	describe('getWalletParlays', () => {
		it('test', async () => {

		})
	})

	describe('getParlayCopiedCount', () => {
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
