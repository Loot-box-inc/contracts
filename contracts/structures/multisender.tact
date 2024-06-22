
struct Recipients {
  addresses: map<Int as uint256, Address>;
  length: Int as uint256 = 0;
  
}

extends fun deriveLength(self: Recipients): Int {
  let addresses: map<Int as uint256, Address> = self.addresses;
  
  foreach(_, value in addresses) {
    if (value != null) {
      self.length += 1;
    }
  }
  return self.length; 
}

extends fun mapToPositions(self: Recipients): map<Int as uint256, Address> {
  let addresses: map<Int as uint256, Address> = self.addresses;
  let positionsToAddresses: map<Int as uint256, Address> = emptyMap();

  let position: Int = 0;

  foreach(_, value in addresses) {
    positionsToAddresses.set(position, value);
    position += 1;
  }

  return positionsToAddresses;
}