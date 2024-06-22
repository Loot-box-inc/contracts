import "../structures/multisend";

message(0x445) MultiSend {
  query_id: Int as uint64;
  jetton: Address;
  recipients: Recipients;
}

message(0x7362d09c) JettonTransferNotification {
  query_id: Int as uint64;
  amount: Int as coins;
  sender: Address;
  forward_payload: Cell;
}