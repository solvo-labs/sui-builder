module witness::witness {
    use std::option::{Self};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin;
    use sui::url::{Self};

    struct WITNESS has drop {}

    const DECIMAL: u8 = 9;
    const SYMBOL: vector<u8> = b"Symbol";
    const NAME: vector<u8> = b"Name";
    const DESCRIPTION: vector<u8> = b"Description";
    const ICON_URL: vector<u8> = b"Icon_Url";

    fun init (otw: WITNESS, ctx: &mut TxContext){
        let (treasury, metadata) = coin::create_currency(
            otw, 
            DECIMAL,
            SYMBOL, 
            NAME, 
            DESCRIPTION, 
            if (ICON_URL == b"") { option::none() } else { option::some(url::new_unsafe_from_bytes(ICON_URL)) },
            ctx
        );
        
        transfer::public_freeze_object(metadata);
        transfer::public_transfer(treasury, tx_context::sender(ctx))
    }
}