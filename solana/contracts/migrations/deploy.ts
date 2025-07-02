import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  anchor.setProvider(provider);
  const program = anchor.workspace.Unikron as anchor.Program<any>;
  console.log(program)
  console.log("Deploy script executed. Program ID:", program.programId.toBase58());
};