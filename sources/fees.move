module liquid_staking::fees {
    use sui::bag::{Self, Bag};

    const EInvalidFeeConfig: u64 = 0;

    public struct FeeConfig has store {
        sui_mint_fee_bps: u64,
        staked_sui_mint_fee_bps: u64, // unused
        redeem_fee_bps: u64,
        staked_sui_redeem_fee_bps: u64, // unused
        spread_fee_bps: u64,
        extra_fields: Bag // in case we add other fees later
    }

    public struct FeeConfigBuilder {
        fields: Bag
    }

    public fun sui_mint_fee_bps(fees: &FeeConfig): u64 {
        fees.sui_mint_fee_bps
    }

    public fun staked_sui_mint_fee_bps(fees: &FeeConfig): u64 {
        fees.staked_sui_mint_fee_bps
    }

    public fun redeem_fee_bps(fees: &FeeConfig): u64 {
        fees.redeem_fee_bps
    }

    public fun staked_sui_redeem_fee_bps(fees: &FeeConfig): u64 {
        fees.staked_sui_redeem_fee_bps
    }

    public fun spread_fee_bps(fees: &FeeConfig): u64 {
        fees.spread_fee_bps
    }

    public fun new_builder(ctx: &mut TxContext): FeeConfigBuilder {
        FeeConfigBuilder { fields: bag::new(ctx) }
    }

    public fun set_sui_mint_fee_bps(mut self: FeeConfigBuilder, fee: u64): FeeConfigBuilder {
        bag::add(&mut self.fields, b"sui_mint_fee_bps", fee);
        self
    }

    public fun set_staked_sui_mint_fee_bps(mut self: FeeConfigBuilder, fee: u64): FeeConfigBuilder {
        bag::add(&mut self.fields, b"staked_sui_mint_fee_bps", fee);
        self
    }

    public fun set_redeem_fee_bps(mut self: FeeConfigBuilder, fee: u64): FeeConfigBuilder {
        bag::add(&mut self.fields, b"redeem_fee_bps", fee);
        self
    }

    public fun set_staked_sui_redeem_fee_bps(mut self: FeeConfigBuilder, fee: u64): FeeConfigBuilder {
        bag::add(&mut self.fields, b"staked_sui_redeem_fee_bps", fee);
        self
    }

    public fun set_spread_fee_bps(mut self: FeeConfigBuilder, fee: u64): FeeConfigBuilder {
        bag::add(&mut self.fields, b"spread_fee_bps", fee);
        self
    }

    public fun to_fee_config(builder: FeeConfigBuilder): FeeConfig {
        let FeeConfigBuilder { mut fields } = builder;

        let fees = FeeConfig {
            sui_mint_fee_bps:if (bag::contains(&fields, b"sui_mint_fee_bps")) {
                bag::remove(&mut fields, b"sui_mint_fee_bps")
            } else {
                0
            },
            staked_sui_mint_fee_bps: if (bag::contains(&fields, b"staked_sui_mint_fee_bps")) {
                bag::remove(&mut fields, b"staked_sui_mint_fee_bps")
            } else {
                0
            },
            redeem_fee_bps: if (bag::contains(&fields, b"redeem_fee_bps")) {
                bag::remove(&mut fields, b"redeem_fee_bps")
            } else {
                0
            },
            staked_sui_redeem_fee_bps: if (bag::contains(&fields, b"staked_sui_redeem_fee_bps")) {
                bag::remove(&mut fields, b"staked_sui_redeem_fee_bps")
            } else {
                0
            },
            spread_fee_bps: if (bag::contains(&fields, b"spread_fee_bps")) {
                bag::remove(&mut fields, b"spread_fee_bps")
            } else {
                0
            },
            extra_fields: fields
        };

        validate_fees(&fees);

        fees
    }

    public fun destroy(fees: FeeConfig) {
        let FeeConfig { 
            sui_mint_fee_bps: _,
            staked_sui_mint_fee_bps: _,
            redeem_fee_bps: _,
            staked_sui_redeem_fee_bps: _,
            spread_fee_bps: _,
            extra_fields
        } = fees;

        bag::destroy_empty(extra_fields);
    }



    // TODO: implement this
    fun validate_fees(fees: &FeeConfig) {
        assert!(fees.sui_mint_fee_bps <= 10_000 , EInvalidFeeConfig);

    }


}
