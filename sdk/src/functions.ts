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
import { PACKAGE_ID, setPublishedAt } from "./_generated/liquid_staking";

export interface LiquidStakingObjectInfo {
  id: string;
  type: string;
}

const SUI_SYSTEM_STATE_ID = "0x0000000000000000000000000000000000000000000000000000000000000005";
const SUILEND_VALIDATOR_ADDRESS = "0xce8e537664ba5d1d5a6a857b17bd142097138706281882be6805e17065ecde89";
const SPRING_SUI_UPGRADE_CAP_ID = "0x393ea4538463add6f405f2b1e3e6d896e17850975c772135843de26d14cd17c6";

async function getLatestPackageId(client: SuiClient, upgradeCapId: string): Promise<string> {
  const object = await client.getObject({
    id: upgradeCapId,
    options: {
      showContent: true,
    },
  });

  return (object.data?.content as unknown as any).fields.package;
}

export class LstClient {
  liquidStakingObject: LiquidStakingObjectInfo;
  client: SuiClient;

  static async initialize(client: SuiClient, liquidStakingObjectInfo: LiquidStakingObjectInfo): Promise<LstClient> {
    const publishedAt = await getLatestPackageId(client, SPRING_SUI_UPGRADE_CAP_ID);
    setPublishedAt(publishedAt);
    console.log(`Initialized LstClient with package ID: ${publishedAt}`);

    return new LstClient(liquidStakingObjectInfo, client);
  }

  constructor(liquidStakingObject: LiquidStakingObjectInfo, client: SuiClient) {
    this.liquidStakingObject = liquidStakingObject;
    this.client = client;
  }

  async getAdminCapId(address: string): Promise<string | null> {
    let res = (
      await this.client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::liquid_staking::AdminCap<${this.liquidStakingObject.type}>`,
        },
      })
    ).data;

    if (res.length == 0) {
      return null;
    }

    return res[0].data.objectId;
  }

  // returns the lst object
  mint(tx: Transaction, suiCoinId: TransactionObjectInput) {

    let [rSui] = generated.mint(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      sui: suiCoinId,
      systemState: SUI_SYSTEM_STATE_ID,
    });

    return rSui;
  }

  // returns the sui coin
  redeemLst(tx: Transaction, lstId: TransactionObjectInput) {

    let [sui] = generated.redeem(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      systemState: SUI_SYSTEM_STATE_ID,
      lst: lstId,
    });

    return sui;
  }

  // admin functions

  increaseValidatorStake(
    tx: Transaction, 
    adminCapId: TransactionObjectInput,
    validatorAddress: string, 
    suiAmount: number
  ) {
    generated.increaseValidatorStake(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      systemState: SUI_SYSTEM_STATE_ID,
      validatorAddress,
      suiAmount: BigInt(suiAmount),
    });
  }

  decreaseValidatorStake(
    tx: Transaction, 
    adminCapId: TransactionObjectInput,
    validatorAddress: string,
    maxSuiAmount: number
  ) {
    generated.decreaseValidatorStake(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      systemState: SUI_SYSTEM_STATE_ID,
      validatorAddress,
      maxSuiAmount: BigInt(maxSuiAmount),
    });
  }

  collectFees(
    tx: Transaction, 
    adminCapId: TransactionObjectInput
  ) {
    let [sui] = generated.collectFees(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      systemState: SUI_SYSTEM_STATE_ID,
      adminCap: adminCapId,
    });

    return sui;
  }


}
// user functions
export async function fetchLiquidStakingInfo(info: LiquidStakingObjectInfo, client: SuiClient): Promise<LiquidStakingInfo<any>> {
  return LiquidStakingInfo.fetch(client, phantom(info.type), info.id);
}

interface FeeConfigArgs {
  mintFeeBps?: number;
  redeemFeeBps?: number;
  spreadFee?: number;

}

export function updateFees(
  tx: Transaction, 
  info: LiquidStakingObjectInfo, 
  adminCapId: TransactionObjectInput,
  feeConfigArgs: FeeConfigArgs
) {
  let [builder] = newBuilder(tx);

  if (feeConfigArgs.mintFeeBps != null) {
    console.log(`Setting mint fee bps to ${feeConfigArgs.mintFeeBps}`);

    builder = setSuiMintFeeBps(tx, {
      self: builder,
      fee: BigInt(feeConfigArgs.mintFeeBps),
    })[0];
  }

  if (feeConfigArgs.redeemFeeBps != null) {
    console.log(`Setting redeem fee bps to ${feeConfigArgs.redeemFeeBps}`);
    builder = setRedeemFeeBps(tx, {
      self: builder,
      fee: BigInt(feeConfigArgs.redeemFeeBps),
    })[0];
  }

  if (feeConfigArgs.spreadFee != null) {
    builder = setSpreadFeeBps(tx, {
      self: builder,
      fee: BigInt(feeConfigArgs.spreadFee),
    })[0];
  } 

  let [feeConfig] = toFeeConfig(tx, builder);

  generated.updateFees(tx, info.type, {
    self: info.id,
    adminCap: adminCapId,
    feeConfig,
  }); 
}

// only works for sSui
export async function getSpringSuiApy(client: SuiClient) {
  let res = await client.getValidatorsApy();
  let validatorApy = res.apys.find((apy) => apy.address == SUILEND_VALIDATOR_ADDRESS);
  return validatorApy?.apy;
}