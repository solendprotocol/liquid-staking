/// Module: liquid_staking
module liquid_staking::liquid_staking {
    use sui::balance::{Self, Balance, Supply};
    use sui_system::sui_system::{SuiSystemState};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use liquid_staking::storage::{Self, Storage};
    use sui::bag::{Self, Bag};
    use sui::math::max;

    /* Errors */
    const ENotEnoughSuiUnstaked: u64 = 1;

    public struct LiquidStakingInfo<phantom P> has key, store {
        id: UID,
        lst_supply: Supply<LST<P>>,
        fee_config: FeeConfig,
        fees: Balance<SUI>,
        accrued_spread_fees: u64,
        storage: Storage,
        extra_fields: Bag
    }

    public struct AdminCap<phantom P> has key, store { 
        id: UID
    }

    public struct LST<phantom P> has drop, copy {}


    // TODO: will we have more fees?
    public struct FeeConfig has store, drop {
        sui_mint_fee_bps: u64,
        staked_sui_mint_fee_bps: u64, // unused
        redeem_fee_bps: u64,
        staked_sui_redeem_fee_bps: u64, // unused
        spread_fee_bps: u64
    }

    /* Public View Functions */
    // returns total sui managed by the LST. Note that this value might be out of date if the 
    // LiquidStakingInfo object is out of date.
    public fun total_sui_supply<P>(self: &LiquidStakingInfo<P>): u64 {
        self.storage.total_sui_supply() - self.accrued_spread_fees
    }

    public fun total_lst_supply<P>(self: &LiquidStakingInfo<P>): u64 {
        self.lst_supply.supply_value()
    }

    #[test_only]
    public fun storage<P>(self: &LiquidStakingInfo<P>): &Storage {
        &self.storage
    }

    // does not include spread fees
    public fun fees<P>(self: &LiquidStakingInfo<P>): u64 {
        self.fees.value()
    }

    #[test_only]
    public fun accrued_spread_fees<P>(self: &LiquidStakingInfo<P>): u64 {
        self.accrued_spread_fees
    }

