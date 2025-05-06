import { MatchupLineups, Player, TeamLineup, LeagueAvgStats } from "@/types/mlb";

// ---------- League Avg Stats ----------
const leagueAvgStats: LeagueAvgStats = {
  RhitLpitch: {
    adj_perc_K: 0.2190944062,
    adj_perc_BB: 0.09261766254,
    adj_perc_1B: 0.1451620454,
    adj_perc_2B: 0.04720188273,
    adj_perc_3B: 0.00276747716,
    adj_perc_HR: 0.03344016655,
    adj_perc_OUT: 0.4597163594
  },
  RhitRpitch: {
    adj_perc_K: 0.2347982981, 
    adj_perc_BB: 0.08075117622,
    adj_perc_1B: 0.1462158568,
    adj_perc_2B: 0.04237045084,
    adj_perc_3B: 0.003556149551,
    adj_perc_HR: 0.03118351821,
    adj_perc_OUT: 0.4611245503
  },
  LhitLpitch: {
    adj_perc_K: 0.2364642937,
    adj_perc_BB: 0.08727466555,
    adj_perc_1B: 0.1493930002,
    adj_perc_2B: 0.03823530677,
    adj_perc_3B: 0.002631548058,
    adj_perc_HR: 0.02428463653,
    adj_perc_OUT: 0.4617165492
  },
  LhitRpitch: {
    adj_perc_K: 0.220251764,
    adj_perc_BB: 0.1034090297,
    adj_perc_1B: 0.1412790864,
    adj_perc_2B: 0.04451635698,
    adj_perc_3B: 0.004986956744,
    adj_perc_HR: 0.03390436854,
    adj_perc_OUT: 0.4516524376
  }
}

export { leagueAvgStats };

// ---------- San Francisco Giants ----------
// ----- Starting Pitcher -----
const giantsStartingPitcher: Player = {
  id: 694738,
  name: "Landen Roupp",
  position: "SP",
  pitchingSide: "R",
  stats: {
    pitchVsL: {
      adj_perc_K: 0.227,
      adj_perc_BB: 0.116,
      adj_perc_1B: 0.141,
      adj_perc_2B: 0.043,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.028,
      adj_perc_OUT: 0.439
    },
    pitchVsR: {
      adj_perc_K: 0.233,
      adj_perc_BB: 0.104,
      adj_perc_1B: 0.148,
      adj_perc_2B: 0.041,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.025,
      adj_perc_OUT: 0.445
    },
  },
};

// ----- Starting lineup -----
const heliotRamos: Player = {
  id: 671218,
  name: "Heliot Ramos",
  position: "RF",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.248,
      adj_perc_BB: 0.092,
      adj_perc_1B: 0.140,
      adj_perc_2B: 0.047,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.036,
      adj_perc_OUT: 0.433
    },
    hitVsR: {
      adj_perc_K: 0.265,
      adj_perc_BB: 0.084,
      adj_perc_1B: 0.142,
      adj_perc_2B: 0.040,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.032,
      adj_perc_OUT: 0.432
    }
  }
};

const willyAdames: Player = {
  id: 642715,
  name: "Willy Adames",
  position: "SS",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.239,
      adj_perc_BB: 0.124,
      adj_perc_1B: 0.121,
      adj_perc_2B: 0.052,
      adj_perc_3B: 0.001,
      adj_perc_HR: 0.033,
      adj_perc_OUT: 0.430
    },
    hitVsR: {
      adj_perc_K: 0.234,
      adj_perc_BB: 0.108,
      adj_perc_1B: 0.129,
      adj_perc_2B: 0.049,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.033,
      adj_perc_OUT: 0.446
    }
  }
};

