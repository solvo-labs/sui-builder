module witness::witness {
    use std::option;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin;

    struct WITNESS has drop {}

    const DECIMAL: u8 = 9;
    const SYMBOL: vector<u8> = b"Symbol";
    const NAME: vector<u8> = b"Name";
    const DESCRIPTION: vector<u8> = b"Description";

    fun init (otw: WITNESS, ctx: &mut TxContext){
        let (treasury, metadata) = coin::create_currency(
            otw, 
            DECIMAL,
            SYMBOL, 
            NAME, 
            DESCRIPTION, 
            option::none(),
            ctx
        );
        
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }
}