#![no_std]

use soroban_sdk::{
    auth::{Context, CustomAccountInterface},
    contract, contracterror, contractimpl, contracttype,
    crypto::Hash,
    token, Address, Env, Vec,
};

#[contracttype]
enum DataKey {
    NestedDelegates,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidDelegateCount = 1,
    UnknownDelegate = 2,
    InvalidAmount = 3,
}

/// A custom account that owns assets and delegates authorization to a
/// constructor-defined set of addresses.
#[contract]
pub struct DelegatedAssetAccount;

#[contractimpl]
impl DelegatedAssetAccount {
    pub fn __constructor(env: Env, nested_delegates: Vec<Address>) {
        env.storage()
            .instance()
            .set(&DataKey::NestedDelegates, &nested_delegates);
    }

    pub fn nested_delegates(env: Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::NestedDelegates)
            .expect("nested delegates are initialized")
    }

    pub fn withdraw(env: Env, token: Address, to: Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let account = env.current_contract_address();
        account.require_auth();
        token::Client::new(&env, &token).transfer(&account, &to, &amount);
        Ok(())
    }
}

#[contractimpl]
impl CustomAccountInterface for DelegatedAssetAccount {
    type Signature = ();
    type Error = Error;

    fn __check_auth(
        env: Env,
        _signature_payload: Hash<32>,
        _signature: (),
        _auth_contexts: Vec<Context>,
    ) -> Result<(), Error> {
        let supplied = env.custom_account().get_delegated_signers();
        let expected = Self::nested_delegates(env.clone());

        if supplied.len() != expected.len() {
            return Err(Error::InvalidDelegateCount);
        }

        for delegate in supplied.iter() {
            let mut found = false;
            for expected_delegate in expected.iter() {
                if delegate == expected_delegate {
                    found = true;
                    break;
                }
            }
            if !found {
                return Err(Error::UnknownDelegate);
            }
            env.custom_account().delegate_auth(&delegate);
        }

        Ok(())
    }
}
