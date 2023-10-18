import { ethers, network, upgrades } from 'hardhat'
import { deploy as deployCopyableParlayAMM } from "../../scripts/deployCopyableParlayAMM/deploy_upgradable_copyableParlayAMM";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";


describe('CopyableParlayAMM', () => {
	let contract: Contract
	let owner: SignerWithAddress, acc1: SignerWithAddress
	before('before', async () => {
		[owner, acc1] = await ethers.getSigners()
		contract = await deployCopyableParlayAMM()
	})

	it('Should be deployed', async function () {
		expect(contract.address).to.be.properAddress
	})
})
