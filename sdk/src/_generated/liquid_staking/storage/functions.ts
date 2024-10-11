import { PUBLISHED_AT } from "..";
import { ID } from "../../_dependencies/source/0x2/object/structs";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function isEmpty(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::is_empty`,
    arguments: [obj(tx, self)],
  });
}

export function new_(tx: Transaction) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::new`,
    arguments: [],
  });
}

export function validatorAddress(
  tx: Transaction,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::validator_address`,
    arguments: [obj(tx, self)],
  });
}

export interface GetSuiAmountArgs {
  exchangeRate: TransactionObjectInput;
  tokenAmount: bigint | TransactionArgument;
}

export function getSuiAmount(tx: Transaction, args: GetSuiAmountArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::get_sui_amount`,
    arguments: [obj(tx, args.exchangeRate), pure(tx, args.tokenAmount, `u64`)],
  });
}

export function exchangeRate(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::exchange_rate`,
    arguments: [obj(tx, self)],
  });
}

export function stakingPoolId(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::staking_pool_id`,
    arguments: [obj(tx, self)],
  });
}

export function validators(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::validators`,
    arguments: [obj(tx, self)],
  });
}

export function activeStake(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::active_stake`,
    arguments: [obj(tx, self)],
  });
}

export interface ChangeValidatorPriorityArgs {
  self: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  newValidatorIndex: bigint | TransactionArgument;
}

export function changeValidatorPriority(
  tx: Transaction,
  args: ChangeValidatorPriorityArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::change_validator_priority`,
    arguments: [
      obj(tx, args.self),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.newValidatorIndex, `u64`),
    ],
  });
}

export interface GetOrAddValidatorIndexByStakingPoolIdMutArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  stakingPoolId: string | TransactionArgument;
}

export function getOrAddValidatorIndexByStakingPoolIdMut(
  tx: Transaction,
  args: GetOrAddValidatorIndexByStakingPoolIdMutArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::get_or_add_validator_index_by_staking_pool_id_mut`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.stakingPoolId, `${ID.$typeName}`),
    ],
  });
}

export function inactiveStake(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::inactive_stake`,
    arguments: [obj(tx, self)],
  });
}

export interface JoinFungibleStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  fungibleStakedSui: TransactionObjectInput;
}

export function joinFungibleStake(
  tx: Transaction,
  args: JoinFungibleStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::join_fungible_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.fungibleStakedSui),
    ],
  });
}

export interface JoinFungibleStakedSuiToValidatorArgs {
  self: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  fungibleStakedSui: TransactionObjectInput;
}

export function joinFungibleStakedSuiToValidator(
  tx: Transaction,
  args: JoinFungibleStakedSuiToValidatorArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::join_fungible_staked_sui_to_validator`,
    arguments: [
      obj(tx, args.self),
      pure(tx, args.validatorIndex, `u64`),
      obj(tx, args.fungibleStakedSui),
    ],
  });
}

export interface JoinInactiveStakeToValidatorArgs {
  self: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  stake: TransactionObjectInput;
}

export function joinInactiveStakeToValidator(
  tx: Transaction,
  args: JoinInactiveStakeToValidatorArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::join_inactive_stake_to_validator`,
    arguments: [
      obj(tx, args.self),
      pure(tx, args.validatorIndex, `u64`),
      obj(tx, args.stake),
    ],
  });
}

export interface JoinStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  stake: TransactionObjectInput;
}

export function joinStake(tx: Transaction, args: JoinStakeArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::join_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.stake),
    ],
  });
}

export interface JoinToSuiPoolArgs {
  self: TransactionObjectInput;
  sui: TransactionObjectInput;
}

export function joinToSuiPool(tx: Transaction, args: JoinToSuiPoolArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::join_to_sui_pool`,
    arguments: [obj(tx, args.self), obj(tx, args.sui)],
  });
}

export function lastRefreshEpoch(
  tx: Transaction,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::last_refresh_epoch`,
    arguments: [obj(tx, self)],
  });
}

export interface RefreshArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function refresh(tx: Transaction, args: RefreshArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::refresh`,
    arguments: [obj(tx, args.self), obj(tx, args.systemState)],
  });
}

