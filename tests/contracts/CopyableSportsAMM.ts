import {getNamedAccounts} from 'hardhat'
import {expect} from "chai";
import {Contract} from "ethers";
import {Address} from "hardhat-deploy/dist/types";
import {deploy as deployCopyableParlayAMM} from "../../scripts/deploys/copyableParlayAMM";


describe('CopyableSportsAMM', async () => {
    let contract: Contract
    let deployer: Address
    before(async () => {
        contract = await deployCopyableParlayAMM()
        let accounts = await getNamedAccounts()
        deployer = accounts.deployer
    })

    it('Should be deployed', async () => {
        expect(contract.address).to.be.properAddress
    })

    it('Deployer should be an owner', async () => {
        expect(await contract.owner()).to.eq(deployer)
    })
})
