#[test_only]
module liquid_staking::liquid_staking_tests {
    // uncomment this line to import the module
    // use liquid_staking::liquid_staking;
    use sui::test_scenario::{Self, Scenario};
    use sui_system::sui_system::SuiSystemState;
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

    // fun stake_

    #[test]
    fun test_liquid_staking() {
        let addr = @0x0;
        let mut scenario = test_scenario::begin(addr);

        let validators = create_validators_with_stakes(vector[100, 100], scenario.ctx());
        create_sui_system_state_for_testing(validators, 0, 0, scenario.ctx());

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 0, &mut scenario);
        advance_epoch_with_reward_amounts(0, 10, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let validator_set = system_state.validators();

        let active_validators = validator_set.active_validators();

        let mut i = 0;
        while (i < active_validators.length()) {
            std::debug::print(&active_validators[i].total_stake_amount());
            std::debug::print(&active_validators[i].voting_power());

            i = i + 1;
        };

        test_scenario::return_shared(system_state);
        
        scenario.end();
        // pass
    }

}
