module liquid_staking::fees {
    use sui::bag::{Self, Bag};
    use std::u64::max;

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



    fun validate_fees(fees: &FeeConfig) {
        // make sure all fees are less than 100%. do them in order wrt the Struct definition.
        assert!(fees.sui_mint_fee_bps <= 10_000, EInvalidFeeConfig);
        assert!(fees.staked_sui_mint_fee_bps <= 10_000, EInvalidFeeConfig);
        assert!(fees.redeem_fee_bps <= 10_000, EInvalidFeeConfig);
        assert!(fees.staked_sui_redeem_fee_bps <= 10_000, EInvalidFeeConfig);
        assert!(fees.spread_fee_bps <= 10_000, EInvalidFeeConfig);

        assert!(fees.sui_mint_fee_bps != 0 || fees.redeem_fee_bps != 0, EInvalidFeeConfig);
    }

    public fun calculate_mint_fee(self: &FeeConfig, sui_amount: u64): u64 {
        if (self.sui_mint_fee_bps == 0) {
            return 0
        };

        // ceil(sui_amount * sui_mint_fee_bps / 10_000)
        (((sui_amount as u128) * (self.sui_mint_fee_bps as u128) + 9999) / 10_000) as u64
    }

    public fun calculate_redeem_fee(self: &FeeConfig, sui_amount: u64): u64 {
        if (self.redeem_fee_bps == 0) {
            return 0
        };

        // ceil(sui_amount * redeem_fee_bps / 10_000)
        (((sui_amount as u128) * (self.redeem_fee_bps as u128) + 9999) / 10_000) as u64
    }

    #[test_only] use sui::test_scenario::{Self, Scenario};

    #[test]
    public fun test_validate_fees_happy() {
        let mut scenario = test_scenario::begin(@0x0);
        let fees = FeeConfig {
            sui_mint_fee_bps: 10_000,
            staked_sui_mint_fee_bps: 10_000,
            redeem_fee_bps: 10_000,
            staked_sui_redeem_fee_bps: 10_000,
            spread_fee_bps: 10_000,
            extra_fields: bag::new(scenario.ctx())
        };

        validate_fees(&fees);

        sui::test_utils::destroy(fees);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = EInvalidFeeConfig)]
    public fun test_validate_fees_error_sui_greater_than_10000() {
        let mut scenario = test_scenario::begin(@0x0);
        let fees = FeeConfig {
            sui_mint_fee_bps: 10_001,
            staked_sui_mint_fee_bps: 10_000,
            redeem_fee_bps: 10_000,
            staked_sui_redeem_fee_bps: 10_000,
            spread_fee_bps: 10_000,
            extra_fields: bag::new(scenario.ctx())
        };

        validate_fees(&fees);

        sui::test_utils::destroy(fees);
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = EInvalidFeeConfig)]
    public fun test_validate_fees_error_sui_and_redeem_both_zero() {
        let mut scenario = test_scenario::begin(@0x0);
        let fees = FeeConfig {
            sui_mint_fee_bps: 0,
            staked_sui_mint_fee_bps: 10_000,
            redeem_fee_bps: 0,
            staked_sui_redeem_fee_bps: 10_000,
            spread_fee_bps: 10_000,
            extra_fields: bag::new(scenario.ctx())
        };

        validate_fees(&fees);

        sui::test_utils::destroy(fees);
        scenario.end();
    }

    #[test]
    public fun test_mint_fee() {
        let mut scenario = test_scenario::begin(@0x0);
        let fees = FeeConfig {
            sui_mint_fee_bps: 100,
            staked_sui_mint_fee_bps: 10_000,
            redeem_fee_bps: 10_000,
            staked_sui_redeem_fee_bps: 10_000,
            spread_fee_bps: 10_000,
            extra_fields: bag::new(scenario.ctx())
        };

        assert!(calculate_mint_fee(&fees, 1) == 1, 0);
        assert!(calculate_mint_fee(&fees, 99) == 1, 0);
        assert!(calculate_mint_fee(&fees, 100) == 1, 0);
        assert!(calculate_mint_fee(&fees, 101) == 2, 0);

        sui::test_utils::destroy(fees);
        scenario.end();
    }

    #[test]
    public fun test_redeem_fee() {
        let mut scenario = test_scenario::begin(@0x0);
        let fees = FeeConfig {
            sui_mint_fee_bps: 0,
            staked_sui_mint_fee_bps: 10_000,
            redeem_fee_bps: 100,
            staked_sui_redeem_fee_bps: 10_000,
            spread_fee_bps: 10_000,
            extra_fields: bag::new(scenario.ctx())
        };

        assert!(calculate_redeem_fee(&fees, 1) == 1, 0);
        assert!(calculate_redeem_fee(&fees, 99) == 1, 0);
        assert!(calculate_redeem_fee(&fees, 100) == 1, 0);
        assert!(calculate_redeem_fee(&fees, 101) == 2, 0);

        sui::test_utils::destroy(fees);
        scenario.end();
    }
}
