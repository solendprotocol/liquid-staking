#[test_only]
module liquid_staking::liquid_staking_tests {
    // uncomment this line to import the module
    // use liquid_staking::liquid_staking;
    use sui::address;
    use sui_system::staking_pool::StakedSui;
    use sui::test_scenario::{Self, Scenario};
    use sui_system::sui_system::SuiSystemState;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use liquid_staking::liquid_staking::{Self, create_lst, LiquidStakingInfo};
    use liquid_staking::fees::{Self};
    use sui_system::governance_test_utils::{
        // Self,
        // add_validator,
        // add_validator_candidate,
        // advance_epoch,
        advance_epoch_with_reward_amounts,
        create_validators_with_stakes,
        create_sui_system_state_for_testing,
        // stake_with,
        // remove_validator,
        // remove_validator_candidate,
        // total_sui_balance,
        // unstake,
    };

    /* Constants */
    const MIST_PER_SUI: u64 = 1_000_000_000;

    #[test_only]
    public fun stake_with(validator_index: u64, amount: u64, scenario: &mut Scenario): StakedSui {
        use sui_system::governance_test_utils::{
            stake_with,
        };
        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let ctx = scenario.ctx();

        let staked_sui = system_state.request_add_stake_non_entry(
            coin::mint_for_testing(amount * MIST_PER_SUI, ctx), 
            address::from_u256(validator_index as u256), 
            ctx
        );

        test_scenario::return_shared(system_state);
        scenario.next_tx(@0x0);

        staked_sui
    }

    fun setup_sui_system(scenario: &mut Scenario, stakes: vector<u64>) {
        let validators = create_validators_with_stakes(stakes, scenario.ctx());
        create_sui_system_state_for_testing(validators, 0, 0, scenario.ctx());

        advance_epoch_with_reward_amounts(0, 0, scenario);
    }

     public struct TEST has drop {}

     #[test]
     fun test_create_lst_happy_1() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let (admin_cap, lst_info) = create_lst<TEST>(
            &mut system_state,
            fees::new_builder(scenario.ctx())
                .set_sui_mint_fee_bps(100)
                .set_redeem_fee_bps(100)
                .to_fee_config(),
            coin::create_treasury_cap_for_testing(scenario.ctx()),
            vector::empty(),
            scenario.ctx()
        );

