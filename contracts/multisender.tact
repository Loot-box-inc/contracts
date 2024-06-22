import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages/multisender";

contract Multisender with Deployable, Ownable {
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
    let payload: Cell = msg.forward_payload;
    let balance: Int = myBalance();
  }
}