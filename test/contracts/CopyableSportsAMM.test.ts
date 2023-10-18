import { ethers } from 'hardhat'
import { deploy as deployCopyableSportsAMM } from "../../scripts/deployCopyableSportsAMM/deploy_upgradeable_copyableSportsAMM"
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {Contract} from "ethers";


describe('CopyableSportsAMM', () => {
    let contract: Contract
    let owner: SignerWithAddress, acc1: SignerWithAddress
    before('before', async () => {
        [owner, acc1] = await ethers.getSigners()
        contract = await deployCopyableSportsAMM()
    })

    it('Should be deployed', async () => {
        expect(contract.address).to.be.properAddress
    })
})
