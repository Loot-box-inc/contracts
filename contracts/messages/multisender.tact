import "../structures/multisend";

message(0x445) MultiSendNotification {
  query_id: Int as uint64;
  addresses_amounts: map<Address, Int as coins>;
}

message(0x7362d09c) JettonTransferNotification {
  query_id: Int as uint64;
  amount: Int as coins;
  sender: Address;
  forward_payload: Cell;
}