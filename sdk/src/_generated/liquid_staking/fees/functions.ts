import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function destroy(tx: Transaction, fees: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::destroy`,
    arguments: [obj(tx, fees)],
  });
}

export interface CalculateMintFeeArgs {
  self: TransactionObjectInput;
  suiAmount: bigint | TransactionArgument;
}

export function calculateMintFee(tx: Transaction, args: CalculateMintFeeArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::calculate_mint_fee`,
    arguments: [obj(tx, args.self), pure(tx, args.suiAmount, `u64`)],
  });
}

export interface CalculateRedeemFeeArgs {
  self: TransactionObjectInput;
  suiAmount: bigint | TransactionArgument;
}

export function calculateRedeemFee(
  tx: Transaction,
  args: CalculateRedeemFeeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::calculate_redeem_fee`,
    arguments: [obj(tx, args.self), pure(tx, args.suiAmount, `u64`)],
  });
}

export function customRedeemFeeBps(
  tx: Transaction,
  fees: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::custom_redeem_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export function newBuilder(tx: Transaction) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::new_builder`,
    arguments: [],
  });
}

export function redeemFeeBps(tx: Transaction, fees: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::redeem_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export interface SetCustomRedeemFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setCustomRedeemFeeBps(
  tx: Transaction,
  args: SetCustomRedeemFeeBpsArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_custom_redeem_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export interface SetRedeemFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setRedeemFeeBps(tx: Transaction, args: SetRedeemFeeBpsArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_redeem_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export interface SetSpreadFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setSpreadFeeBps(tx: Transaction, args: SetSpreadFeeBpsArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_spread_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export interface SetStakedSuiMintFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setStakedSuiMintFeeBps(
  tx: Transaction,
  args: SetStakedSuiMintFeeBpsArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_staked_sui_mint_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export interface SetStakedSuiRedeemFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setStakedSuiRedeemFeeBps(
  tx: Transaction,
  args: SetStakedSuiRedeemFeeBpsArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_staked_sui_redeem_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export interface SetSuiMintFeeBpsArgs {
  self: TransactionObjectInput;
  fee: bigint | TransactionArgument;
}

export function setSuiMintFeeBps(tx: Transaction, args: SetSuiMintFeeBpsArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::set_sui_mint_fee_bps`,
    arguments: [obj(tx, args.self), pure(tx, args.fee, `u64`)],
  });
}

export function spreadFeeBps(tx: Transaction, fees: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::spread_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export function stakedSuiMintFeeBps(
  tx: Transaction,
  fees: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::staked_sui_mint_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export function stakedSuiRedeemFeeBps(
  tx: Transaction,
  fees: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::staked_sui_redeem_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export function suiMintFeeBps(tx: Transaction, fees: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::sui_mint_fee_bps`,
    arguments: [obj(tx, fees)],
  });
}

export function toFeeConfig(tx: Transaction, builder: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::to_fee_config`,
    arguments: [obj(tx, builder)],
  });
}

export function validateFees(tx: Transaction, fees: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::fees::validate_fees`,
    arguments: [obj(tx, fees)],
  });
}
