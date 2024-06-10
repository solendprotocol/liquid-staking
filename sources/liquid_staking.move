/// Module: liquid_staking
module liquid_staking::liquid_staking {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance, Supply};
    use sui::types::{Self};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui_system::staking_pool::StakedSui;
    use liquid_staking::storage::{Self, Storage};

    /* Errors */
    const ENotAOneTimeWitness: u64 = 0;

    public struct LiquidStakingInfo<phantom P> has key, store {
        id: UID,
        lst_supply: Supply<LST<P>>,
        fees: Fees,
        storage: Storage
    }

    public struct AdminCap<phantom P> has key, store { 
        id: UID
    }

    public struct LST<phantom P> has drop, copy {}


    public struct Fees has store {

    }

    public fun create_lst<P: drop>(p: P, ctx: &mut TxContext): (AdminCap<P>, LiquidStakingInfo<P>) {
        assert!(types::is_one_time_witness(&p), ENotAOneTimeWitness);

        (
            AdminCap<P> { id: object::new(ctx) },
            LiquidStakingInfo {
                id: object::new(ctx),
                lst_supply: balance::create_supply(LST<P> {}),
                fees: Fees {},
                storage: storage::new(),
            }
        )
    }

    // User operations
    public fun mint<P: drop>(
        lst_info: &mut LiquidStakingInfo<P>, 
        sui: Coin<SUI>, 
        ctx: &mut TxContext
    ): Coin<LST<P>> {
        let mint_amount = sui_amount_to_lst_amount(lst_info, coin::value(&sui));

        lst_info.storage.join_to_sui_pool(coin::into_balance(sui));

        // TODO: charge fees
        let lst = balance::increase_supply(&mut lst_info.lst_supply, mint_amount);

        coin::from_balance(lst, ctx)
    }

    // public fun redeem<P: drop>(
    //     lst_info: &mut LiquidStakingInfo<P>,
    //     lst: Coin<LST<P>>,
    //     ctx: &mut TxContext
    // ): vector<StakedSui> {
    //     balance::decrease_supply(&mut lst_info.lst_supply, coin::into_balance(lst));

    //     // TODO: charge fees
    //     vector::empty()
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

}
