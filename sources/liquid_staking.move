/// Module: liquid_staking
module liquid_staking::liquid_staking {
    use sui::balance::{Self, Balance, Supply};
    use sui_system::sui_system::{SuiSystemState};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use liquid_staking::storage::{Self, Storage};

    /* Errors */
    const ETooMuchSuiUnstaked: u64 = 0;
    const ENotEnoughSuiUnstaked: u64 = 1;

    /* Constants */
    const MIST_PER_SUI: u64 = 1_000_000_000;

    public struct LiquidStakingInfo<phantom P> has key, store {
        id: UID,
        lst_supply: Supply<LST<P>>,
        fee_config: FeeConfig,
        fees: Balance<SUI>,
        accrued_spread_fees: u64,
        storage: Storage
    }

    public struct AdminCap<phantom P> has key, store { 
        id: UID
    }

    public struct LST<phantom P> has drop, copy {}


    public struct FeeConfig has store {
        sui_mint_fee_bps: u64,
        staked_sui_mint_fee_bps: u64, // unused
        redeem_fee_bps: u64,
        staked_sui_redeem_fee_bps: u64, // unused
        spread_fee_bps: u64
    }

    /* Public View Functions */

    /* Public Mutative Functions */

    // TODO: need outter wrapper to manage uniqueness of types
    public(package) fun create_lst<P: drop>(
        fee_config: FeeConfig, 
        ctx: &mut TxContext
    ): (AdminCap<P>, LiquidStakingInfo<P>) {
        (
            AdminCap<P> { id: object::new(ctx) },
            LiquidStakingInfo {
                id: object::new(ctx),
                lst_supply: balance::create_supply(LST<P> {}),
                fee_config,
                fees: balance::zero(),
                accrued_spread_fees: 0,
                storage: storage::new(),
            }
        )
    }

    // User operations
    public fun mint<P: drop>(
        self: &mut LiquidStakingInfo<P>, 
        system_state: &mut SuiSystemState, 
        sui: Coin<SUI>, 
        ctx: &mut TxContext
    ): Coin<LST<P>> {
        self.storage.refresh_storage(system_state, ctx);

        let mut sui_balance = sui.into_balance();

        // deduct fees
        let mint_fee_amount = (sui_balance.value() as u128) 
            * (self.fee_config.sui_mint_fee_bps as u128) 
            / 10_000;

        let mint_fee = sui_balance.split(mint_fee_amount as u64);
        self.fees.join(mint_fee);
        
        let mint_amount = self.sui_amount_to_lst_amount(sui_balance.value());

        self.storage.join_to_sui_pool(sui_balance);

        // TODO: charge fees
        let lst = balance::increase_supply(&mut self.lst_supply, mint_amount);

        coin::from_balance(lst, ctx)
    }

    public fun redeem<P: drop>(
        self: &mut LiquidStakingInfo<P>,
        lst: Coin<LST<P>>,
        system_state: &mut SuiSystemState, 
        ctx: &mut TxContext
    ): Coin<SUI> {
        self.storage.refresh_storage(system_state, ctx);

        let max_sui_amount_out = self.lst_amount_to_sui_amount(lst.value());

        let mut sui = balance::zero();

        // 1. split from sui pool
        sui.join(self.storage.split_up_to_n_sui_from_sui_pool(max_sui_amount_out));

        // 2. split from inactive stake
        let mut i = 0;
        {
            while (i < self.storage.validators().length() && sui.value() < max_sui_amount_out) {
                let unstaked_sui = self.storage.split_up_to_n_sui_from_inactive_stake(
                    system_state,
                    i,
                    max_sui_amount_out - sui.value(),
                    ctx
                );

                sui.join(unstaked_sui);
                i = i + 1;
            };
        };

        // 3. split from active stake
        {
            let mut i = 0;
            while (i < self.storage.validators().length() && sui.value() < max_sui_amount_out) {
                let unstaked_sui = self.storage.split_up_to_n_sui_from_active_stake(
                    system_state,
                    i,
                    max_sui_amount_out - sui.value(),
                    ctx
                );

                sui.join(unstaked_sui);
                i = i + 1;
            };
        };

        assert!(sui.value() <= max_sui_amount_out, ETooMuchSuiUnstaked);
        // TODO: add minimum unstake check

        // deduct fee
        let redeem_fee_amount = (sui.value() as u128) 
            * (self.fee_config.redeem_fee_bps as u128) 
            / 10_000;

        let redeem_fee = sui.split(redeem_fee_amount as u64);
        self.fees.join(redeem_fee);

        self.lst_supply.decrease_supply(lst.into_balance());

        coin::from_balance(sui, ctx)
    }

    // Admin Functions
    public fun increase_validator_stake<P>(
        self: &mut LiquidStakingInfo<P>,
        _admin_cap: &AdminCap<P>,
        system_state: &mut SuiSystemState,
        validator_address: address,
        sui_amount: u64,
        ctx: &mut TxContext
    ) {
        self.storage.refresh_storage(system_state, ctx);

        let sui = self.storage.split_from_sui_pool(sui_amount);
        let staked_sui = system_state.request_add_stake_non_entry(
            coin::from_balance(sui, ctx),
            validator_address,
            ctx
        );

        self.storage.join_stake(system_state, staked_sui, ctx);

        // TODO: invariant check. total_sui_supply should not change before and after
        // there can be some precision issues though so i think sometimes the amount of sui can decrease by 
        // 1 MIST.
    }
    
