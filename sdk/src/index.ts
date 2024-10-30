import { SuiClient } from "@mysten/sui/client";
import { Transaction, TransactionObjectInput } from "@mysten/sui/transactions";

import { phantom } from "./_generated/_framework/reified";
import { PACKAGE_ID, setPublishedAt } from "./_generated/liquid_staking";
import {
  newBuilder,
  setRedeemFeeBps,
  setSpreadFeeBps,
  setSuiMintFeeBps,
  toFeeConfig,
} from "./_generated/liquid_staking/fees/functions";
import * as generated from "./_generated/liquid_staking/liquid-staking/functions";
import { LiquidStakingInfo } from "./_generated/liquid_staking/liquid-staking/structs";
import * as weightHookGenerated from "./_generated/liquid_staking/weight/functions";
import { WeightHook } from "./_generated/liquid_staking/weight/structs";

export interface LiquidStakingObjectInfo {
  id: string;
  type: string;
}

const SUI_SYSTEM_STATE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000005";
const SUILEND_VALIDATOR_ADDRESS =
  "0xce8e537664ba5d1d5a6a857b17bd142097138706281882be6805e17065ecde89";
const SPRING_SUI_UPGRADE_CAP_ID =
  "0x4dc657b6c0fe896f4b94fee1ceac96312dde0a36b94e799caaec30deb53dcd67";

async function getLatestPackageId(
  client: SuiClient,
  upgradeCapId: string,
): Promise<string> {
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

  static async initialize(
    client: SuiClient,
    liquidStakingObjectInfo: LiquidStakingObjectInfo,
  ): Promise<LstClient> {
    const publishedAt = await getLatestPackageId(
      client,
      SPRING_SUI_UPGRADE_CAP_ID,
    );
    setPublishedAt(publishedAt);
    console.log(`Initialized LstClient with package ID: ${publishedAt}`);

    return new LstClient(liquidStakingObjectInfo, client);
  }

  constructor(liquidStakingObject: LiquidStakingObjectInfo, client: SuiClient) {
    this.liquidStakingObject = liquidStakingObject;
    this.client = client;
  }

  async getAdminCapId(address: string): Promise<string | null | undefined> {
    const res = (
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

    return res[0].data?.objectId;
  }

  async getWeightHookAdminCapId(
    address: string,
  ): Promise<string | null | undefined> {
    const res = (
      await this.client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${PACKAGE_ID}::weight::WeightHookAdminCap<${this.liquidStakingObject.type}>`,
        },
      })
    ).data;

    if (res.length == 0) {
      return null;
    }

    return res[0].data?.objectId;
  }

  // returns the lst object
  mint(tx: Transaction, suiCoinId: TransactionObjectInput) {
    const [rSui] = generated.mint(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      sui: suiCoinId,
      systemState: SUI_SYSTEM_STATE_ID,
    });

    return rSui;
  }

  // returns the sui coin
  redeemLst(tx: Transaction, lstId: TransactionObjectInput) {
    const [sui] = generated.redeem(tx, this.liquidStakingObject.type, {
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
    suiAmount: number,
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
    maxSuiAmount: number,
  ) {
    generated.decreaseValidatorStake(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      systemState: SUI_SYSTEM_STATE_ID,
      validatorAddress,
      maxSuiAmount: BigInt(maxSuiAmount),
    });
  }

  collectFees(tx: Transaction, adminCapId: TransactionObjectInput) {
    const [sui] = generated.collectFees(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      systemState: SUI_SYSTEM_STATE_ID,
      adminCap: adminCapId,
    });

    return sui;
  }

  updateFees(
    tx: Transaction,
    adminCapId: TransactionObjectInput,
    feeConfigArgs: FeeConfigArgs,
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
      console.log(`Setting spread fee bps to ${feeConfigArgs.spreadFee}`);
      builder = setSpreadFeeBps(tx, {
        self: builder,
        fee: BigInt(feeConfigArgs.spreadFee),
      })[0];
    }

    const [feeConfig] = toFeeConfig(tx, builder);

    generated.updateFees(tx, this.liquidStakingObject.type, {
      self: this.liquidStakingObject.id,
      adminCap: adminCapId,
      feeConfig,
    });
  }

  // weight hook functions
  initializeWeightHook(tx: Transaction, adminCapId: TransactionObjectInput) {
    const [weightHook, weightHookAdminCap] = weightHookGenerated.new_(
      tx,
      this.liquidStakingObject.type,
      adminCapId,
    );

    tx.moveCall({
      target: `0x2::transfer::public_share_object`,
      typeArguments: [
        `${WeightHook.$typeName}<${this.liquidStakingObject.type}>`,
      ],
      arguments: [weightHook],
    });

    return weightHookAdminCap;
  }

  setValidatorAddressesAndWeights(
    tx: Transaction,
    weightHookId: TransactionObjectInput,
    weightHookAdminCap: TransactionObjectInput,
    validatorAddressesAndWeights: Map<string, number>,
  ) {
    const [vecMap] = tx.moveCall({
      target: `0x2::vec_map::empty`,
      typeArguments: ["address", "u64"],
      arguments: [],
    });

    for (const [
      validatorAddress,
      weight,
    ] of validatorAddressesAndWeights.entries()) {
      tx.moveCall({
        target: `0x2::vec_map::insert`,
        typeArguments: ["address", "u64"],
        arguments: [
          vecMap,
          tx.pure.address(validatorAddress),
          tx.pure.u64(weight),
        ],
      });
    }

    weightHookGenerated.setValidatorAddressesAndWeights(
      tx,
      this.liquidStakingObject.type,
      {
        self: weightHookId,
        weightHookAdminCap,
        validatorAddressesAndWeights: vecMap,
      },
    );
  }

  rebalance(tx: Transaction, weightHookId: TransactionObjectInput) {
    weightHookGenerated.rebalance(tx, this.liquidStakingObject.type, {
      self: weightHookId,
      systemState: SUI_SYSTEM_STATE_ID,
      liquidStakingInfo: this.liquidStakingObject.id,
    });
  }
}

// user functions
export async function fetchLiquidStakingInfo(
  info: LiquidStakingObjectInfo,
  client: SuiClient,
): Promise<LiquidStakingInfo<any>> {
  return LiquidStakingInfo.fetch(client, phantom(info.type), info.id);
}

interface FeeConfigArgs {
  mintFeeBps?: number;
  redeemFeeBps?: number;
  spreadFee?: number;
}

// only works for sSui
export async function getSpringSuiApy(client: SuiClient) {
  const res = await client.getValidatorsApy();
  const validatorApy = res.apys.find(
    (apy) => apy.address == SUILEND_VALIDATOR_ADDRESS,
  );
  return validatorApy?.apy;
}
