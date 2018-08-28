# remittance
Remittance excercise projects

### Requirements

- there are 3 people: Alice, Bob and Carol.
- Alice wants to send funds to Bob, but she only has ether & Bob wants to be paid in local currency.
- luckily, Carol runs an exchange shop that converts ether to local currency.

Therefore, to get the funds to Bob, Alice will allow the funds to be transferred through Carol's exchange shop. Carol will collect the ether from Alice and give the local currency to Bob.

The steps involved in the operation are as follows:

- Alice creates a Remittance contract with Ether in it and a puzzle.
- Alice sends a one-time-password to Bob; over SMS, say.
- Alice sends another one-time-password to Carol; over email, say.
- Bob treks to Carol's shop.
- Bob gives Carol his one-time-password.
- Carol submits both passwords to Alice's remittance contract.
- Only when both passwords are correct does the contract yield the Ether to Carol.
- Carol gives the local currency to Bob.
- Bob leaves.
- Alice is notified that the transaction went through.

Stretch goals:

- did you implement the basic specs airtight, without any exploit, before ploughing through the stretch goals?
- add a deadline, after which Alice can claim back the unchallenged Ether
- add a limit to how far in the future the deadline can be
- add a kill switch to the whole contract
- plug a security hole (which one?) by changing one password to the recipient's address
- make the contract a utility that can be used by David, Emma and anybody with an address
- make you, the owner of the contract, take a cut of the Ethers smaller than what it would cost Alice to deploy the same contract herself
- did you degrade safety in the name of adding features?

### Hypothesis:
- Alice is not (longer) the contract owner as it is an utility contract used by anyone to send ether
    to an exchange shop to give money to someone
- Alice (or someone else) can deposit eth several times using the same solution (hash): this renews 
    the limit expiration 
- Alice (or someone else) has to pay a (little) commission to the contract owner: the commission is payed
    at withdraw time (is it right?.....)

### Added:
- deadline to claim back ether and its limit
- made the contract an utility contract so the owner can send eth to everybody trought an exchange shop
- strenghten the puzzle
    1. the owner 
        1.1 build piece for shop and receiver 
        1.2. make an hash (the solution) using the utility function in conctract
        1.3. deposit eth using hash
    2. the shop withdraws eth using whitdraw function providing the beneficiary piece, its piece and its address  
    3. the owner can claim eth using the hash previously built 
- added commission for contract owner

### Pending
- some stretch goals
- how test block limit trespassing?

### Missings 
- some test for fee

### Other
