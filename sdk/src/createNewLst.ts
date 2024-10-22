import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  Transaction,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import * as generated from "./_generated/liquid_staking/liquid-staking/functions";
import { newBuilder, setRedeemFeeBps, setSpreadFeeBps, setSuiMintFeeBps, toFeeConfig } from "./_generated/liquid_staking/fees/functions";
import { fromBase64 } from "@mysten/sui/utils";
import { LiquidStakingInfo } from "./_generated/liquid_staking/liquid-staking/structs";
import { phantom } from "./_generated/_framework/reified";
import { fetchLiquidStakingInfo, getSpringSuiApy, LstClient } from "./functions";
import { PACKAGE_ID } from "./_generated/liquid_staking";

const keypair = Ed25519Keypair.fromSecretKey(
  fromBase64(process.env.SUI_SECRET_KEY!)
);

const LIQUID_STAKING_INFO = {
  id: "0xdae271405d47f04ab6c824d3b362b7375844ec987a2627845af715fdcd835795",
  type: "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS",
};

async function createNewLst() {
  let client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });
  let tx = new Transaction();


  let [feeConfigBuilder] = newBuilder(tx);
  let [feeConfig] = toFeeConfig(tx, feeConfigBuilder);

  let liquidStakingInfoType = "0xba2a31b3b21776d859c9fdfe797f52b069fe8fe0961605ab093ca4eb437d2632::ripleys::RIPLEYS";
  let [adminCap, liquidStakingInfo] = generated.createLst(
    tx,
    liquidStakingInfoType,
    {
      feeConfig,
      lstTreasuryCap: "0x272a461ab0f142c5bae0e88aeeb7009b51e1bf12d543856764fc413cea046529",
    }
  );

  tx.moveCall({
    target: `0x2::transfer::public_share_object`,
    typeArguments: [`${LiquidStakingInfo.$typeName}<${liquidStakingInfoType}>}`],
    arguments: [liquidStakingInfo],
  });

  tx.transferObjects([adminCap], keypair.toSuiAddress());


  let txResponse = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
  });
}

async function getValidatorApys() {
  let client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });

  let res = await client.getValidatorsApy();

  let validatorAddresses = res.apys.map((apy) => apy.address);
  let lstClient = await LstClient.initialize(client, LIQUID_STAKING_INFO);
  let adminCapId = await lstClient.getAdminCapId(keypair.toSuiAddress());

  for (let i = 0; i < 50; i++) {
    let tx = new Transaction();
    lstClient.increaseValidatorStake(
      tx, 
      adminCapId,
      validatorAddresses[i],
      1_000_000_000
    );

    let txResponse = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    console.log(txResponse);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

}

// createNewLst();
getValidatorApys();