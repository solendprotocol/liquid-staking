module liquid_staking::registry {
    use sui::table::{Self, Table};
    use std::type_name::{Self, TypeName};
    use sui::dynamic_field::{Self};

    use liquid_staking::liquid_staking::{Self, LiquidStakingInfo, AdminCap};
    use liquid_staking::fees::{Self, FeeConfig};

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

    #[test_only] public struct LST_1 has drop {}
    #[test_only] public struct LST_2 has drop {}

    #[test]
    fun test_happy() {
        use sui::test_utils::{Self};
        use sui::test_scenario::{Self};

        let owner = @0x26;
        let mut scenario = test_scenario::begin(owner);

        init(scenario.ctx());
        scenario.next_tx(owner);

        let mut registry = test_scenario::take_shared<Registry>(&scenario);

        let (admin_cap_1, liquid_staking_info_1) = create_lst<LST_1>(
            &mut registry, 
            fees::new_builder(scenario.ctx()).to_fee_config(),
            test_scenario::ctx(&mut scenario)
        );
        
        let (admin_cap_2, liquid_staking_info_2) = create_lst<LST_2>(
            &mut registry, 
            fees::new_builder(scenario.ctx()).to_fee_config(),
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);
        test_utils::destroy(admin_cap_1);
        test_utils::destroy(admin_cap_2);
        test_utils::destroy(liquid_staking_info_1);
        test_utils::destroy(liquid_staking_info_2);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0, location = dynamic_field)]
    fun test_fail_duplicate_lending_market_type() {
        use sui::test_utils::{Self};
        use sui::test_scenario::{Self};

        let owner = @0x26;
        let mut scenario = test_scenario::begin(owner);

        init(scenario.ctx());
        scenario.next_tx(owner);

        let mut registry = test_scenario::take_shared<Registry>(&scenario);
        let (admin_cap_1, liquid_staking_info_1) = create_lst<LST_1>(
            &mut registry, 
            fees::new_builder(scenario.ctx()).to_fee_config(),
            scenario.ctx()
        );
        
        let (admin_cap_2, liquid_staking_info_2) = create_lst<LST_1>(
            &mut registry, 
            fees::new_builder(scenario.ctx()).to_fee_config(),
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::return_shared(registry);
        test_utils::destroy(admin_cap_1);
        test_utils::destroy(admin_cap_2);
        test_utils::destroy(liquid_staking_info_1);
        test_utils::destroy(liquid_staking_info_2);
        test_scenario::end(scenario);
    }

}
