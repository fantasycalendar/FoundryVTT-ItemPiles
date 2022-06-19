class Transaction {

  constructor(party_1, party_2) {
    this.id = randomID();
    this.privateId = randomID();
    this.party_1 = party_1;
    this.party_2 = party_2;
    this.party_1_offers = [];
    this.party_2_offers = [];
  }


  handshake() {
    
  }

  commit() {


  }

}