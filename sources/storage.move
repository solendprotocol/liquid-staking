module liquid_staking::storage {
    use sui_system::staking_pool::{StakedSui, FungibleStake, PoolTokenExchangeRate};
    use sui::address;
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use std::option::{Self, Option};
    use sui::tx_context::{Self, TxContext};
    use sui_system::sui_system::{Self, SuiSystemState};

    /* Errors */

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

    /* Getters */
    public(package) fun total_sui_supply(self: &Storage): u64 {
        self.total_sui_supply
    }

    /* Public Mutative Functions */
    /// update the total sui supply value when the epoch changes
    public(package) fun refresh_storage(
        self: &mut Storage, 
        system_state: &mut SuiSystemState, 
        ctx: &TxContext
    ) {

        if (self.last_refresh_epoch == ctx.epoch()) {
            return
        };

        let mut i = 0;
        while (i < self.validator_infos.length()) {
            let exchange_rates = system_state.pool_exchange_rates(&self.validator_infos[i].staking_pool_id);
            let latest_exchange_rate = exchange_rates.borrow(ctx.epoch());

            (&mut self.validator_infos[i]).exchange_rate = *latest_exchange_rate;

            refresh_validator_info(self, i);
            i = i + 1;
        };

        self.last_refresh_epoch = ctx.epoch();
    }


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

    public(package) fun split_from_active_stake(
        self: &mut Storage, 
        validator_index: u64, 
        fungible_stake_amount: u64,
        ctx: &mut TxContext
    ): FungibleStake {
        let validator_info = &mut self.validator_infos[validator_index];

        let stake = validator_info.active_stake
            .borrow_mut()
            .split_fungible_stake(fungible_stake_amount, ctx);

        self.refresh_validator_info(validator_index);

        stake
    }

    public(package) fun split_from_inactive_stake(
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

    public(package) fun withdraw_stake_from_validator(validator_index: u64, staked_sui_amount: u64) {

        // self.refresh_validator_info(&mut self.validator_infos[validator_index]);

    }

    public(package) fun add_stake_to_validator(validator_index: u64, sui_amount: u64) {

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
    fun setup_sui_system(scenario: &mut Scenario) {
        use sui_system::governance_test_utils::{
            create_validators_with_stakes,
            create_sui_system_state_for_testing,
            // stake_with,
            // remove_validator,
            // remove_validator_candidate,
            // total_sui_balance,
            // unstake,
        };

        let validators = create_validators_with_stakes(vector[100, 100], scenario.ctx());
        create_sui_system_state_for_testing(validators, 0, 0, scenario.ctx());

        advance_epoch_with_reward_amounts(0, 0, scenario);
    }

    const MIST_PER_SUI: u64 = 1_000_000_000;

    #[test_only]
    public fun stake_with(validator_index: u64, amount: u64, scenario: &mut Scenario): StakedSui {
        use sui::coin::{Self};

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
    fun test_join() {
        use sui::coin::{Self};
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario);

        let staked_sui_1 = stake_with(0, 100, &mut scenario);
        let staked_sui_2 = stake_with(0, 200, &mut scenario);

        let mut storage = new();

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();

        let sui = balance::create_for_testing<SUI>(1000 * MIST_PER_SUI);
        storage.join_to_sui_pool(sui);

        storage.join_stake(&mut system_state, staked_sui_1, scenario.ctx());
        test_scenario::return_shared(system_state);

        std::debug::print(&storage);

        advance_epoch_with_reward_amounts(0, 0, &mut scenario);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        storage.join_stake(&mut system_state, staked_sui_2, scenario.ctx());
        test_scenario::return_shared(system_state);

        std::debug::print(&storage);
        

        sui::test_utils::destroy(storage);

        scenario.end();
    }


}
