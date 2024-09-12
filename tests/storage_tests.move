#[test_only]
module liquid_staking::storage_tests {
    /* Tests */
    use sui::test_scenario::{Self, Scenario};
    use sui_system::governance_test_utils::{
        advance_epoch_with_reward_amounts,
    };
    use sui::address;
    use sui::coin::{Self};
    use sui_system::staking_pool::{StakedSui};
    use sui_system::sui_system::{SuiSystemState};
    use sui::balance::{Self};
    use liquid_staking::storage::{new};
    use sui::sui::SUI;

    #[test_only]
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

    const MIST_PER_SUI: u64 = 1_000_000_000;

    fun stake_with(validator_index: u64, amount: u64, scenario: &mut Scenario): StakedSui {
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

    #[test]
    public fun test_refresh() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let mut storage = new(scenario.ctx());

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        storage.refresh(&mut system_state, scenario.ctx());
        test_scenario::return_shared(system_state);

        // check state
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.last_refresh_epoch() == scenario.ctx().epoch(), 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 100 * MIST_PER_SUI, 0);

        // stake now looks like [200, 100] => [300, 200]
        advance_epoch_with_reward_amounts(0, 200, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        assert!(storage.refresh(&mut system_state, scenario.ctx()), 0);
        test_scenario::return_shared(system_state);

        // inactive stake should have been converted to active stake
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.last_refresh_epoch() == scenario.ctx().epoch(), 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 150 * MIST_PER_SUI, 0);

        // stake now looks like [300, 200] => [450, 300]
        advance_epoch_with_reward_amounts(0,300, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        assert!(storage.refresh(&mut system_state, scenario.ctx()), 0);

        assert!(storage.total_sui_supply() == 150 * MIST_PER_SUI, 0);
        assert!(storage.last_refresh_epoch() == scenario.ctx().epoch(), 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.validators()[0].total_sui_amount() == 150 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 450 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 150 * MIST_PER_SUI, 0);

        // check idempotency
        assert!(!storage.refresh(&mut system_state, scenario.ctx()), 0);
        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(storage);
        scenario.end();
    }

