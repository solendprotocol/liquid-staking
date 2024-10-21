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

export interface LiquidStakingObjectInfo {
  id: string;
  type: string;
}

const SUI_SYSTEM_STATE_ID = "0x0000000000000000000000000000000000000000000000000000000000000005";

// user functions
export async function fetchLiquidStakingInfo(info: LiquidStakingObjectInfo, client: SuiClient): Promise<LiquidStakingInfo<any>> {
  return LiquidStakingInfo.fetch(client, phantom(info.type), info.id);
}

// returns the lst object
export function mint(tx: Transaction, info: LiquidStakingObjectInfo, suiCoinId: TransactionObjectInput) {

  let [rSui] = generated.mint(tx, info.type, {
    self: info.id,
    sui: suiCoinId,
    systemState: SUI_SYSTEM_STATE_ID,
  });

  return rSui;
}

// returns the sui coin
export function redeemLst(tx: Transaction, info: LiquidStakingObjectInfo, lstId: TransactionObjectInput) {

  let [sui] = generated.redeem(tx, info.type, {
    self: info.id,
    systemState: SUI_SYSTEM_STATE_ID,
    lst: lstId,
  });

  return sui;
}

// admin functions

export function increaseValidatorStake(
  tx: Transaction, 
  info: LiquidStakingObjectInfo, 
  adminCapId: TransactionObjectInput,
  validatorAddress: string, 
  suiAmount: number
) {
  generated.increaseValidatorStake(tx, info.type, {
    self: info.id,
    adminCap: adminCapId,
    systemState: SUI_SYSTEM_STATE_ID,
    validatorAddress,
    suiAmount: BigInt(suiAmount),
  });
}

export function decreaseValidatorStake(
  tx: Transaction, 
  info: LiquidStakingObjectInfo, 
  adminCapId: TransactionObjectInput,
  validatorAddress: string,
  maxSuiAmount: number
) {
  generated.decreaseValidatorStake(tx, info.type, {
    self: info.id,
    adminCap: adminCapId,
    systemState: SUI_SYSTEM_STATE_ID,
    validatorAddress,
    maxSuiAmount: BigInt(maxSuiAmount),
  });
}

export function collectFees(
  tx: Transaction, 
  info: LiquidStakingObjectInfo, 
  adminCapId: TransactionObjectInput
) {
  let [sui] = generated.collectFees(tx, info.type, {
    self: info.id,
    systemState: SUI_SYSTEM_STATE_ID,
    adminCap: adminCapId,
  });

  return sui;
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
    setRedeemFeeBps(tx, {
      self: builder,
      fee: BigInt(feeConfigArgs.redeemFeeBps),
    });
  }

  if (feeConfigArgs.spreadFee != null) {
    setSpreadFeeBps(tx, {
      self: builder,
      fee: BigInt(feeConfigArgs.spreadFee),
    });
  } 

  let [feeConfig] = toFeeConfig(tx, builder);

  generated.updateFees(tx, info.type, {
    self: info.id,
    adminCap: adminCapId,
    feeConfig,
  }); 
}