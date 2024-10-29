import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  Transaction,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";
import { program } from "commander";
import * as sdk from "./functions";
import { PACKAGE_ID } from "./_generated/liquid_staking";
import { LstClient } from "./functions";

const LIQUID_STAKING_INFO = {
  id: "0xdae271405d47f04ab6c824d3b362b7375844ec987a2627845af715fdcd835795",
  type: "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS",
  weightHookId:
    "0xf244912738939d351aa762dd98c075f873fd95f2928db5fd9e74fbb01c9a686c",
};

const RPC_URL = "https://fullnode.mainnet.sui.io";

const keypair = Ed25519Keypair.fromSecretKey(
  fromBase64(process.env.SUI_SECRET_KEY!),
);

async function mint(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let tx = new Transaction();
  let [sui] = tx.splitCoins(tx.gas, [BigInt(options.amount)]);
  let rSui = lstClient.mint(tx, sui);
  tx.transferObjects([rSui], keypair.toSuiAddress());

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function redeem(options) {
  let client = new SuiClient({ url: RPC_URL });

  let lstCoins = await client.getCoins({
    owner: keypair.toSuiAddress(),
    coinType: LIQUID_STAKING_INFO.type,
    limit: 1000,
  });

  let tx = new Transaction();
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  if (lstCoins.data.length > 1) {
    tx.mergeCoins(
      lstCoins.data[0].coinObjectId,
      lstCoins.data.slice(1).map((c) => c.coinObjectId),
    );
  }

  let [lst] = tx.splitCoins(lstCoins.data[0].coinObjectId, [
    BigInt(options.amount),
  ]);
  let sui = lstClient.redeemLst(tx, lst);

  tx.transferObjects([sui], keypair.toSuiAddress());

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function increaseValidatorStake(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let tx = new Transaction();
  lstClient.increaseValidatorStake(
    tx,
    await lstClient.getAdminCapId(keypair.toSuiAddress()),
    options.validatorAddress,
    options.amount,
  );

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function decreaseValidatorStake(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let tx = new Transaction();
  lstClient.decreaseValidatorStake(
    tx,
    await lstClient.getAdminCapId(keypair.toSuiAddress()),
    options.validatorIndex,
    options.amount,
  );

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function updateFees(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let adminCap = (
    await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${LIQUID_STAKING_INFO.type}>`,
      },
    })
  ).data[0];

  let tx = new Transaction();
  lstClient.updateFees(tx, adminCap.data.objectId, options);

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function initializeWeightHook(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let tx = new Transaction();
  let weightHookAdminCap = lstClient.initializeWeightHook(
    tx,
    await lstClient.getAdminCapId(keypair.toSuiAddress()),
  );
  tx.transferObjects([weightHookAdminCap], keypair.toSuiAddress());

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function setValidatorAddressesAndWeights(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  if (options.validators.length != options.weights.length) {
    throw new Error("Validators and weights arrays must be of the same length");
  }

  let validatorAddressesAndWeights = new Map();
  for (let i = 0; i < options.validators.length; i++) {
    validatorAddressesAndWeights.set(
      options.validators[i],
      options.weights[i] as number,
    );
  }

  console.log(validatorAddressesAndWeights);

  let tx = new Transaction();
  lstClient.setValidatorAddressesAndWeights(
    tx,
    LIQUID_STAKING_INFO.weightHookId,
    await lstClient.getWeightHookAdminCapId(keypair.toSuiAddress()),
    validatorAddressesAndWeights,
  );

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

async function rebalance(options) {
  let client = new SuiClient({ url: RPC_URL });
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);

  let tx = new Transaction();
  lstClient.rebalance(tx, LIQUID_STAKING_INFO.weightHookId);

  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log(txResponse);
}

program.version("1.0.0").description("Spring Sui CLI");

program
  .command("mint")
  .description("mint some rSui")
  .option("--amount <SUI>", "Amount of SUI in MIST")
  .action(mint);

program
  .command("redeem")
  .description("redeem some SUI")
  .option("--amount <LST>", "Amount of LST to redeem")
  .action(redeem);

program
  .command("increase-validator-stake")
  .description("increase validator stake")
  .option("--validator-address <VALIDATOR>", "Validator address")
  .option("--amount <SUI>", "Amount of SUI to delegate to validator")
  .action(increaseValidatorStake);

program
  .command("decrease-validator-stake")
  .description("decrease validator stake")
  .option("--validator-index <VALIDATOR_INDEX>", "Validator index")
  .option("--amount <SUI>", "Amount of SUI to undelegate from validator")
  .action(decreaseValidatorStake);

program
  .command("update-fees")
  .description("update fees")
  .option("--mint-fee-bps <MINT_FEE_BPS>", "Mint fee bps")
  .option("--redeem-fee-bps <REDEEM_FEE_BPS>", "Redeem fee bps")
  .option("--spread-fee <SPREAD_FEE>", "Spread fee")
  .action(updateFees);

program
  .command("fetch-state")
  .description("fetch the current state of the liquid staking pool")
  .action(async () => {
    const client = new SuiClient({ url: RPC_URL });
    try {
      const state = await sdk.fetchLiquidStakingInfo(
        LIQUID_STAKING_INFO,
        client,
      );
      console.log("Current Liquid Staking State:");
      console.log(JSON.stringify(state, null, 2));
    } catch (error) {
      console.error("Error fetching state:", error);
    }
  });

program
  .command("initialize-weight-hook")
  .description("initialize weight hook")
  .action(initializeWeightHook);

function collect(pair, previous) {
  const [key, value] = pair.split("=");
  if (!value) {
    throw new Error(`Invalid format for ${pair}. Use key=value format.`);
  }
  return { ...previous, [key]: value };
}

program
  .command("set-validator-addresses-and-weights")
  .description("set validator addresses and weights")
  .option("-v, --validators <VALIDATOR_ADDRESSES...>", "Validator addresses")
  .option("-w, --weights <WEIGHTS...>", "Weights")
  .action(setValidatorAddressesAndWeights);

program
  .command("rebalance")
  .description("rebalance the validator set")
  .action(rebalance);

program.parse(process.argv);
