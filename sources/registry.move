module liquid_staking::registry {
    use sui::table::{Self, Table};
    use sui::object::{Self, ID, UID};
    use std::type_name::{Self, TypeName};
    use sui::tx_context::{TxContext};
    use sui::transfer::{Self};
    use sui::dynamic_field::{Self};

    use liquid_staking::liquid_staking::{Self, LiquidStakingInfo, AdminCap, FeeConfig};

    // === Errors ===
    const EIncorrectVersion: u64 = 1;

    // === Constants ===
    const CURRENT_VERSION: u64 = 1;

    public struct Registry has key {
        id: UID,
        version: u64,
        liquid_staking_infos: Table<TypeName, ID>
    }

    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            version: CURRENT_VERSION,
            liquid_staking_infos: table::new(ctx)
        };

        transfer::share_object(registry);
    }

    #[test_only]
    public fun create_for_testing(ctx: &mut TxContext): Registry {
        Registry {
            id: object::new(ctx),
            version: CURRENT_VERSION,
            liquid_staking_infos: table::new(ctx)
        }
    }

    public fun create_lst<P: drop>(
        self: &mut Registry, 
        fee_config: FeeConfig, 
        ctx: &mut TxContext
    ): (
        AdminCap<P>,
        LiquidStakingInfo<P>
    ) {
        assert!(self.version == CURRENT_VERSION, EIncorrectVersion);

        let (admin_cap, liquid_staking_info) = liquid_staking::create_lst<P>(fee_config, ctx);
        table::add(&mut self.liquid_staking_infos, type_name::get<P>(), object::id(&liquid_staking_info));

        (admin_cap, liquid_staking_info)
    }
}
