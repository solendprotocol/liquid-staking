import * as cell from "./cell/structs";
import * as events from "./events/structs";
import * as fees from "./fees/structs";
import * as liquidStaking from "./liquid-staking/structs";
import * as storage from "./storage/structs";
import * as version from "./version/structs";
import { StructClassLoader } from "../_framework/loader";

export function registerClasses(loader: StructClassLoader) {
  loader.register(cell.Cell);
  loader.register(events.Event);
  loader.register(fees.FeeConfig);
  loader.register(fees.FeeConfigBuilder);
  loader.register(version.Version);
  loader.register(storage.Storage);
  loader.register(storage.ValidatorInfo);
  loader.register(liquidStaking.AdminCap);
  loader.register(liquidStaking.CollectFeesEvent);
  loader.register(liquidStaking.DecreaseValidatorStakeEvent);
  loader.register(liquidStaking.EpochChangedEvent);
  loader.register(liquidStaking.IncreaseValidatorStakeEvent);
  loader.register(liquidStaking.LiquidStakingInfo);
  loader.register(liquidStaking.MintEvent);
  loader.register(liquidStaking.RedeemEvent);
}
