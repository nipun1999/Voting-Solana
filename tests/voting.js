const assert = require('assert');
const anchor = require('@project-serum/anchor');
const { SystemProgram } = anchor.web3;

describe('voting', () => {

  // Configure the client to use the local cluster.
  const provider = anchor.Provider.local();
  anchor.setProvider(provider);

  const ballot = anchor.web3.Keypair.generate();
  const program = anchor.workspace.Voting;
  const voter1 = anchor.web3.Keypair.generate();
  const voter2 = anchor.web3.Keypair.generate();
  const voter3 = anchor.web3.Keypair.generate();


  it('Creates a ballot', async () => {
    await program.rpc.create({
      accounts: {
        ballot: ballot.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [ballot]
    });
    const account = await program.account.ballot.fetch(ballot.publicKey);
    assert.equal(account.candidate1,0);
    assert.equal(account.candidate2,0);
  });

  it('Adds first voter', async () => {
    await program.rpc.addVoter("Voter 1",voter1.publicKey,{
      accounts: {
        voter: voter1.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [voter1]
    });
    const voterAccount = await program.account.voter.fetch(voter1.publicKey);
    assert.equal(voterAccount.votes,1);
  });

  it('Adds second voter', async () => {
    await program.rpc.addVoter("Voter 2",voter2.publicKey,{
      accounts: {
        voter: voter2.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [voter2]
    });
    const voterAccount = await program.account.voter.fetch(voter2.publicKey);
    assert.equal(voterAccount.votes,1);
  });

  it('casts vote voter 2', async () => {
    await program.rpc.castVote(0,{
      accounts: {
        ballot: ballot.publicKey,
        voter: voter2.publicKey,
        signer: voter2.publicKey,
      },
      signers: [voter2]
    });
    const ballotAccount = await program.account.ballot.fetch(ballot.publicKey);
    const voter2Account = await program.account.voter.fetch(voter2.publicKey);
    assert.equal(ballotAccount.candidate1,1);
    assert.equal(voter2Account.votes,0);
  });

  it('casts vote illegal', async () => {
    try{
      await program.rpc.castVote(0,{
        accounts: {
          ballot: ballot.publicKey,
          voter: voter2.publicKey,
          signer: voter2.publicKey,
        },
        signers: [voter3]
      });
    }catch (err) {
    }
  });

  it('Delegate votes', async () => {
    await program.rpc.delegateVote({
      accounts: {
        voteDelegator: voter1.publicKey,
        voteReceiver: voter2.publicKey,
        signer: voter1.publicKey,
      },
      signers: [voter1]
    });
    const voter1Account = await program.account.voter.fetch(voter1.publicKey);
    const voter2Account = await program.account.voter.fetch(voter2.publicKey);
    assert.equal(voter1Account.votes,0);
    assert.equal(voter2Account.votes,1);
  });

  it('Illegal vote voter1', async () => {
    try{
      await program.rpc.castVote(1,{
        accounts: {
          ballot: ballot.publicKey,
          voter: voter1.publicKey,
          signer: voter1.publicKey,
        },
        signers: [voter1]
      });
      const ballotAccount = await program.account.ballot.fetch(ballot.publicKey);
      const voter1Account = await program.account.voter.fetch(voter1.publicKey);
    }catch(err){
      console.log('Illegal vote voter1')
    }
  });

  it('legal vote voter2', async () => {
    await program.rpc.castVote(0,{
      accounts: {
        ballot: ballot.publicKey,
        voter: voter2.publicKey,
        signer: voter2.publicKey,
      },
      signers: [voter2]
    });
    const ballotAccount = await program.account.ballot.fetch(ballot.publicKey);
    const voter2Account = await program.account.voter.fetch(voter2.publicKey);
    assert.equal(ballotAccount.candidate1,2);
    assert.equal(ballotAccount.candidate2,0);
    assert.equal(voter2Account.votes,0);
  });

  it('candidate 1 is declared winner', async () => {
    const ballotAccount = await program.account.ballot.fetch(ballot.publicKey);
    assert.equal(ballotAccount.candidate1,2);
    assert.equal(ballotAccount.candidate2,0);
  });

});
