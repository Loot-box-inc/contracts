import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages/multisender";

contract MultisenderMaster with Deployable, Ownable {
  owner: Address;
  minGasForStorage: Int as coins = ton("0.01");
  amount_sent: map<Address, Int as coins>;

  init() {
    self.owner = sender();
    self.amount_sent = emptyMap();
  }

  receive(msg: MultiSend) {
    self.requireOwner();
    let lngth: Int = msg.recipients.deriveLength();
  }

  receive(msg: JettonTransferNotification) {
    let jetton_address: Address = sender();
    let payload: Slice = msg.forward_payload.asSlice();
    let balance: Int = myBalance();

    let msg_id: Int = payload.loadUint(32);
    let multi_sender_init: StateInit = self.get_init_code_for_multisender(msg.sender);
    let multi_sender_address: Address = contractAddress(multi_sender_init);

    if (msg_id == 0x445) {
      send(SendParameters{
        to: jetton_address,
        mode: SendPayGasSeparately,
        bounce: false,
        body: beginCell()
              .storeUint(0xf8a73a5, 32)
              .storeUint(1, 64)
              .storeCoins(msg.amount)
              .storeAddress(multi_sender_address)
              .storeAddress(myAddress())
              .storeRef(null)
              .storeCoins(myBalance())
              .storeRef(null)
              .endCell()
      });

      send(SendParameters{
          to: multi_sender_address,
          mode: SendPayGasSeparately,
          bounce: false,
          body: msg.forward_payload
      });
    }
  }

  inline fun get_init_code_for_multisender(owner: Address): StateInit {
    return initOf Multisender(owner, myAddress());
  }
}

contract Multisender with Ownable {
  owner: Address;
  master: Address;

  init(owner: Address, master: Address) {
    self.owner = owner;
    self.master = master;
  }

  receive(msg: MultiSendNotification) {
    let addresses_amounts: map<Address, Int as coins> = msg.addresses_amounts;
    let total_jetton: Int = 0;

    foreach(key, value in addresses_amounts) {
      total_jetton += value;
    }
  }
}