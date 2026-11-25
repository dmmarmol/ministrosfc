export interface MinistrosRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function emptyRecord(): MinistrosRecord {
  return {
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
  };
}

/** Ministros FC's record from completed games (home score is always Ministros FC). */
export function tallyRecord(
  games: { homeTeamScore: number | null; awayTeamScore: number | null }[],
): MinistrosRecord {
  const record = emptyRecord();
  for (const game of games) {
    if (game.homeTeamScore === null || game.awayTeamScore === null) continue;
    record.played++;
    record.goalsFor += game.homeTeamScore;
    record.goalsAgainst += game.awayTeamScore;
    if (game.homeTeamScore > game.awayTeamScore) record.wins++;
    else if (game.homeTeamScore === game.awayTeamScore) record.draws++;
    else record.losses++;
  }
  record.goalDifference = record.goalsFor - record.goalsAgainst;
  return record;
}
