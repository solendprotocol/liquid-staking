Note this is not production ready yet. Bunch of things still need to be addressed, like:
- unstaking doesn't work when StakedSui objects can't be split due to min size constraints
- fees need to be ceilinged
- versioning
- whether or not I want to wait for SIP-31 to pass
- allowing other LSTs to migrate to this module

plus a bunch more things that im missing

Other notes:
- The AdminCap cannot rug funds. So it's fairly safe to store in a separate contract. The separate contract can be in charge of delegation strategies. Then the separate contract can be cranked on some periodic basis. Some example delegation strategies:
  - Delegate to top N performing validators
  - Delegate evenly to all active validators on Sui

