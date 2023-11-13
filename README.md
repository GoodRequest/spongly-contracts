# Spongly-contract

🪸 Smart contracts for Spongly protocol

## Installation

```bash
yarn install
```

## Scripts

```bash
test
yarn hardhat tests --optimizer
yarn hardhat tests tests/contracts/CopyableParlayAMM.ts --optimizer
yarn hardhat tests tests/contracts/CopyableSportsAMM.ts --optimizer

yarn hardhat coverage

deploys on OP Mainnet
yarn hardhat run --network optimisticEthereum scripts/deployCopyableParlayAMM/copyableParlayAMM.ts
yarn hardhat run --network optimisticEthereum scripts/deployCopyableSportsAMM/copyableSportsAMM.ts

generate aggregations for OP Mainnet
yarn op:generate-stats
```

## Contracts

- All addresses of deployed contracts can be found in `scripts/utils/deployments.json`


## Useful Links

-   List of all Overtime's Smart contract https://contracts.thalesmarket.io
