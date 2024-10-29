import { PUBLISHED_AT } from "..";
import { obj } from "../../_framework/util";
import { Transaction, TransactionObjectInput } from "@mysten/sui/transactions";

export function new_(
  tx: Transaction,
  typeArg: string,
  adminCap: TransactionObjectInput,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::new`,
    typeArguments: [typeArg],
    arguments: [obj(tx, adminCap)],
  });
}

export interface EjectArgs {
  self: TransactionObjectInput;
  adminCap: TransactionObjectInput;
}

export function eject(tx: Transaction, typeArg: string, args: EjectArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::eject`,
    typeArguments: [typeArg],
    arguments: [obj(tx, args.self), obj(tx, args.adminCap)],
  });
}

export interface RebalanceArgs {
  self: TransactionObjectInput;
  systemState: TransactionObjectInput;
  liquidStakingInfo: TransactionObjectInput;
}

export function rebalance(
  tx: Transaction,
  typeArg: string,
  args: RebalanceArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::rebalance`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.systemState),
      obj(tx, args.liquidStakingInfo),
    ],
  });
}

export interface SetValidatorAddressesAndWeightsArgs {
  self: TransactionObjectInput;
  weightHookAdminCap: TransactionObjectInput;
  validatorAddressesAndWeights: TransactionObjectInput;
}

export function setValidatorAddressesAndWeights(
  tx: Transaction,
  typeArg: string,
  args: SetValidatorAddressesAndWeightsArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::weight::set_validator_addresses_and_weights`,
    typeArguments: [typeArg],
    arguments: [
      obj(tx, args.self),
      obj(tx, args.weightHookAdminCap),
      obj(tx, args.validatorAddressesAndWeights),
    ],
  });
}