const jungHooLee: Player = {
  id: 808982,
  name: "Jung Hoo Lee",
  position: "CF",
  battingSide: "L",
  stats: {
    hitVsL: {
      adj_perc_K: 0.116,
      adj_perc_BB: 0.073,
      adj_perc_1B: 0.190,
      adj_perc_2B: 0.050,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.015,
      adj_perc_OUT: 0.552
    },
    hitVsR: {
      adj_perc_K: 0.105,
      adj_perc_BB: 0.089,
      adj_perc_1B: 0.178,
      adj_perc_2B: 0.057,
      adj_perc_3B: 0.009,
      adj_perc_HR: 0.021,
      adj_perc_OUT: 0.540
    }
  }
};

const mattChapman: Player = {
  id: 656305,
  name: "Matt Chapman",
  position: "3B",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.232,
      adj_perc_BB: 0.139,
      adj_perc_1B: 0.119,
      adj_perc_2B: 0.052,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.039,
      adj_perc_OUT: 0.418
    },
    hitVsR: {
      adj_perc_K: 0.262,
      adj_perc_BB: 0.126,
      adj_perc_1B: 0.117,
      adj_perc_2B: 0.046,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.035,
      adj_perc_OUT: 0.411
    }
  }
};

const wilmerFlores: Player = {
  id: 527038,
  name: "Wilmer Flores",
  position: "1B",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.171,
      adj_perc_BB: 0.100,
      adj_perc_1B: 0.137,
      adj_perc_2B: 0.045,
      adj_perc_3B: 0.001,
      adj_perc_HR: 0.037,
      adj_perc_OUT: 0.508
    },
    hitVsR: {
      adj_perc_K: 0.171,
      adj_perc_BB: 0.101,
      adj_perc_1B: 0.140,
      adj_perc_2B: 0.040,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.034,
      adj_perc_OUT: 0.513
    }
  }
};

const luisMatos: Player = {
  id: 682641,
  name: "Luis Matos",
  position: "LF",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.130,
      adj_perc_BB: 0.078,
      adj_perc_1B: 0.151,
      adj_perc_2B: 0.052,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.031,
      adj_perc_OUT: 0.556
    },
    hitVsR: {
      adj_perc_K: 0.135,
      adj_perc_BB: 0.074,
      adj_perc_1B: 0.154,
      adj_perc_2B: 0.047,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.029,
      adj_perc_OUT: 0.560
    }
  }
};

const davidVillar: Player = {
  id: 681584,
  name: "David Villar",
  position: "2B",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.286,
      adj_perc_BB: 0.111,
      adj_perc_1B: 0.122,
      adj_perc_2B: 0.048,
      adj_perc_3B: 0.001,
      adj_perc_HR: 0.033,
      adj_perc_OUT: 0.398
    },
    hitVsR: {
      adj_perc_K: 0.301,
      adj_perc_BB: 0.107,
      adj_perc_1B: 0.122,
      adj_perc_2B: 0.042,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.030,
      adj_perc_OUT: 0.396
    }
  }
};

const patrickBailey: Player = {
  id: 672275,
  name: "Patrick Bailey",
  position: "C",
  battingSide: "B",
  stats: {
    hitVsL: {
      adj_perc_K: 0.264,
      adj_perc_BB: 0.083,
      adj_perc_1B: 0.147,
      adj_perc_2B: 0.043,
      adj_perc_3B: 0.002,
      adj_perc_HR: 0.018,
      adj_perc_OUT: 0.442
    },
    hitVsR: {
      adj_perc_K: 0.247,
      adj_perc_BB: 0.090,
      adj_perc_1B: 0.139,
      adj_perc_2B: 0.042,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.021,
      adj_perc_OUT: 0.456
    }
  }
};

const christianKoss: Player = {
  id: 683766,
  name: "Christian Koss",
  position: "DH",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.230,
      adj_perc_BB: 0.068,
      adj_perc_1B: 0.148,
      adj_perc_2B: 0.051,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.017,
      adj_perc_OUT: 0.483
    },
    hitVsR: {
      adj_perc_K: 0.243,
      adj_perc_BB: 0.067,
      adj_perc_1B: 0.147,
      adj_perc_2B: 0.044,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.015,
      adj_perc_OUT: 0.479
    }
  }
};