    #[test]
    fun test_refresh_prune_empty_validator_infos() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui = stake_with(0, 50, &mut scenario);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());

        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 50 * MIST_PER_SUI, 0);

        // Withdraw the stake before refresh
        let unstaked_sui = storage.unstake_approx_n_sui_from_validator(
            &mut system_state,
            0,  
            100 * MIST_PER_SUI,  
            scenario.ctx()
        );

        assert!(unstaked_sui == 50 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        test_scenario::return_shared(system_state);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        assert!(storage.refresh(&mut system_state, scenario.ctx()), 0);

        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 0, 0);  // Validator should be removed as it's empty

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        scenario.end();
    }

    #[test] 
    fun test_join_to_sui_pool() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);
        let mut storage = new(scenario.ctx());

        scenario.next_tx(@0x0);

        assert!(storage.total_sui_supply() == 0, 0);
        assert!(storage.sui_pool().value() == 0, 0);

        let sui = balance::create_for_testing<SUI>(50 * MIST_PER_SUI);
        storage.join_to_sui_pool(sui);

        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 50 * MIST_PER_SUI, 0);

        sui::test_utils::destroy(storage);
        scenario.end();
    }

    /* Join Stake tests */

    #[test]
    fun test_join_stake_active() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 50, &mut scenario);
        let active_staked_sui_2 = stake_with(0, 50, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);


        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());

        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 400 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 200 * MIST_PER_SUI, 0);

        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 400 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 200 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }

    #[test]
    fun test_join_stake_inactive() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let mut staked_sui_1 = stake_with(0, 100, &mut scenario);
        let staked_sui_2 = staked_sui_1.split(50 * MIST_PER_SUI, scenario.ctx());

        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());

        assert!(storage.last_refresh_epoch() == scenario.ctx().epoch(), 0);
        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.validators()[0].total_sui_amount() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 100 * MIST_PER_SUI, 0);

        storage.join_stake(&mut system_state, staked_sui_2, scenario.ctx());

        assert!(storage.last_refresh_epoch() == scenario.ctx().epoch(), 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 100 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }


    #[test]
    fun test_join_stake_multiple_validators() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 100, &mut scenario);
        let active_staked_sui_2 = stake_with(1, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);


        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.validators().length() == 2, 0);
        assert!(storage.total_sui_supply() == 500 * MIST_PER_SUI, 0);

        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().sui_amount() == 400 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].exchange_rate().pool_token_amount() == 200 * MIST_PER_SUI, 0);

        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].inactive_stake().is_none(), 0);
        assert!(storage.validators()[1].exchange_rate().sui_amount() == 400 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].exchange_rate().pool_token_amount() == 200 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }

    #[test]
    fun test_split_up_to_n_sui_from_sui_pool() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);
        let mut storage = new(scenario.ctx());

        scenario.next_tx(@0x0);

        assert!(storage.total_sui_supply() == 0, 0);

        let sui = balance::create_for_testing<SUI>(50 * MIST_PER_SUI);
        storage.join_to_sui_pool(sui);

        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);

        let sui = storage.split_up_to_n_sui_from_sui_pool(25 * MIST_PER_SUI);
        assert!(storage.total_sui_supply() == 25 * MIST_PER_SUI, 0);
        assert!(sui.value() == 25 * MIST_PER_SUI, 0);
        sui::test_utils::destroy(sui);

        let sui = storage.split_up_to_n_sui_from_sui_pool(50 * MIST_PER_SUI);
        assert!(storage.total_sui_supply() == 0 * MIST_PER_SUI, 0);
        assert!(sui.value() == 25 * MIST_PER_SUI, 0);
        sui::test_utils::destroy(sui);

        sui::test_utils::destroy(storage);

        scenario.end();
    }

    /* Unstake Approx Inactive Stake Tests */

    #[test]
    fun test_unstake_approx_n_sui_from_inactive_stake_take_nothing() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut storage = new(scenario.ctx());
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            0, 
            scenario.ctx()
        );

        assert!(amount == 0, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(
            storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 100 * MIST_PER_SUI, 
            0
        );

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_inactive_stake_take_all() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut storage = new(scenario.ctx());
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            101 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(amount  == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_inactive_stake_take_partial() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut storage = new(scenario.ctx());
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            50 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(amount  == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(
            storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 50 * MIST_PER_SUI, 
            0
        );

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_inactive_stake_take_dust() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut storage = new(scenario.ctx());
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            1, 
            scenario.ctx()
        );

        assert!(amount  == MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 99 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(
            storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 99 * MIST_PER_SUI, 
            0
        );

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_inactive_stake_leave_dust() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let mut storage = new(scenario.ctx());
        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            99 * MIST_PER_SUI + 1,
            scenario.ctx()
        );

        assert!(amount == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    /* Unstake Approx Active Stake Tests */

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_take_nothing() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            0, 
            scenario.ctx()
        );

        assert!(amount == 0, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_take_all() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            200 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(amount == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_take_partial() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            100 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(amount == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 50 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_take_dust() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(amount == 2 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 2 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 198 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 99_000_000_000, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_leave_dust() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            199 * MIST_PER_SUI + 1, 
            scenario.ctx()
        );

        assert!(amount == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_active_stake_ceil() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new(scenario.ctx());

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            2 * MIST_PER_SUI + 1, 
            scenario.ctx()
        );

        assert!(amount == 2 * MIST_PER_SUI + 2, 0);
        assert!(storage.validators().length() == 1, 0);
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 2 * MIST_PER_SUI + 2, 0);
        assert!(storage.validators()[0].total_sui_amount() == 198 * MIST_PER_SUI - 2, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 99_000_000_000 - 1, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);

        sui::test_utils::destroy(storage);
        test_scenario::return_shared(system_state);
        scenario.end();
    }

    /* split up to n sui tests */

    #[test]
    fun test_split_up_to_n_sui_only_from_sui_pool() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 100, &mut scenario);
        let active_staked_sui_2 = stake_with(1, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);


        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_to_sui_pool(balance::create_for_testing(100 * MIST_PER_SUI));
        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.total_sui_supply() == 600 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        // start of test
        let sui = storage.split_n_sui(
            &mut system_state,
            100 * MIST_PER_SUI,
            scenario.ctx()
        );

        assert!(sui.value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 500 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        sui::test_utils::destroy(sui);
        
        scenario.end();
    }

    #[test]
    fun test_split_up_to_n_sui_take_from_inactive_stake() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 100, &mut scenario);
        let active_staked_sui_2 = stake_with(1, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);


        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_to_sui_pool(balance::create_for_testing(100 * MIST_PER_SUI));
        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.total_sui_supply() == 600 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        // start of test
        let sui = storage.split_n_sui(
            &mut system_state,
            200 * MIST_PER_SUI,
            scenario.ctx()
        );

        assert!(sui.value() == 200 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 400 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        sui::test_utils::destroy(sui);
        
        scenario.end();
    }

    #[test]
    fun test_split_up_to_n_sui_take_all() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 100, &mut scenario);
        let active_staked_sui_2 = stake_with(1, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_to_sui_pool(balance::create_for_testing(100 * MIST_PER_SUI));
        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.total_sui_supply() == 600 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        // start of test
        let sui = storage.split_n_sui(
            &mut system_state,
            600 * MIST_PER_SUI,
            scenario.ctx()
        );

        assert!(sui.value() == 600 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 0, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);
        assert!(storage.validators()[1].inactive_stake().is_none(), 0);
        assert!(storage.validators()[1].active_stake().is_none(), 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        sui::test_utils::destroy(sui);
        
        scenario.end();
    }

    #[test]
    fun test_split_up_to_n_sui_take_nothing() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui_1 = stake_with(0, 100, &mut scenario);
        let active_staked_sui_2 = stake_with(1, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_to_sui_pool(balance::create_for_testing(100 * MIST_PER_SUI));
        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_1, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui_2, scenario.ctx());

        assert!(storage.total_sui_supply() == 600 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[1].total_sui_amount() == 200 * MIST_PER_SUI, 0);

        // start of test
        let sui = storage.split_n_sui(
            &mut system_state,
            0,
            scenario.ctx()
        );

        assert!(sui.value() == 0, 0);
        assert!(storage.total_sui_supply() == 600 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        sui::test_utils::destroy(sui);
        
        scenario.end();
    }

    /* unstake approx n sui from validator tests */

    #[test]
    fun test_unstake_approx_n_sui_from_validator_take_from_inactive_stake() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui = stake_with(0, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui, scenario.ctx());

        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_validator(
            &mut system_state,
            0,
            100 * MIST_PER_SUI,
            scenario.ctx()
        );

        assert!(amount == 100 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 200 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_validator_take_all() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui = stake_with(0, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui, scenario.ctx());

        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_validator(
            &mut system_state,
            0,
            300 * MIST_PER_SUI,
            scenario.ctx()
        );

        assert!(amount == 300 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 0, 0);
        assert!(storage.validators()[0].inactive_stake().is_none(), 0);
        assert!(storage.validators()[0].active_stake().is_none(), 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }

    #[test]
    fun test_unstake_approx_n_sui_from_validator_take_nothing() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let active_staked_sui = stake_with(0, 100, &mut scenario);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        // stake now looks like [200, 200] => [400, 400]
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        let staked_sui = stake_with(0, 100, &mut scenario);
        scenario.next_tx(@0x0);

        let mut storage = new(scenario.ctx());
        assert!(storage.total_sui_supply() == 0, 0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui, scenario.ctx());
        storage.join_stake(&mut system_state, active_staked_sui, scenario.ctx());

        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);

        let amount = storage.unstake_approx_n_sui_from_validator(
            &mut system_state,
            0,
            0,
            scenario.ctx()
        );

        assert!(amount == 0, 0);
        assert!(storage.total_sui_supply() == 300 * MIST_PER_SUI, 0);
        assert!(storage.sui_pool().value() == 0, 0);
        assert!(storage.validators()[0].total_sui_amount() == 300 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 100 * MIST_PER_SUI, 0);
        assert!(storage.validators()[0].active_stake().borrow().value() == 100 * MIST_PER_SUI, 0);

        test_scenario::return_shared(system_state);
        sui::test_utils::destroy(storage);
        
        scenario.end();
    }
}