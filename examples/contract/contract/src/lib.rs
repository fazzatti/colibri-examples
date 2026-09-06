#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, symbol_short, Env};

#[contract]
pub struct Counter;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    DemonstrationFailure = 1,
}

// Deliberately public. This teaches invocation, not access-control design.
#[contractimpl]
impl Counter {
    pub fn count(env: Env) -> u32 {
        env.storage().instance().get(&symbol_short!("count")).unwrap_or(0)
    }
    pub fn increment(env: Env, by: u32) -> u32 {
        let next = Self::count(env.clone()).checked_add(by).unwrap();
        env.storage().instance().set(&symbol_short!("count"), &next);
        next
    }
    pub fn reject() -> Result<(), Error> {
        Err(Error::DemonstrationFailure)
    }
}