const giantsLineup: Player[] = [
  heliotRamos,
  willyAdames,
  jungHooLee,
  mattChapman,
  wilmerFlores,
  luisMatos,
  davidVillar,
  patrickBailey,
  christianKoss
];

// ----- Full team -----
const sanFranciscoGiants: TeamLineup = {
  lineup: giantsLineup,
  startingPitcher: giantsStartingPitcher,
  bullpen: [],
};

// ---------- Chicago Cubs ----------
// ----- Starting Pitcher -----
const chicagoCubsStartingPitcher: Player = {
  id: 571510,
  name: "Matthew Boyd",
  position: "SP",
  pitchingSide: "L",
  stats: {
    pitchVsL: {
      adj_perc_K: 0.249,
      adj_perc_BB: 0.092,
      adj_perc_1B: 0.141,
      adj_perc_2B: 0.037,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.024,
      adj_perc_OUT: 0.453
    },
    pitchVsR: {
      adj_perc_K: 0.220,
      adj_perc_BB: 0.097,
      adj_perc_1B: 0.140,
      adj_perc_2B: 0.048,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.035,
      adj_perc_OUT: 0.456
    },
  },
};
  
// ----- Starting lineup -----
const ianHapp: Player = {
  id: 664023,
  name: "Ian Happ",
  position: "2B",
  battingSide: "B",
  stats: {
    hitVsL: {
      adj_perc_K: 0.230,
      adj_perc_BB: 0.108,
      adj_perc_1B: 0.149,
      adj_perc_2B: 0.049,
      adj_perc_3B: 0.001,
      adj_perc_HR: 0.026,
      adj_perc_OUT: 0.437
    },
    hitVsR: {
      adj_perc_K: 0.226,
      adj_perc_BB: 0.142,
      adj_perc_1B: 0.128,
      adj_perc_2B: 0.047,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.032,
      adj_perc_OUT: 0.422
    }
  }
}

const kyleTucker: Player = {
  id: 663656,
  name: "Kyle Tucker",
  position: "RF",
  battingSide: "L",
  stats: {
    hitVsL: {
      adj_perc_K: 0.146,
      adj_perc_BB: 0.113,
      adj_perc_1B: 0.145,
      adj_perc_2B: 0.042,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.045,
      adj_perc_OUT: 0.505
    },
    hitVsR: {
      adj_perc_K: 0.148,
      adj_perc_BB: 0.149,
      adj_perc_1B: 0.137,
      adj_perc_2B: 0.047,
      adj_perc_3B: 0.007,
      adj_perc_HR: 0.047,
      adj_perc_OUT: 0.465
    }
  }
}

const seiyaSuzuki: Player = {
  id: 673548,
  name: "Seiya Suzuki",
  position: "DH",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.220,
      adj_perc_BB: 0.130,
      adj_perc_1B: 0.143,
      adj_perc_2B: 0.045,
      adj_perc_3B: 0.006,
      adj_perc_HR: 0.040,
      adj_perc_OUT: 0.416
    },
    hitVsR: {
      adj_perc_K: 0.271,
      adj_perc_BB: 0.109,
      adj_perc_1B: 0.138,
      adj_perc_2B: 0.038,
      adj_perc_3B: 0.008,
      adj_perc_HR: 0.036,
      adj_perc_OUT: 0.400
    }
  }
}

const michaelBusch: Player = {
  id: 683737,
  name: "Michael Busch",
  position: "1B",
  battingSide: "L",
  stats: {
    hitVsL: {
      adj_perc_K: 0.278,
      adj_perc_BB: 0.104,
      adj_perc_1B: 0.134,
      adj_perc_2B: 0.042,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.024,
      adj_perc_OUT: 0.416
    },
    hitVsR: {
      adj_perc_K: 0.267,
      adj_perc_BB: 0.120,
      adj_perc_1B: 0.123,
      adj_perc_2B: 0.046,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.039,
      adj_perc_OUT: 0.400
    }
  }
};

