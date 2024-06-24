#[test_only]
module liquid_staking::liquid_staking_tests {
    // uncomment this line to import the module
    // use liquid_staking::liquid_staking;
    use sui::test_scenario::{Self, Scenario};
    use sui_system::sui_system::SuiSystemState;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use liquid_staking::liquid_staking::{Self, LiquidStakingInfo, LST};
    use liquid_staking::registry::{Self};
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

    fun setup_sui_system(scenario: &mut Scenario, stakes: vector<u64>) {
        use sui_system::governance_test_utils::{
            create_validators_with_stakes,
            create_sui_system_state_for_testing,
            // stake_with,
            // remove_validator,
            // remove_validator_candidate,
            // total_sui_balance,
            // unstake,
        };

        let validators = create_validators_with_stakes(stakes, scenario.ctx());
        create_sui_system_state_for_testing(validators, 0, 0, scenario.ctx());

        advance_epoch_with_reward_amounts(0, 0, scenario);
    }

     public struct TEST has drop {}

    #[test]
    fun test_mint_and_redeem() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());

        let mut registry = registry::create_for_testing(scenario.ctx());

        let (admin_cap, mut lst_info) = registry.create_lst<TEST>(
            liquid_staking::create_fee_config(100, 0, 100, 0, 0),
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
        sui::test_utils::destroy(registry);

        scenario.end();
    }

    #[test]
    fun test_increase_and_decrease_validator_stake() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[10, 10]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());

        let mut registry = registry::create_for_testing(scenario.ctx());

        let (admin_cap, mut lst_info) = registry.create_lst<TEST>(
            liquid_staking::create_fee_config(100, 0, 100, 0, 0),
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
            lst_info.storage().validators()[1].active_stake().borrow().fungible_stake_value() == 10 * MIST_PER_SUI, 
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
        sui::test_utils::destroy(registry);

        scenario.end();
    }

    #[test]
    fun test_spread_fee() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut registry = registry::create_for_testing(scenario.ctx());

        let (admin_cap, mut lst_info) = registry.create_lst<TEST>(
            liquid_staking::create_fee_config(0, 0, 0, 0, 1000), // 10% spread fee
            scenario.ctx()
        );

        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());
        let lst = lst_info.mint(&mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 100 * MIST_PER_SUI, 0);

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x0,
            50 * MIST_PER_SUI, 
            scenario.ctx()
        );
        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x1,
            50 * MIST_PER_SUI, 
            scenario.ctx()
        );

        test_scenario::return_shared(system_state);

        scenario.next_tx(@0x0);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        // got 100 SUI of rewards, 10 of that should be spread fee
        advance_epoch_with_reward_amounts(0, 300, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = lst_info.redeem(
            lst,
            &mut system_state, 
            scenario.ctx()
        );

        assert!(sui.value() == 190 * MIST_PER_SUI, 0);
        assert!(lst_info.storage().total_sui_supply() == 10 * MIST_PER_SUI, 0);
        assert!(lst_info.total_sui_supply() == 0, 0);
        assert!(lst_info.accrued_spread_fees() == 10 * MIST_PER_SUI, 0);

        let fees = lst_info.collect_fees(&mut system_state, &admin_cap, scenario.ctx());
        assert!(fees.value() == 10 * MIST_PER_SUI, 0);
        assert!(lst_info.accrued_spread_fees() == 0, 0);
        assert!(lst_info.storage().total_sui_supply() == 0, 0);

        std::debug::print(&lst_info);

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(fees);
        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);
        sui::test_utils::destroy(registry);

        scenario.end();
    }

}
