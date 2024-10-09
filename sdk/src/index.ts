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

const LIQUID_STAKING_INFO = {
  id: "0x4b7b661cb29e49557cd8118d34357b2d09e2e959c37188143feac31a9f2f3e79",
  type: "0x1e20267bbc14a1c19399473165685a409f36f161583650e09981ef936560ee44::ripleys::RIPLEYS",
};

const RPC_URL = "https://fullnode.testnet.sui.io";

const keypair = Ed25519Keypair.fromSecretKey(
  fromBase64(process.env.SUI_SECRET_KEY!)
);

async function mint(options) {
  let client = new SuiClient({ url: RPC_URL });

  let tx = new Transaction();
  let [sui] = tx.splitCoins(tx.gas, [BigInt(options.amount)]);
  let rSui = sdk.mint(tx, LIQUID_STAKING_INFO, sui);
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

  if (lstCoins.data.length > 1) {
    tx.mergeCoins(
      lstCoins.data[0].coinObjectId,
      lstCoins.data.slice(1).map((c) => c.coinObjectId)
    );
  }

  let [lst] = tx.splitCoins(lstCoins.data[0].coinObjectId, [
    BigInt(options.amount),
  ]);
  let sui = sdk.redeemLst(tx, LIQUID_STAKING_INFO, lst);

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

  let adminCap = (
    await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${LIQUID_STAKING_INFO.type}>`,
      },
    })
  ).data[0];

  let tx = new Transaction();
  sdk.increaseValidatorStake(
    tx,
    LIQUID_STAKING_INFO,
    adminCap.data.objectId,
    options.validatorAddress,
    options.amount
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

  let adminCap = (
    await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${LIQUID_STAKING_INFO.type}>`,
      },
    })
  ).data[0];

  let tx = new Transaction();
  sdk.decreaseValidatorStake(
    tx,
    LIQUID_STAKING_INFO,
    adminCap.data.objectId,
    options.validatorIndex,
    options.amount
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

  let adminCap = (
    await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${LIQUID_STAKING_INFO.type}>`,
      },
    })
  ).data[0];

  let tx = new Transaction();
  sdk.updateFees(tx, LIQUID_STAKING_INFO, adminCap.data.objectId, options);

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

program.parse(process.argv);