const nicoHoerner: Player = {
  id: 663538,
  name: "Nico Hoerner",
  position: "SS",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.098,
      adj_perc_BB: 0.084,
      adj_perc_1B: 0.193,
      adj_perc_2B: 0.052,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.014,
      adj_perc_OUT: 0.555
    },
    hitVsR: {
      adj_perc_K: 0.110,
      adj_perc_BB: 0.087,
      adj_perc_1B: 0.189,
      adj_perc_2B: 0.046,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.013,
      adj_perc_OUT: 0.551
    }
  }
};

const peteCrowArmstrong: Player = {
  id: 691718,
  name: "Pete Crow-Armstrong",
  position: "CF",
  battingSide: "L",
  stats: {
    hitVsL: {
      adj_perc_K: 0.252,
      adj_perc_BB: 0.058,
      adj_perc_1B: 0.149,
      adj_perc_2B: 0.041,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.028,
      adj_perc_OUT: 0.468
    },
    hitVsR: {
      adj_perc_K: 0.234,
      adj_perc_BB: 0.075,
      adj_perc_1B: 0.140,
      adj_perc_2B: 0.046,
      adj_perc_3B: 0.010,
      adj_perc_HR: 0.036,
      adj_perc_OUT: 0.459
    }
  }
};

const carsonKelly: Player = {
  id: 608348,
  name: "Carson Kelly",
  position: "C",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.174,
      adj_perc_BB: 0.123,
      adj_perc_1B: 0.140,
      adj_perc_2B: 0.039,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.037,
      adj_perc_OUT: 0.484
    },
    hitVsR: {
      adj_perc_K: 0.191,
      adj_perc_BB: 0.115,
      adj_perc_1B: 0.141,
      adj_perc_2B: 0.033,
      adj_perc_3B: 0.005,
      adj_perc_HR: 0.034,
      adj_perc_OUT: 0.481
    }
  }
};

const dansbySwanson: Player = {
  id: 621020,
  name: "Dansby Swanson",
  position: "2B",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.233,
      adj_perc_BB: 0.102,
      adj_perc_1B: 0.143,
      adj_perc_2B: 0.044,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.034,
      adj_perc_OUT: 0.441
    },
    hitVsR: {
      adj_perc_K: 0.257,
      adj_perc_BB: 0.092,
      adj_perc_1B: 0.141,
      adj_perc_2B: 0.039,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.030,
      adj_perc_OUT: 0.437
    }
  }
};

const jonBerti: Player = {
  id: 542932,
  name: "Jon Berti",
  position: "3B",
  battingSide: "R",
  stats: {
    hitVsL: {
      adj_perc_K: 0.213,
      adj_perc_BB: 0.094,
      adj_perc_1B: 0.170,
      adj_perc_2B: 0.040,
      adj_perc_3B: 0.003,
      adj_perc_HR: 0.015,
      adj_perc_OUT: 0.464
    },
    hitVsR: {
      adj_perc_K: 0.216,
      adj_perc_BB: 0.092,
      adj_perc_1B: 0.172,
      adj_perc_2B: 0.035,
      adj_perc_3B: 0.004,
      adj_perc_HR: 0.014,
      adj_perc_OUT: 0.467
    }
  }
};

const cubsLineup: Player[] = [
  ianHapp,
  kyleTucker,
  seiyaSuzuki,
  michaelBusch,
  nicoHoerner,
  peteCrowArmstrong,
  carsonKelly,
  dansbySwanson,
  jonBerti
];

// ----- Bullpen -----

// ----- Full team -----
const chicagoCubs: TeamLineup = {
  lineup: cubsLineup,
  startingPitcher: chicagoCubsStartingPitcher,
  bullpen: [],
};

// ---------- Matchup ----------
const matchup: MatchupLineups = {
  away: sanFranciscoGiants,
  home: chicagoCubs,
};

export { matchup };