import { PUBLISHED_AT } from "..";
import { obj, pure } from "../../_framework/util";
import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export function new_(tx: Transaction, version: number | TransactionArgument) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::version::new`,
    arguments: [pure(tx, version, `u16`)],
  });
}

export interface AssertVersionArgs {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function assertVersion(tx: Transaction, args: AssertVersionArgs) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::version::assert_version`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}

export interface AssertVersionAndUpgradeArgs {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function assertVersionAndUpgrade(
  tx: Transaction,
  args: AssertVersionAndUpgradeArgs,
) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::version::assert_version_and_upgrade`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}

export interface Migrate_Args {
  version: TransactionObjectInput;
  currentVersion: number | TransactionArgument;
}

export function migrate_(tx: Transaction, args: Migrate_Args) {
  return tx.moveCall({
    target: `${PUBLISHED_AT}::version::migrate_`,
    arguments: [obj(tx, args.version), pure(tx, args.currentVersion, `u16`)],
  });
}
