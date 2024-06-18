module liquid_staking::storage {
    use sui_system::staking_pool::{StakedSui, FungibleStake, PoolTokenExchangeRate};
    use sui::address;
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self};
    use sui_system::sui_system::{SuiSystemState};
    use sui::math::min;

    /* Errors */
    const EInvariantViolation: u64 = 0;

    public struct Storage has store {
        sui_pool: Balance<SUI>,
        validator_infos: vector<ValidatorInfo>,

        // sum of all active and inactive stake
        total_sui_supply: u64,
        last_refresh_epoch: u64,
    }

    public struct ValidatorInfo has store {
        staking_pool_id: ID,

        active_stake: Option<FungibleStake>,
        inactive_stake: Option<StakedSui>,

        exchange_rate: PoolTokenExchangeRate,

        // sum of active and inactive stake (principal and rewards)
        total_sui_amount: u64
    }

    public(package) fun new(): Storage {
        Storage {
            sui_pool: balance::zero(),
            validator_infos: vector::empty(),
            total_sui_supply: 0,
            last_refresh_epoch: 0,
        }
    }

    /* Public View Functions */
    public(package) fun total_sui_supply(self: &Storage): u64 {
        self.total_sui_supply
    }

    public(package) fun validators(self: &Storage): &vector<ValidatorInfo> {
        &self.validator_infos
    }

    /* Public Mutative Functions */
    /// update the total sui supply value when the epoch changes
    public(package) fun refresh_storage(
        self: &mut Storage, 
        system_state: &mut SuiSystemState, 
        ctx: &mut TxContext
    ) {

        if (self.last_refresh_epoch == ctx.epoch()) {
            return
        };

        let mut i = 0;
        while (i < self.validator_infos.length()) {
            let validator_info = &mut self.validator_infos[i];

            let exchange_rates = system_state.pool_exchange_rates(&validator_info.staking_pool_id);
            let latest_exchange_rate = exchange_rates.borrow(ctx.epoch());

            validator_info.exchange_rate = *latest_exchange_rate;

            // join inactive stake to active stake if the activation epoch is reached
            if (validator_info.inactive_stake.is_some() && 
                validator_info.inactive_stake.borrow().stake_activation_epoch() <= ctx.epoch())
            {
                let inactive_stake = validator_info.inactive_stake.extract();
                let fungible_stake = system_state.convert_to_fungible_stake(inactive_stake, ctx);

                if (validator_info.active_stake.is_some()) {
                    validator_info.active_stake.borrow_mut().join_fungible_stake(fungible_stake);

                } else {
                    validator_info.active_stake.fill(fungible_stake);
                };
            };

            refresh_validator_info(self, i);
            i = i + 1;
        };

        self.last_refresh_epoch = ctx.epoch();
    }

    public(package) fun join_to_sui_pool(self: &mut Storage, sui: Balance<SUI>) {
        self.total_sui_supply = self.total_sui_supply + sui.value();
        self.sui_pool.join(sui);
    }

    public(package) fun join_stake(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        stake: StakedSui, 
        ctx: &mut TxContext
    ) {
        let validator_index = self.get_or_add_validator_index_by_staking_pool_id_mut(
            system_state, 
            stake.pool_id(), 
            ctx
        );
        let validator_info = &mut self.validator_infos[validator_index];

        if (stake.stake_activation_epoch() <= ctx.epoch()) {
            let fungible_stake = system_state.convert_to_fungible_stake(stake, ctx);

            if (validator_info.active_stake.is_some()) {
                validator_info.active_stake.borrow_mut().join_fungible_stake(fungible_stake);

            } else {
                validator_info.active_stake.fill(fungible_stake);
            };
        }
        else {
            if (validator_info.inactive_stake.is_some()) {
                validator_info.inactive_stake.borrow_mut().join(stake);
            } else {
                validator_info.inactive_stake.fill(stake);
            };
        };

        self.refresh_validator_info(validator_index);
    }

    public(package) fun split_from_sui_pool(self: &mut Storage, amount: u64): Balance<SUI> {
        self.total_sui_supply = self.total_sui_supply - amount;
        self.sui_pool.split(amount)
    }

    public(package) fun split_up_to_n_sui_from_sui_pool(
        self: &mut Storage, 
        max_sui_amount_out: u64
    ): Balance<SUI> {
        let sui_amount_out = min(self.sui_pool.value(), max_sui_amount_out);
        self.split_from_sui_pool(sui_amount_out)
    }

    // TODO: handle FungibleStake min size constraints
    public(package) fun split_up_to_n_sui_from_active_stake(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        validator_index: u64, 
        max_sui_amount_out: u64,
        ctx: &mut TxContext
    ): Balance<SUI> {
        let validator_info = &mut self.validator_infos[validator_index];

        if (validator_info.active_stake.is_none()) {
            return balance::zero()
        };

        let fungible_stake_amount = validator_info.active_stake.borrow().fungible_stake_value();
        let total_sui_amount = get_sui_amount(
            &validator_info.exchange_rate, 
            fungible_stake_amount 
        );

        let unstaked_sui = if (total_sui_amount <= max_sui_amount_out) {
            self.take_active_stake(system_state, validator_index, ctx)
        } 
        else {
            let split_amount = (max_sui_amount_out as u128) 
                * (fungible_stake_amount as u128) 
                / (total_sui_amount as u128);
            self.split_from_active_stake(system_state, validator_index, split_amount as u64, ctx)
        };

        assert!(unstaked_sui.value() <= max_sui_amount_out, EInvariantViolation);

        unstaked_sui
    }

    public(package) fun split_up_to_n_sui_from_inactive_stake(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        validator_index: u64, 
        max_sui_amount_out: u64,
        ctx: &mut TxContext
    ): Balance<SUI> {
        let validator_info = &mut self.validator_infos[validator_index];

        if (validator_info.inactive_stake.is_none()) {
            return balance::zero()
        };

        let staked_sui = if (validator_info.inactive_stake.borrow().staked_sui_amount() <= max_sui_amount_out) {
            self.take_from_inactive_stake(validator_index)
        } 
        else {
            self.split_from_inactive_stake(validator_index, max_sui_amount_out, ctx)
        };

        let unstaked_sui = system_state.request_withdraw_stake_non_entry(staked_sui, ctx);
        assert!(unstaked_sui.value() <= max_sui_amount_out, EInvariantViolation);

        unstaked_sui
    }

    /* Private Functions */

    /// copied directly from staking_pool.move
    fun get_sui_amount(exchange_rate: &PoolTokenExchangeRate, token_amount: u64): u64 {
        // When either amount is 0, that means we have no stakes with this pool.
        // The other amount might be non-zero when there's dust left in the pool.
        if (exchange_rate.sui_amount() == 0 || exchange_rate.pool_token_amount() == 0) {
            return token_amount
        };
        let res = (exchange_rate.sui_amount() as u128)
                * (token_amount as u128)
                / (exchange_rate.pool_token_amount() as u128);
        res as u64
    }

    /// Update the total sui amount for the validator and modify the storage sui supply accordingly
    /// assumes the exchange rate is up to date
    fun refresh_validator_info(self: &mut Storage, i: u64) {
        let validator_info = &mut self.validator_infos[i];
        self.total_sui_supply = self.total_sui_supply - validator_info.total_sui_amount;

        let mut total_sui_amount = 0;
        if (validator_info.active_stake.is_some()) {
            let active_stake = validator_info.active_stake.borrow();
            let active_sui_amount = get_sui_amount(
                &validator_info.exchange_rate, 
                active_stake.fungible_stake_value()
            );

            total_sui_amount = total_sui_amount + active_sui_amount;
        };

        if (validator_info.inactive_stake.is_some()) {
            let inactive_stake = validator_info.inactive_stake.borrow();
            let inactive_sui_amount = inactive_stake.staked_sui_amount();

            total_sui_amount = total_sui_amount + inactive_sui_amount;
        };

        validator_info.total_sui_amount = total_sui_amount;
        self.total_sui_supply = self.total_sui_supply + total_sui_amount;
    }


    fun split_from_active_stake(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        validator_index: u64, 
        fungible_stake_amount: u64,
        ctx: &mut TxContext
    ): Balance<SUI> {
        let validator_info = &mut self.validator_infos[validator_index];

        let stake = validator_info.active_stake
            .borrow_mut()
            .split_fungible_stake(fungible_stake_amount, ctx);

        self.refresh_validator_info(validator_index);

        system_state.redeem_fungible_stake(stake, ctx)
    }

    fun take_active_stake(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        validator_index: u64, 
        ctx: &mut TxContext
    ): Balance<SUI> {
        let validator_info = &mut self.validator_infos[validator_index];
        let fungible_stake = validator_info.active_stake.extract();

        self.refresh_validator_info(validator_index);

        system_state.redeem_fungible_stake(fungible_stake, ctx)
    }

    fun split_from_inactive_stake(
        self: &mut Storage, 
        validator_index: u64, 
        sui_amount_out: u64,
        ctx: &mut TxContext
    ): StakedSui {
        let validator_info = &mut self.validator_infos[validator_index];
        let stake = validator_info.inactive_stake
            .borrow_mut()
            .split(sui_amount_out, ctx);

        self.refresh_validator_info(validator_index);

        stake
    }

    fun take_from_inactive_stake(
        self: &mut Storage, 
        validator_index: u64, 
    ): StakedSui {
        let validator_info = &mut self.validator_infos[validator_index];
        let stake = validator_info.inactive_stake.extract();

        self.refresh_validator_info(validator_index);

        stake
    }

    /* Private functions */
    fun get_or_add_validator_index_by_staking_pool_id_mut(
        self: &mut Storage, 
        system_state: &mut SuiSystemState,
        staking_pool_id: ID,
        ctx: &TxContext
    ): u64 {
        let mut i = 0;
        while (i < self.validator_infos.length()) {
            if (self.validator_infos[i].staking_pool_id == staking_pool_id) {
                return i
            };

            i = i + 1;
        };

        let exchange_rates = system_state.pool_exchange_rates(&staking_pool_id);
        let latest_exchange_rate = exchange_rates.borrow(ctx.epoch());

        self.validator_infos.push_back(ValidatorInfo {
            staking_pool_id: copy staking_pool_id,
            active_stake: option::none(),
            inactive_stake: option::none(),
            exchange_rate: *latest_exchange_rate,
            total_sui_amount: 0
        });

        i
    }

    #[test_only] use sui::test_scenario::{Self, Scenario};
    #[test_only]
    use sui_system::governance_test_utils::{
        advance_epoch_with_reward_amounts,
    };

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

        let mut storage = new();

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
        storage.refresh_storage(&mut system_state, scenario.ctx());

        storage.join_stake(&mut system_state, staked_sui_2, scenario.ctx());
        test_scenario::return_shared(system_state);

        assert!(storage.total_sui_supply() == 350 * MIST_PER_SUI, 0);

        advance_epoch_with_reward_amounts(0, 800, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        storage.refresh_storage(&mut system_state, scenario.ctx());

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

        storage.refresh_storage(&mut system_state, scenario.ctx());

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

        storage.refresh_storage(&mut system_state, scenario.ctx());

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