export interface RefreshValidatorInfoArgs {
  self: TransactionObjectInput;
  i: bigint | TransactionArgument;
}

export function refreshValidatorInfo(
  tx: Transaction,
  args: RefreshValidatorInfoArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::refresh_validator_info`,
    arguments: [obj(tx, args.self), pure(tx, args.i, `u64`)],
  });
}

export interface SplitFromActiveStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  fungibleStakedSuiAmount: bigint | TransactionArgument;
}

export function splitFromActiveStake(
  tx: Transaction,
  args: SplitFromActiveStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::split_from_active_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.fungibleStakedSuiAmount, `u64`),
    ],
  });
}

export interface SplitFromInactiveStakeArgs {
  self: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  suiAmountOut: bigint | TransactionArgument;
}

export function splitFromInactiveStake(
  tx: Transaction,
  args: SplitFromInactiveStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::split_from_inactive_stake`,
    arguments: [
      obj(tx, args.self),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.suiAmountOut, `u64`),
    ],
  });
}

export interface SplitFromSuiPoolArgs {
  self: TransactionObjectInput;
  amount: bigint | TransactionArgument;
}

export function splitFromSuiPool(tx: Transaction, args: SplitFromSuiPoolArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::split_from_sui_pool`,
    arguments: [obj(tx, args.self), pure(tx, args.amount, `u64`)],
  });
}

export interface SplitNSuiArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  maxSuiAmountOut: bigint | TransactionArgument;
}

export function splitNSui(tx: Transaction, args: SplitNSuiArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::split_n_sui`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.maxSuiAmountOut, `u64`),
    ],
  });
}

export interface SplitUpToNSuiFromSuiPoolArgs {
  self: TransactionObjectInput;
  maxSuiAmountOut: bigint | TransactionArgument;
}

export function splitUpToNSuiFromSuiPool(
  tx: Transaction,
  args: SplitUpToNSuiFromSuiPoolArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::split_up_to_n_sui_from_sui_pool`,
    arguments: [obj(tx, args.self), pure(tx, args.maxSuiAmountOut, `u64`)],
  });
}

export function suiPool(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::sui_pool`,
    arguments: [obj(tx, self)],
  });
}

export interface TakeActiveStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
}

export function takeActiveStake(tx: Transaction, args: TakeActiveStakeArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::take_active_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
    ],
  });
}

export interface TakeFromInactiveStakeArgs {
  self: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
}

export function takeFromInactiveStake(
  tx: Transaction,
  args: TakeFromInactiveStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::take_from_inactive_stake`,
    arguments: [obj(tx, args.self), pure(tx, args.validatorIndex, `u64`)],
  });
}

export function totalSuiAmount(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::total_sui_amount`,
    arguments: [obj(tx, self)],
  });
}

export function totalSuiSupply(tx: Transaction, self: TransactionObjectInput) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::total_sui_supply`,
    arguments: [obj(tx, self)],
  });
}

export interface UnstakeApproxNSuiFromActiveStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  targetUnstakeSuiAmount: bigint | TransactionArgument;
}

export function unstakeApproxNSuiFromActiveStake(
  tx: Transaction,
  args: UnstakeApproxNSuiFromActiveStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::unstake_approx_n_sui_from_active_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.targetUnstakeSuiAmount, `u64`),
    ],
  });
}

export interface UnstakeApproxNSuiFromInactiveStakeArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  targetUnstakeSuiAmount: bigint | TransactionArgument;
}

export function unstakeApproxNSuiFromInactiveStake(
  tx: Transaction,
  args: UnstakeApproxNSuiFromInactiveStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::unstake_approx_n_sui_from_inactive_stake`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.targetUnstakeSuiAmount, `u64`),
    ],
  });
}

export interface UnstakeApproxNSuiFromValidatorArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  unstakeSuiAmount: bigint | TransactionArgument;
}

export function unstakeApproxNSuiFromValidator(
  tx: Transaction,
  args: UnstakeApproxNSuiFromValidatorArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::storage::unstake_approx_n_sui_from_validator`,
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.unstakeSuiAmount, `u64`),
    ],
  });
}
