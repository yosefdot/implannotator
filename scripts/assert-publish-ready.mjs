const expected = "I_CONFIRMED_IMPECCABLE_REDISTRIBUTION_RIGHTS";
if (process.env.IMPLANNOTATOR_PUBLISH_ACK !== expected) {
  console.error("Publishing blocked: confirm the redistribution license/attribution for the adapted Impeccable snapshot, then set IMPLANNOTATOR_PUBLISH_ACK=I_CONFIRMED_IMPECCABLE_REDISTRIBUTION_RIGHTS for the release command.");
  process.exit(1);
}
console.log("Explicit redistribution acknowledgement received.");
