import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromBase64 } from "@mysten/sui/utils";

import {
  newBuilder,
  toFeeConfig,
} from "./_generated/liquid_staking/fees/functions";
import * as generated from "./_generated/liquid_staking/liquid-staking/functions";
import { LiquidStakingInfo } from "./_generated/liquid_staking/liquid-staking/structs";

import { LstClient } from "./index";

const keypair = Ed25519Keypair.fromSecretKey(
  fromBase64(process.env.SUI_SECRET_KEY!),
);

const LIQUID_STAKING_INFO = {
  id: "0xdae271405d47f04ab6c824d3b362b7375844ec987a2627845af715fdcd835795",
  type: "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS",
};

async function createNewLst() {
  const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });
  const tx = new Transaction();

  const [feeConfigBuilder] = newBuilder(tx);
  const [feeConfig] = toFeeConfig(tx, feeConfigBuilder);

  const liquidStakingInfoType =
    "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS";
  const [adminCap, liquidStakingInfo] = generated.createLst(
    tx,
    liquidStakingInfoType,
    {
      feeConfig,
      lstTreasuryCap:
        "0x272a461ab0f142c5bae0e88aeeb7009b51e1bf12d543856764fc413cea046529",
    },
  );

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [
      `${LiquidStakingInfo.$typeName}<${liquidStakingInfoType}>}`,
    ],
    arguments: [liquidStakingInfo],
  });

  tx.transferObjects([adminCap], keypair.toSuiAddress());

  const txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });
}

async function getValidatorApys() {
  const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });

  const res = await client.getValidatorsApy();

  const validatorAddresses = res.apys.map((apy) => apy.address);
  const lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);
  const adminCapId = await lstClient.getAdminCapId(keypair.toSuiAddress());
  if (!adminCapId) return;

  for (let i = 0; i < 50; i++) {
    const tx = new Transaction();
    lstClient.increaseValidatorStake(
      tx,
      adminCapId,
      validatorAddresses[i],
      1_000_000_000,
    );

    const txResponse = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    console.log(txResponse);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// createNewLst();
getValidatorApys();
