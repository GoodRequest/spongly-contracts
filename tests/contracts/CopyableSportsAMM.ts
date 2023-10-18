import { ethers } from 'hardhat'
import { deploy as deployCopyableSportsAMM } from "../../scripts/deployCopyableSportsAMM/deploy_upgradeable_copyableSportsAMM"
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {expect} from "chai";
import {Contract} from "ethers";


describe('CopyableSportsAMM', async () => {
    let contract: Contract
    before(async () => {
        contract = await deployCopyableSportsAMM()
    })

    it('Should be deployed', async () => {
        expect(contract.address).to.be.properAddress
    })
})