    /* Public Mutative Functions */

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
                storage: storage::new(ctx),
                extra_fields: bag::new(ctx)
            }
        )
    }

    // probably should be entry
    public fun create_fee_config(
        sui_mint_fee_bps: u64,
        staked_sui_mint_fee_bps: u64,
        redeem_fee_bps: u64,
        staked_sui_redeem_fee_bps: u64,
        spread_fee_bps: u64,
    ): FeeConfig {
        // TODO: validate fee config. we probably don't want a zero fee config, ever.

        FeeConfig {
            sui_mint_fee_bps,
            staked_sui_mint_fee_bps,
            redeem_fee_bps,
            staked_sui_redeem_fee_bps,
            spread_fee_bps
        }
    }

    // User operations
    public fun mint<P: drop>(
        self: &mut LiquidStakingInfo<P>, 
        system_state: &mut SuiSystemState, 
        sui: Coin<SUI>, 
        ctx: &mut TxContext
    ): Coin<LST<P>> {
        self.refresh(system_state, ctx);

        let mut sui_balance = sui.into_balance();

        // deduct fees
        let mint_fee_amount = self.calculate_mint_fee(sui_balance.value());
        let mint_fee = sui_balance.split(mint_fee_amount as u64);
        self.fees.join(mint_fee);
        
        let mint_amount = self.sui_amount_to_lst_amount(sui_balance.value());

        self.storage.join_to_sui_pool(sui_balance);

        let lst = balance::increase_supply(&mut self.lst_supply, mint_amount);

        coin::from_balance(lst, ctx)
    }

    public fun redeem<P: drop>(
        self: &mut LiquidStakingInfo<P>,
        lst: Coin<LST<P>>,
        system_state: &mut SuiSystemState, 
        ctx: &mut TxContext
    ): Coin<SUI> {
        self.refresh(system_state, ctx);

        let max_sui_amount_out = self.lst_amount_to_sui_amount(lst.value());

        let mut sui = self.storage.split_up_to_n_sui(system_state, max_sui_amount_out, ctx);
        assert!(sui.value() <= max_sui_amount_out, ENotEnoughSuiUnstaked);
        // TODO: add minimum balance check as well. don't wanna rug the user!

        // deduct fee
        let redeem_fee_amount = self.calculate_redeem_fee(sui.value());
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
        self.refresh(system_state, ctx);

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
        self.refresh(system_state, ctx);

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
        // 1 or 2 MIST.
        total_sui_unstaked
    }

    public fun collect_fees<P>(
        self: &mut LiquidStakingInfo<P>,
        system_state: &mut SuiSystemState,
        _admin_cap: &AdminCap<P>,
        ctx: &mut TxContext
    ): Coin<SUI> {
        self.refresh(system_state, ctx);

        let spread_fees = self.storage.split_up_to_n_sui(system_state, self.accrued_spread_fees, ctx);
        self.accrued_spread_fees = self.accrued_spread_fees - spread_fees.value();

        let mut fees = self.fees.withdraw_all();
        fees.join(spread_fees);

        coin::from_balance(fees, ctx)
    }

    public fun update_fees<P>(
        self: &mut LiquidStakingInfo<P>,
        _admin_cap: &AdminCap<P>,
        fee_config: FeeConfig,
    ) {
        self.fee_config = fee_config;
    }

    // returns true if the object was refreshed
    public fun refresh<P>(
        self: &mut LiquidStakingInfo<P>, 
        system_state: &mut SuiSystemState, 
        ctx: &mut TxContext
    ): bool {
        let old_total_supply = self.storage.total_sui_supply();

        if (self.storage.refresh(system_state, ctx)) { // epoch rolled over
            let new_total_supply = self.storage.total_sui_supply();
            if (new_total_supply > old_total_supply) {
                // don't think we need to keep track of this in fixed point.
                // If there's 1 SUI staked, and the yearly rewards is 1%, then 
                // the spread fee in 1 epoch is 1 * 0.01 / 365 = 0.0000274 SUI => 27400 MIST
                let spread_fee = 
                    ((new_total_supply - old_total_supply) as u128) 
                    * (self.fee_config.spread_fee_bps as u128) 
                    / (10_000 as u128);

                self.accrued_spread_fees = self.accrued_spread_fees + (spread_fee as u64);
                return true
            }
        };

        false
    }

    /* Private Functions */

    fun sui_amount_to_lst_amount<P>(
        self: &LiquidStakingInfo<P>, 
        sui_amount: u64
    ): u64 {
        let total_sui_supply = self.total_sui_supply();
        let total_lst_supply = balance::supply_value(&self.lst_supply);

        if (total_sui_supply == 0) {
            return sui_amount
        };

        let lst_amount = (total_lst_supply as u128)
         * (sui_amount as u128)
         / (total_sui_supply as u128);

        lst_amount as u64
    }

    fun lst_amount_to_sui_amount<P>(
        self: &LiquidStakingInfo<P>, 
        lst_amount: u64
    ): u64 {
        let total_sui_supply = self.total_sui_supply();
        let total_lst_supply = balance::supply_value(&self.lst_supply);

        // div by zero case should never happen
        let sui_amount = (total_sui_supply as u128)
            * (lst_amount as u128) 
            / (total_lst_supply as u128);

        sui_amount as u64
    }

    fun calculate_redeem_fee<P>(self: &LiquidStakingInfo<P>, sui_amount: u64): u64 {
        let min_fee = if (self.fee_config.redeem_fee_bps == 0) {
            0
        } else {
            1
        };

        max(
            ((sui_amount as u128) 
                * (self.fee_config.redeem_fee_bps as u128) 
                / 10_000
            ) as u64,
            min_fee
        )
    }

    fun calculate_mint_fee<P>(self: &LiquidStakingInfo<P>, sui_amount: u64): u64 {
        let min_fee = if (self.fee_config.sui_mint_fee_bps == 0) {
            0
        } else {
            1
        };

        max(
            ((sui_amount as u128) 
                * (self.fee_config.sui_mint_fee_bps as u128) 
                / 10_000
            ) as u64,
            min_fee
        )
    }
}
