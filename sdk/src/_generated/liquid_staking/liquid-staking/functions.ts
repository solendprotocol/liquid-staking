import { PUBLISHED_AT } from "..";
import { FungibleStakedSui } from "../../_dependencies/source/0x3/staking-pool/structs";
import { obj, pure, vector } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function fees(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::fees`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export interface MintArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  sui: TransactionObjectInput;
}

export function mint(tx: Transaction, typeArg: string, args: MintArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::mint`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.sui),
    ],
  });
}

export function storage(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::storage`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export interface ChangeValidatorPriorityArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  newValidatorIndex: bigint | TransactionArgument;
}

export function changeValidatorPriority(
  tx: Transaction,
  typeArg: string,
  args: ChangeValidatorPriorityArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::change_validator_priority`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.newValidatorIndex, `u64`),
    ],
  });
}

export interface RefreshArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function refresh(tx: Transaction, typeArg: string, args: RefreshArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::refresh`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), obj(tx, args.systemState)],
  });
}

export function totalSuiSupply(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::total_sui_supply`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export interface CollectFeesArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  adminCap: TransactionObjectInput;
}

export function collectFees(
  tx: Transaction,
  typeArg: string,
  args: CollectFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::collect_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.adminCap),
    ],
  });
}

export interface CreateLstArgs {
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
}

export function createLst(
  tx: Transaction,
  typeArg: string,
  args: CreateLstArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.feeConfig), obj(tx, args.lstTreasuryCap)],
  });
}

export function feeConfig(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::fee_config`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export interface CreateLstWithStakeArgs {
  systemState: TransactionObjectInput;
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
  fungibleStakedSuis: Array<TransactionObjectInput> | TransactionArgument;
  sui: TransactionObjectInput;
}

export function createLstWithStake(
  tx: Transaction,
  typeArg: string,
  args: CreateLstWithStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst_with_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.systemState),
      obj(tx, args.feeConfig),
      obj(tx, args.lstTreasuryCap),
      vector(tx, `${FungibleStakedSui.$typeName}`, args.fungibleStakedSuis),
      obj(tx, args.sui),
    ],
  });
}

export interface CreateLstWithStorageArgs {
  feeConfig: TransactionObjectInput;
  lstTreasuryCap: TransactionObjectInput;
  storage: TransactionObjectInput;
}

export function createLstWithStorage(
  tx: Transaction,
  typeArg: string,
  args: CreateLstWithStorageArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::create_lst_with_storage`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.feeConfig),
      obj(tx, args.lstTreasuryCap),
      obj(tx, args.storage),
    ],
  });
}

export interface DecreaseValidatorStakeArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorIndex: bigint | TransactionArgument;
  maxSuiAmount: bigint | TransactionArgument;
}

export function decreaseValidatorStake(
  tx: Transaction,
  typeArg: string,
  args: DecreaseValidatorStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::decrease_validator_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.systemState),
      pure(tx, args.validatorIndex, `u64`),
      pure(tx, args.maxSuiAmount, `u64`),
    ],
  });
}

export interface IncreaseValidatorStakeArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  systemState: TransactionObjectInput;
  validatorAddress: string | TransactionArgument;
  suiAmount: bigint | TransactionArgument;
}

export function increaseValidatorStake(
  tx: Transaction,
  typeArg: string,
  args: IncreaseValidatorStakeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::increase_validator_stake`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.systemState),
      pure(tx, args.validatorAddress, `address`),
      pure(tx, args.suiAmount, `u64`),
    ],
  });
}

export interface LstAmountToSuiAmountArgs {
  self: TransactionObjectInput;
  lstAmount: bigint | TransactionArgument;
}

export function lstAmountToSuiAmount(
  tx: Transaction,
  typeArg: string,
  args: LstAmountToSuiAmountArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::lst_amount_to_sui_amount`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), pure(tx, args.lstAmount, `u64`)],
  });
}

export interface RedeemArgs {
  self: TransactionObjectInput;
  lst: TransactionObjectInput;
  systemState: TransactionObjectInput;
}

export function redeem(tx: Transaction, typeArg: string, args: RedeemArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::redeem`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.lst),
      obj(tx, args.systemState),
    ],
  });
}

export interface SuiAmountToLstAmountArgs {
  self: TransactionObjectInput;
  suiAmount: bigint | TransactionArgument;
}

export function suiAmountToLstAmount(
  tx: Transaction,
  typeArg: string,
  args: SuiAmountToLstAmountArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::sui_amount_to_lst_amount`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), pure(tx, args.suiAmount, `u64`)],
  });
}

export function totalLstSupply(
  tx: Transaction,
  typeArg: string,
  self: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::total_lst_supply`,
    typeArguments: [typeArg],
    arguments: [obj(tx, self)],
  });
}

export interface UpdateFeesArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
  feeConfig: TransactionObjectInput;
}

export function updateFees(
  tx: Transaction,
  typeArg: string,
  args: UpdateFeesArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::liquid_staking::update_fees`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.adminCap),
      obj(tx, args.feeConfig),
    ],
  });
}
