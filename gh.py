import solana
from solana.rpc.api import Client

http_client = Client("https://api.devnet.solana.com")

print(http_client)

import asyncio
from solana.rpc.async_api import AsyncClient

async def main():
    async with AsyncClient("https://api.devnet.solana.com") as client:
        res = await client.is_connected()
    print(res)  # True

    # Alternatively, close the client explicitly instead of using a context manager:
    client = AsyncClient("https://api.devnet.solana.com")
    res = await client.is_connected()
    print(res)  # True
    await client.close() 
    
    data = await res.getProgramAccounts("64QhX5txvKoYXMyw5a2mE6s6VEktjK2nEkJ7BAw2bmQG")
    print(data)

asyncio.run(main())


import solana.system_program as sp
from solana.publickey import PublicKey
from solana.account import Account
from solana.rpc.api import Client
from solana.transaction import Transaction, TransactionInstruction, AccountMeta

# keypair = your key pair
cli = Client('https://solana-api.projectserum.com')
account = Account(keypair[:32])
new_account = Account()
print(new_account.public_key())
print(new_account.keypair())
transaction = Transaction()
transaction.add(sp.create_account(sp.CreateAccountParams(
        from_pubkey=account.public_key(),
        new_account_pubkey=new_account.public_key(),
        lamports=cli.get_minimum_balance_for_rent_exemption(88).get('result'),
        space=88,
        program_id=PublicKey('CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz'),
    )))
send_tx = cli.send_transaction(transaction, new_account)
print(send_tx)

