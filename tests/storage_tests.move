#[test_only]
module liquid_staking::storage_tests {
    #[test_only] use sui::test_scenario::{Self, Scenario};
    #[test_only]
    use sui_system::governance_test_utils::{
        advance_epoch_with_reward_amounts,
    };
    use sui::address;
    use sui::sui::SUI;
    use sui::coin::{Self};
    use sui::balance::{Self, Balance};
    use sui_system::sui_system::{SuiSystemState};
    use sui_system::staking_pool::{StakedSui, FungibleStake, PoolTokenExchangeRate};
    use liquid_staking::storage::{Self, Storage};

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

    #[test_only] const MIST_PER_SUI: u64 = 1_000_000_000;

    #[test_only]
    public fun stake_with(validator_index: u64, amount: u64, scenario: &mut Scenario): StakedSui {
        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let ctx = scenario.ctx();

        let staked_sui = system_state.request_add_stake_non_entry(
            coin::mint_for_testing(amount * MIST_PER_SUI, ctx), 
            address::from_u256(validator_index as u256), 
            ctx
        );

        test_scenario::return_shared(system_state);

        staked_sui
    }

    #[test]
    fun test_basic() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        let staked_sui_2 = stake_with(0, 200, &mut scenario);

        let mut storage = storage::new();

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        assert!(storage.total_sui_supply() == 0, 0);

        let sui = balance::create_for_testing<SUI>(50 * MIST_PER_SUI);
        storage.join_to_sui_pool(sui);

        assert!(storage.total_sui_supply() == 50 * MIST_PER_SUI, 0);

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        test_scenario::return_shared(system_state);

        assert!(storage.total_sui_supply() == 150 * MIST_PER_SUI, 0);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_2, scenario.ctx());
        test_scenario::return_shared(system_state);

        assert!(storage.total_sui_supply() == 350 * MIST_PER_SUI, 0);

        advance_epoch_with_reward_amounts(0, 800, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        storage.refresh(&mut system_state, scenario.ctx());

        assert!(storage.total_sui_supply() == 650 * MIST_PER_SUI, 0);

        let unstaked_sui = storage.split_from_active_stake(&mut system_state, 0, 150 * MIST_PER_SUI, scenario.ctx());
        assert!(storage.total_sui_supply() == 350 * MIST_PER_SUI, 0);
        assert!(unstaked_sui.value() == 300 * MIST_PER_SUI, 0);

        sui::test_utils::destroy(unstaked_sui);

        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(storage);

        scenario.end();
    }

    #[test]
    fun test_split_inactive_stake_take_all() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut storage = new();
        assert!(storage.total_sui_supply() == 0, 0);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());

        let sui = storage.split_up_to_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            101 * MIST_PER_SUI, 
            scenario.ctx()
        );
        assert!(sui.value() == 100 * MIST_PER_SUI, 0);

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(storage);

        test_scenario::return_shared(system_state);

        scenario.end();
    }

    #[test]
    fun test_split_inactive_stake_take_partial() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);

        let mut storage = new();
        assert!(storage.total_sui_supply() == 0, 0);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());

        let sui = storage.split_up_to_n_sui_from_inactive_stake(
            &mut system_state, 
            0, 
            50 * MIST_PER_SUI, 
            scenario.ctx()
        );
        assert!(sui.value() == 50 * MIST_PER_SUI, 0);

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(storage);

        test_scenario::return_shared(system_state);

        scenario.end();
    }

    #[test]
    fun test_split_active_stake_take_partial() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        // validator 0 gets 400 sui in rewards, so our staked_sui object is now worth 200 SUI
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new();

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let sui = storage.split_up_to_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            100 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(sui.value() == 100 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 100 * MIST_PER_SUI, 0);

        assert!(
            storage.validators()[0].active_stake.borrow().fungible_stake_value() == 50 * MIST_PER_SUI, 
            0
        );

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(storage);

        test_scenario::return_shared(system_state);

        scenario.end();
    }

    #[test]
    fun test_split_active_stake_take_full() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        // validator 0 gets 400 sui in rewards, so our staked_sui object is now worth 200 SUI
        advance_epoch_with_reward_amounts(0, 400, &mut scenario);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let mut storage = new();

        storage.refresh(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        assert!(storage.total_sui_supply() == 200 * MIST_PER_SUI, 0);

        let sui = storage.split_up_to_n_sui_from_active_stake(
            &mut system_state, 
            0, 
            300 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(sui.value() == 200 * MIST_PER_SUI, 0);
        assert!(storage.total_sui_supply() == 0, 0);

        assert!(
            storage.validators()[0].active_stake.is_none(),
            0
        );

        sui::test_utils::destroy(sui);
        sui::test_utils::destroy(storage);

        test_scenario::return_shared(system_state);

        scenario.end();
    }
}