        assert!(lst_info.total_lst_supply() == 0, 0);
        assert!(lst_info.storage().total_sui_supply() == 0, 0);

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
     }

    #[test]
    fun test_create_lst_happy_2() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        // Create a treasury cap with non-zero coins
        let mut treasury_cap = coin::create_treasury_cap_for_testing(scenario.ctx());
        let coins = treasury_cap.mint(1000 * MIST_PER_SUI, scenario.ctx());

        let (admin_cap, lst_info) = create_lst<TEST>(
            &mut system_state,
            fees::new_builder(scenario.ctx())
                .set_sui_mint_fee_bps(100)
                .set_redeem_fee_bps(100)
                .to_fee_config(),
            treasury_cap,
            vector[staked_sui],
            scenario.ctx()
        );

        assert!(lst_info.total_lst_supply() == 1000 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 100 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);
        sui::test_utils::destroy( coins);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_create_lst_fail_1() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);
        let staked_sui = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        // Create an empty treasury cap
        let treasury_cap = coin::create_treasury_cap_for_testing(scenario.ctx());

        let (admin_cap, lst_info) = create_lst<TEST>(
                &mut system_state,
                fees::new_builder(scenario.ctx())
                    .set_sui_mint_fee_bps(100)
                    .set_redeem_fee_bps(100)
                    .to_fee_config(),
                treasury_cap,
                vector[staked_sui],
            scenario.ctx()
        );

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_create_lst_fail_2() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut treasury_cap = coin::create_treasury_cap_for_testing(scenario.ctx());
        let coins = treasury_cap.mint(1000 * MIST_PER_SUI, scenario.ctx());

        let (admin_cap, lst_info) = create_lst<TEST>(
                &mut system_state,
                fees::new_builder(scenario.ctx())
                    .set_sui_mint_fee_bps(100)
                    .set_redeem_fee_bps(100)
                    .to_fee_config(),
                treasury_cap,
                vector::empty(),
            scenario.ctx()
        );

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);
        sui::test_utils::destroy(coins);

        scenario.end();
    }

    #[test]
    fun test_mint_and_redeem() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());

        let (admin_cap, mut lst_info) = create_lst<TEST>(
            &mut system_state,
            fees::new_builder(scenario.ctx())
                .set_sui_mint_fee_bps(100)
                .set_redeem_fee_bps(100)
                .to_fee_config(),
            coin::create_treasury_cap_for_testing(scenario.ctx()),
            vector::empty(),
            scenario.ctx()
        );

        let lst = lst_info.mint(&mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.fees() == 1 * MIST_PER_SUI, 0);
        sui::test_utils::destroy(lst);

        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());
        let mut lst = lst_info.mint(&mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.total_lst_supply() == 198 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 198 * MIST_PER_SUI, 0);
        assert!(lst_info.fees() == 2 * MIST_PER_SUI, 0);


        let sui = lst_info.redeem(
            lst.split(10 * MIST_PER_SUI, scenario.ctx()), 
            &mut system_state, 
            scenario.ctx()
        );

        assert!(sui.value() ==  9_900_000_000, 0);
        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(lst);

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
    }

    #[test]
    fun test_increase_and_decrease_validator_stake() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[10, 10]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());

        let (admin_cap, mut lst_info) = create_lst<TEST>(
            &mut system_state,
            fees::new_builder(scenario.ctx())
                .set_sui_mint_fee_bps(100)
                .set_redeem_fee_bps(100)
                .to_fee_config(),
            coin::create_treasury_cap_for_testing(scenario.ctx()),
            vector::empty(),
            scenario.ctx()
        );

        let lst = lst_info.mint(&mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.fees() == 1 * MIST_PER_SUI, 0);

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x0,
            20 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage().validators()[0].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
            0
        );

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x1,
            20 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage().validators()[1].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
            0
        );

        test_scenario::return_shared(system_state);

        scenario.next_tx(@0x0);
        advance_epoch_with_reward_amounts(0, 20, &mut scenario);


        scenario.next_tx(@0x0);
        let mut system_state = scenario.take_shared<SuiSystemState>();

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x1,
            20 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage().validators()[1].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
            0
        );
        assert!(
            lst_info.storage().validators()[1].active_stake().borrow().value() == 10 * MIST_PER_SUI, 
            0
        );

        lst_info.decrease_validator_stake(
            &admin_cap, 
            &mut system_state, 
            1,
            40 * MIST_PER_SUI, 
            scenario.ctx()
        );

        std::debug::print(&lst_info);

        assert!(lst_info.total_lst_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage().validators()[1].inactive_stake().is_none(),
            0
        );
        assert!(
            lst_info.storage().validators()[1].active_stake().is_none(),
            0
        );

        sui::test_utils::destroy(lst);
        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
    }

    #[test]
    fun test_spread_fee() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[90, 90]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let (admin_cap, mut lst_info) = create_lst<TEST>(
            &mut system_state,
            fees::new_builder(scenario.ctx())
                .set_spread_fee_bps(5000) // 50%
                .set_sui_mint_fee_bps(1000) // 10%
                .to_fee_config(),
            coin::create_treasury_cap_for_testing(scenario.ctx()),
            vector::empty(),
            scenario.ctx()
        );

        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());
        let lst = lst_info.mint(&mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 90 * MIST_PER_SUI, 0);

        std::debug::print(&lst_info);
        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x0,
            45 * MIST_PER_SUI, 
            scenario.ctx()
        );
        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x1,
            45 * MIST_PER_SUI, 
            scenario.ctx()
        );

        test_scenario::return_shared(system_state);

        scenario.next_tx(@0x0);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        // got 90 SUI of rewards, 45 of that should be spread fee
        advance_epoch_with_reward_amounts(0, 270, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = lst_info.redeem(
            lst,
            &mut system_state, 
            scenario.ctx()
        );

        assert!(sui.value() == 135 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 45 * MIST_PER_SUI, 0);
        assert!(lst_info.total_sui_supply() == 0, 0);
        assert!(lst_info.accrued_spread_fees() == 45 * MIST_PER_SUI, 0);

        let fees = lst_info.collect_fees(&mut system_state, &admin_cap, scenario.ctx());
        assert!(fees.value() == 55 * MIST_PER_SUI, 0); // 45 in spread, 10 in mint
        assert!(lst_info.accrued_spread_fees() == 0, 0);
        assert!(lst_info.storage().total_sui_supply() == 0, 0);

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(fees);
        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
    }

}
