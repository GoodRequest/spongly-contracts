# Spongly-contract

🪸 Smart contracts for Spongly protocol

## Installation

```bash
yarn install
```

## Scripts

```bash
test
yarn hardhat test --optimizer
yarn hardhat test test/contracts/CopyableParlayAMM.ts --optimizer
yarn hardhat test test/contracts/CopyableSportsAMM.ts --optimizer

yarn hardhat coverage

deploy on OP Mainnet
yarn hardhat run --network optimisticEthereum scripts/deployCopyableParlayAMM/deploy_upgradable_copyableParlayAMM.ts
yarn hardhat run --network optimisticEthereum scripts/deployCopyableSportsAMM/deploy_upgradeable_copyableSportsAMM.ts

generate aggregations for OP Mainnet
yarn op:generate-stats
```

## Contracts

- All addresses of deployed contracts can be found in `scripts/utils/deployments.json`


## Useful Links

-   List of all Overtime's Smart contract https://contracts.thalesmarket.io