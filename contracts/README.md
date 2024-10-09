Note this is not production ready yet. Bunch of things still need to be addressed, like:
- versioning
- allowing other LSTs to migrate to this module
- allow each LST to implement a "custom" redeem function. There will still be a native redeem in liquid_staking.move, but LSTs can implement an alternative as well. The two can have different fees, which can incentivize users to use the custom one if necessary. 

plus a bunch more things that im missing

Other notes:
- The AdminCap cannot rug funds. So it's fairly safe to store in a separate contract. The separate contract can be in charge of delegation strategies. Then the separate contract can be cranked on some periodic basis. Some example delegation strategies:
  - Delegate to top N performing validators
  - Delegate evenly to all active validators on Sui

