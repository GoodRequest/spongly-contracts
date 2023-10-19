import {ethers} from 'hardhat'
import { deploy as deployCopyableParlayAMM } from "../../scripts/deploys/copyableParlayAMM";
import {Contract} from "ethers";
import {expect} from "chai";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";


describe('CopyableParlayAMM', async () => {
	let contract: Contract
	let deployer: SignerWithAddress, acc1: SignerWithAddress
	before(async () => {
		contract = await deployCopyableParlayAMM()
		let accounts = await ethers.getSigners()
		deployer = accounts[0]
		acc1 = accounts[1]
	})

	it('Should be deployed', async () => {
		expect(contract.address).to.be.properAddress
	})

	it('Deployer should be an owner', async () => {
		expect(await contract.owner()).to.eq(deployer.address)
	})

	it('Test getCopiedParlayDetails function', async () => {
		const result = await contract.getCopiedParlayDetails(acc1.address)
		expect(result.copiedCount).to.eq(0)
	})

	it('Test setAddresses onlyOwner', async () => {
		const tx = contract.connect(acc1).setAddresses(acc1.address)
		await expect(tx).to.be.revertedWith('Only the contract owner may perform this action')
	})

	it('Test setAddresses event should be emitted', async () => {
		const tx = await contract.connect(deployer).setAddresses(acc1.address)
		await expect(tx).to.emit(contract, 'AddressesSet').withArgs(acc1.address)
	})
})
