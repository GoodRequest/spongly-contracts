import { ethers } from 'hardhat'
import { deploy as deployCopyableParlayAMM } from "../../scripts/deployCopyableParlayAMM/deploy_upgradable_copyableParlayAMM";
import {Contract} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";


describe('CopyableParlayAMM', async () => {
	let contract: Contract
	before(async () => {
		contract = await deployCopyableParlayAMM()
	})

	it('Should be deployed', async () => {
		expect(contract.address).to.be.properAddress
	})
})
