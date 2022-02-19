use anchor_lang::prelude::*;

declare_id!("H6TMQ3vkvJzmx9ESqWrtvbqNJhH5QwNuERdWK13nkgT7");

#[program]
pub mod voting {
    use super::*;
    pub fn create(ctx: Context<CreateBallot>) -> ProgramResult {
        let ballot = &mut ctx.accounts.ballot;
        ballot.candidate1 = 0;
        ballot.candidate2 = 0;
        Ok(())
    }
    pub fn add_voter(ctx: Context<AddVoter>,name: String, key: Pubkey) -> ProgramResult {
        let voter = &mut ctx.accounts.voter;
        voter.name = name;
        voter.votes = 1;
        voter.key = key;
        Ok(())
    }
    pub fn cast_vote(ctx: Context<CastVote>,candidate: u8) -> ProgramResult {
        let ballot = &mut ctx.accounts.ballot;
        let voter = &mut ctx.accounts.voter;
        let votes = voter.votes;
        let candidate1votes = ballot.candidate1;
        let candidate2votes = ballot.candidate2;
        if votes <= 0 {
            return Err(ErrorCode::Voter.into());
        }
        match candidate {
            0 => ballot.candidate1 = candidate1votes+1,
            1 => ballot.candidate2 = candidate2votes+1,
            _ => ballot.candidate1 = candidate1votes
        }
        voter.votes = votes - 1;
        Ok(())
    }

    pub fn delegate_vote(ctx: Context<DelegateVote>) -> ProgramResult {
        let vote_delegator = &mut ctx.accounts.vote_delegator;
        let vote_receiver = &mut ctx.accounts.vote_receiver;
        let votes_delegator = vote_delegator.votes;
        let votes_receiver = vote_receiver.votes;
        if votes_delegator <= 0 {
            return Err(ErrorCode::Voter.into());
        }
        vote_delegator.votes = votes_delegator - 1;
        vote_receiver.votes = votes_receiver + 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct DeclareResult<'info> {
    pub ballot: Account<'info, Ballot>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct DelegateVote<'info> {
    #[account(mut)]
    pub vote_delegator: Account<'info, Voter>,
    #[account(mut)]
    pub vote_receiver: Account<'info, Voter>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub ballot: Account<'info, Ballot>,
    #[account(mut)]
    pub voter: Account<'info, Voter>,
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateBallot<'info> {
    #[account(init, payer = user, space = 8 + 64 + 64 + 64 + 64)]
    pub ballot: Account<'info, Ballot>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddVoter<'info> {
    #[account(init, payer = user, space = 8 + 64 + 64 + 64 + 64)]
    pub voter: Account<'info, Voter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Voter {
    pub name: String,
    pub votes: u8,
    pub key: Pubkey
}

#[account]
pub struct Ballot {
    pub candidate1: u8,
    pub candidate2: u8
}

#[error]
pub enum ErrorCode {
    #[msg("Insufficient Votes")]
    Voter,
}