    // returns actual sui amount unstaked
    public fun decrease_validator_stake<P>(
        self: &mut LiquidStakingInfo<P>,
        _admin_cap: &AdminCap<P>,
        system_state: &mut SuiSystemState,
        validator_index: u64,
        max_sui_amount: u64,
        ctx: &mut TxContext
    ): u64 {
        self.storage.refresh_storage(system_state, ctx);

        let sui_from_inactive_stake = self.storage.split_up_to_n_sui_from_inactive_stake(
            system_state,
            validator_index,
            max_sui_amount,
            ctx
        );
        let sui_from_active_stake = self.storage.split_up_to_n_sui_from_active_stake(
            system_state,
            validator_index,
            max_sui_amount - sui_from_inactive_stake.value(),
            ctx
        );

        let total_sui_unstaked = sui_from_inactive_stake.value() + sui_from_active_stake.value();
        self.storage.join_to_sui_pool(sui_from_inactive_stake);
        self.storage.join_to_sui_pool(sui_from_active_stake);

        // TODO: invariant check. total_sui_supply should not change before and after
        // there can be some precision issues though so i think sometimes the amount of sui can decrease by 
        // 1 MIST.
        total_sui_unstaked
    }

    /* Private Functions */
    // fun refresh(
    //     self: &mut LiquidStakingInfo<P>, 
    //     system_state: &mut SuiSystemState, 
    //     ctx: &mut TxContext
    // ) {
    //     let old_total_supply = self.storage.total_sui_supply();

    //     self.storage.refresh_storage(system_state, ctx);

    //     let new_total_supply = self.storage.total_sui_supply();

    //     if (new_total_supply > old_total_supply) {
    //         let spread_fee = 
    //             ((new_total_supply - old_total_supply) as u128) 
    //             * (self.fee_config.spread_fee_bps as u128) 
    //             / (10_000 as u128);

    //         self.accrued_spread_fees = self.accrued_spread_fees + (spread_fee as u64);
    //     }
    // }

    fun sui_amount_to_lst_amount<P>(
        lst_info: &LiquidStakingInfo<P>, 
        sui_amount: u64
    ): u64 {
        let total_sui_supply = lst_info.storage.total_sui_supply();
        let total_lst_supply = balance::supply_value(&lst_info.lst_supply);

        if (total_sui_supply == 0) {
            return sui_amount
        };

        ((total_lst_supply as u128) * (sui_amount as u128) / (total_sui_supply as u128)) as u64
    }

    fun lst_amount_to_sui_amount<P>(
        lst_info: &LiquidStakingInfo<P>, 
        lst_amount: u64
    ): u64 {
        let total_sui_supply = lst_info.storage.total_sui_supply();
        let total_lst_supply = balance::supply_value(&lst_info.lst_supply);

        // div by zero case should never happen
        ((total_sui_supply as u128) * (lst_amount as u128) / (total_lst_supply as u128)) as u64
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

    #[test_only] public struct TEST has drop {}

    #[test]
    fun test_mint_and_redeem() {
        let mut scenario = test_scenario::begin(@0x0);

        setup_sui_system(&mut scenario, vector[100, 100]);

        scenario.next_tx(@0x0);

        let mut system_state = scenario.take_shared<SuiSystemState>();
        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());

        let (admin_cap, mut lst_info) = create_lst<TEST>(
            FeeConfig { 
                sui_mint_fee_bps: 100, 
                redeem_fee_bps: 100,
                staked_sui_mint_fee_bps: 0,
                staked_sui_redeem_fee_bps: 0,
                spread_fee_bps: 0
            }, 
            scenario.ctx()
        );

        let lst = mint(&mut lst_info, &mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.fees.value() == 1 * MIST_PER_SUI, 0);
        sui::test_utils::destroy(lst);

        let sui = coin::mint_for_testing<SUI>(100 * MIST_PER_SUI, scenario.ctx());
        let mut lst = mint(&mut lst_info, &mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.lst_supply.supply_value() == 198 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 198 * MIST_PER_SUI, 0);
        assert!(lst_info.fees.value() == 2 * MIST_PER_SUI, 0);


        let sui = redeem(
            &mut lst_info, 
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
            FeeConfig { 
                sui_mint_fee_bps: 100, 
                redeem_fee_bps: 100,
                staked_sui_mint_fee_bps: 0,
                staked_sui_redeem_fee_bps: 0,
                spread_fee_bps: 0
            }, 
            scenario.ctx()
        );

        let lst = mint(&mut lst_info, &mut system_state, sui, scenario.ctx());

        assert!(lst.value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.fees.value() == 1 * MIST_PER_SUI, 0);

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x0,
            20 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage.validators()[0].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
            0
        );

        lst_info.increase_validator_stake(
            &admin_cap, 
            &mut system_state, 
            @0x1,
            20 * MIST_PER_SUI, 
            scenario.ctx()
        );

        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage.validators()[1].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
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

        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage.validators()[1].inactive_stake().borrow().staked_sui_amount() == 20 * MIST_PER_SUI, 
            0
        );
        assert!(
            lst_info.storage.validators()[1].active_stake().borrow().fungible_stake_value() == 10 * MIST_PER_SUI, 
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

        assert!(lst_info.lst_supply.supply_value() == 99 * MIST_PER_SUI, 0);
        assert!(lst_info.storage.total_sui_supply() == 99 * MIST_PER_SUI, 0);
        assert!(
            lst_info.storage.validators()[1].inactive_stake().is_none(),
            0
        );
        assert!(
            lst_info.storage.validators()[1].active_stake().is_none(),
            0
        );

        sui::test_utils::destroy(lst);
        test_scenario::return_shared(system_state);

        sui::test_utils::destroy(admin_cap);
        sui::test_utils::destroy(lst_info);

        scenario.end();
    }


}
