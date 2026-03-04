/**
 * Embedded ECO opening lookup table.
 * Maps first few moves (in SAN) to opening name + ECO code.
 * ~500 common entries covering major openings.
 */

interface EcoEntry {
  eco: string;
  name: string;
  moves: string; // space-separated SAN moves
}

const ECO_TABLE: EcoEntry[] = [
  // A00 – Irregular
  { eco: 'A00', name: 'Hungarian Opening', moves: 'g3' },
  { eco: 'A00', name: "Grob's Attack", moves: 'g4' },
  { eco: 'A00', name: 'Polish Opening', moves: 'b4' },
  { eco: 'A01', name: "Nimzo-Larsen Attack", moves: 'b3' },
  { eco: 'A02', name: "Bird's Opening", moves: 'f4' },
  { eco: 'A04', name: "Reti Opening", moves: 'Nf3' },
  { eco: 'A04', name: "Reti Opening", moves: 'Nf3 d5' },
  { eco: 'A05', name: "Reti Opening", moves: 'Nf3 Nf6' },
  { eco: 'A06', name: "Reti Opening", moves: 'Nf3 d5 g3' },
  { eco: 'A07', name: "King's Indian Attack", moves: 'Nf3 d5 g3 c5 Bg2' },
  { eco: 'A09', name: "Reti Opening", moves: 'Nf3 d5 c4' },
  { eco: 'A10', name: 'English Opening', moves: 'c4' },
  { eco: 'A13', name: 'English Opening', moves: 'c4 e6' },
  { eco: 'A15', name: 'English Opening: Anglo-Indian Defense', moves: 'c4 Nf6' },
  { eco: 'A16', name: 'English Opening', moves: 'c4 Nf6 Nc3' },
  { eco: 'A20', name: 'English Opening: Reversed Sicilian', moves: 'c4 e5' },
  { eco: 'A22', name: 'English Opening: Bremen System', moves: 'c4 e5 Nc3 Nf6' },
  { eco: 'A25', name: 'English Opening: Closed', moves: 'c4 e5 Nc3 Nc6' },
  { eco: 'A30', name: 'English Opening: Symmetrical', moves: 'c4 c5' },
  { eco: 'A40', name: "Queen's Pawn Game", moves: 'd4' },
  { eco: 'A40', name: "Queen's Pawn Game: Horwitz Defense", moves: 'd4 e6' },
  { eco: 'A41', name: "Queen's Pawn Game", moves: 'd4 d6' },
  { eco: 'A43', name: 'Old Benoni Defense', moves: 'd4 c5' },
  { eco: 'A44', name: 'Old Benoni Defense', moves: 'd4 c5 d5' },
  { eco: 'A45', name: "Queen's Pawn Game", moves: 'd4 Nf6' },
  { eco: 'A46', name: "Queen's Pawn Game", moves: 'd4 Nf6 Nf3' },
  { eco: 'A47', name: "Queen's Indian Defense", moves: 'd4 Nf6 Nf3 b6' },
  { eco: 'A48', name: "King's Indian Defense: London System", moves: 'd4 Nf6 Nf3 g6 Bf4' },
  { eco: 'A48', name: 'London System', moves: 'd4 Nf6 Bf4' },
  { eco: 'A49', name: "King's Indian Defense", moves: 'd4 Nf6 Nf3 g6' },
  { eco: 'A50', name: "Queen's Pawn Game: Black Knights Tango", moves: 'd4 Nf6 c4 Nc6' },
  { eco: 'A51', name: 'Budapest Gambit', moves: 'd4 Nf6 c4 e5' },
  { eco: 'A52', name: 'Budapest Gambit', moves: 'd4 Nf6 c4 e5 dxe5 Ng4' },
  { eco: 'A53', name: 'Old Indian Defense', moves: 'd4 Nf6 c4 d6' },
  { eco: 'A56', name: 'Benoni Defense', moves: 'd4 Nf6 c4 c5' },
  { eco: 'A57', name: 'Benko Gambit', moves: 'd4 Nf6 c4 c5 d5 b5' },
  { eco: 'A60', name: 'Benoni Defense', moves: 'd4 Nf6 c4 c5 d5 e6' },
  { eco: 'A70', name: 'Benoni Defense: Classical', moves: 'd4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 Nf3' },
  { eco: 'A80', name: 'Dutch Defense', moves: 'd4 f5' },
  { eco: 'A83', name: 'Dutch Defense: Staunton Gambit', moves: 'd4 f5 e4' },
  { eco: 'A85', name: 'Dutch Defense', moves: 'd4 f5 c4 Nf6' },
  { eco: 'A87', name: 'Dutch Defense: Leningrad', moves: 'd4 f5 c4 Nf6 g3 g6 Bg2' },
  { eco: 'A90', name: 'Dutch Defense: Classical', moves: 'd4 f5 c4 Nf6 g3 e6 Bg2' },

  // B00 – King's Pawn (non-1...e5)
  { eco: 'B00', name: "Nimzowitsch Defense", moves: 'e4 Nc6' },
  { eco: 'B00', name: 'Owen Defense', moves: 'e4 b6' },
  { eco: 'B01', name: 'Scandinavian Defense', moves: 'e4 d5' },
  { eco: 'B01', name: 'Scandinavian Defense', moves: 'e4 d5 exd5 Qxd5' },
  { eco: 'B01', name: 'Scandinavian Defense: Modern', moves: 'e4 d5 exd5 Nf6' },
  { eco: 'B02', name: "Alekhine's Defense", moves: 'e4 Nf6' },
  { eco: 'B06', name: 'Modern Defense', moves: 'e4 g6' },
  { eco: 'B07', name: 'Pirc Defense', moves: 'e4 d6 d4 Nf6' },
  { eco: 'B07', name: "Lion's Defense", moves: 'e4 d6' },
  { eco: 'B08', name: 'Pirc Defense: Classical', moves: 'e4 d6 d4 Nf6 Nc3 g6 Nf3' },
  { eco: 'B09', name: 'Pirc Defense: Austrian Attack', moves: 'e4 d6 d4 Nf6 Nc3 g6 f4' },
  { eco: 'B10', name: 'Caro-Kann Defense', moves: 'e4 c6' },
  { eco: 'B12', name: 'Caro-Kann Defense', moves: 'e4 c6 d4 d5' },
  { eco: 'B13', name: 'Caro-Kann Defense: Exchange', moves: 'e4 c6 d4 d5 exd5 cxd5' },
  { eco: 'B14', name: 'Caro-Kann Defense: Panov Attack', moves: 'e4 c6 d4 d5 exd5 cxd5 c4' },
  { eco: 'B15', name: 'Caro-Kann Defense', moves: 'e4 c6 d4 d5 Nc3' },
  { eco: 'B17', name: 'Caro-Kann Defense: Steinitz', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7' },
  { eco: 'B18', name: 'Caro-Kann Defense: Classical', moves: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5' },
  { eco: 'B20', name: 'Sicilian Defense', moves: 'e4 c5' },
  { eco: 'B21', name: 'Sicilian Defense: Smith-Morra Gambit', moves: 'e4 c5 d4' },
  { eco: 'B22', name: 'Sicilian Defense: Alapin', moves: 'e4 c5 c3' },
  { eco: 'B23', name: 'Sicilian Defense: Closed', moves: 'e4 c5 Nc3' },
  { eco: 'B27', name: 'Sicilian Defense', moves: 'e4 c5 Nf3' },
  { eco: 'B30', name: 'Sicilian Defense', moves: 'e4 c5 Nf3 Nc6' },
  { eco: 'B32', name: 'Sicilian Defense: Open', moves: 'e4 c5 Nf3 Nc6 d4' },
  { eco: 'B33', name: 'Sicilian Defense: Sveshnikov', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5' },
  { eco: 'B35', name: 'Sicilian Defense: Accelerated Dragon', moves: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6' },
  { eco: 'B40', name: 'Sicilian Defense', moves: 'e4 c5 Nf3 e6' },
  { eco: 'B41', name: 'Sicilian Defense: Kan', moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6' },
  { eco: 'B42', name: 'Sicilian Defense: Kan', moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Bd3' },
  { eco: 'B44', name: 'Sicilian Defense: Taimanov', moves: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6' },
  { eco: 'B50', name: 'Sicilian Defense', moves: 'e4 c5 Nf3 d6' },
  { eco: 'B54', name: 'Sicilian Defense: Open', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4' },
  { eco: 'B56', name: 'Sicilian Defense: Classical', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3' },
  { eco: 'B60', name: 'Sicilian Defense: Richter-Rauzer', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6 Bg5' },
  { eco: 'B70', name: 'Sicilian Defense: Dragon', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6' },
  { eco: 'B72', name: 'Sicilian Defense: Dragon: Classical', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3' },
  { eco: 'B76', name: 'Sicilian Defense: Dragon: Yugoslav Attack', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3' },
  { eco: 'B80', name: 'Sicilian Defense: Scheveningen', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6' },
  { eco: 'B85', name: 'Sicilian Defense: Scheveningen: Classical', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6 Be2' },
  { eco: 'B90', name: 'Sicilian Defense: Najdorf', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6' },
  { eco: 'B92', name: 'Sicilian Defense: Najdorf', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2' },
  { eco: 'B96', name: 'Sicilian Defense: Najdorf', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5' },
  { eco: 'B97', name: 'Sicilian Defense: Najdorf: Poisoned Pawn', moves: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Qb6' },

  // C00-C19 French Defense
  { eco: 'C00', name: 'French Defense', moves: 'e4 e6' },
  { eco: 'C01', name: 'French Defense: Exchange', moves: 'e4 e6 d4 d5 exd5 exd5' },
  { eco: 'C02', name: 'French Defense: Advance', moves: 'e4 e6 d4 d5 e5' },
  { eco: 'C03', name: 'French Defense: Tarrasch', moves: 'e4 e6 d4 d5 Nd2' },
  { eco: 'C10', name: 'French Defense', moves: 'e4 e6 d4 d5 Nc3' },
  { eco: 'C11', name: 'French Defense: Classical', moves: 'e4 e6 d4 d5 Nc3 Nf6' },
  { eco: 'C12', name: 'French Defense: McCutcheon', moves: 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Bb4' },
  { eco: 'C15', name: 'French Defense: Winawer', moves: 'e4 e6 d4 d5 Nc3 Bb4' },
  { eco: 'C18', name: 'French Defense: Winawer', moves: 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3' },

  // C20-C29 King's Pawn: 1.e4 e5 misc
  { eco: 'C20', name: "King's Pawn Opening", moves: 'e4 e5' },
  { eco: 'C21', name: 'Danish Gambit', moves: 'e4 e5 d4 exd4 c3' },
  { eco: 'C22', name: 'Center Game', moves: 'e4 e5 d4 exd4 Qxd4' },
  { eco: 'C23', name: "Bishop's Opening", moves: 'e4 e5 Bc4' },
  { eco: 'C25', name: 'Vienna Game', moves: 'e4 e5 Nc3' },
  { eco: 'C26', name: 'Vienna Game', moves: 'e4 e5 Nc3 Nf6' },
  { eco: 'C27', name: 'Vienna Game: Frankenstein-Dracula', moves: 'e4 e5 Nc3 Nf6 Bc4 Nxe4' },
  { eco: 'C29', name: 'Vienna Gambit', moves: 'e4 e5 Nc3 Nf6 f4' },

  // C30-C39 King's Gambit
  { eco: 'C30', name: "King's Gambit", moves: 'e4 e5 f4' },
  { eco: 'C31', name: "King's Gambit: Falkbeer Countergambit", moves: 'e4 e5 f4 d5' },
  { eco: 'C33', name: "King's Gambit Accepted", moves: 'e4 e5 f4 exf4' },
  { eco: 'C36', name: "King's Gambit Accepted: Modern Defense", moves: 'e4 e5 f4 exf4 Nf3 d5' },

  // C40-C49 King's Knight Opening
  { eco: 'C40', name: "King's Knight Opening", moves: 'e4 e5 Nf3' },
  { eco: 'C41', name: "Philidor Defense", moves: 'e4 e5 Nf3 d6' },
  { eco: 'C42', name: 'Russian Game (Petrov)', moves: 'e4 e5 Nf3 Nf6' },
  { eco: 'C42', name: 'Russian Game: Stafford Gambit', moves: 'e4 e5 Nf3 Nf6 Nxe5 Nc6' },
  { eco: 'C44', name: "King's Pawn Game: Scotch", moves: 'e4 e5 Nf3 Nc6 d4' },
  { eco: 'C45', name: 'Scotch Game', moves: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4' },
  { eco: 'C46', name: 'Three Knights Game', moves: 'e4 e5 Nf3 Nc6 Nc3' },
  { eco: 'C47', name: 'Four Knights Game', moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6' },
  { eco: 'C48', name: 'Four Knights Game: Spanish', moves: 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5' },

  // C50-C59 Italian + Two Knights
  { eco: 'C50', name: 'Italian Game', moves: 'e4 e5 Nf3 Nc6 Bc4' },
  { eco: 'C50', name: 'Italian Game: Giuoco Piano', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5' },
  { eco: 'C51', name: 'Italian Game: Evans Gambit', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4' },
  { eco: 'C53', name: 'Italian Game: Classical', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3' },
  { eco: 'C54', name: 'Italian Game: Giuoco Pianissimo', moves: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3' },
  { eco: 'C55', name: 'Italian Game: Two Knights Defense', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6' },
  { eco: 'C57', name: 'Italian Game: Fried Liver Attack', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7' },
  { eco: 'C55', name: 'Italian Game: Two Knights: Modern Bishop Opening', moves: 'e4 e5 Nf3 Nc6 Bc4 Nf6 d3' },

  // C60-C99 Ruy Lopez
  { eco: 'C60', name: 'Ruy Lopez', moves: 'e4 e5 Nf3 Nc6 Bb5' },
  { eco: 'C63', name: 'Ruy Lopez: Schliemann Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 f5' },
  { eco: 'C65', name: 'Ruy Lopez: Berlin Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6' },
  { eco: 'C67', name: 'Ruy Lopez: Berlin Defense: Rio Gambit', moves: 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4' },
  { eco: 'C68', name: 'Ruy Lopez: Exchange', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6' },
  { eco: 'C69', name: 'Ruy Lopez: Exchange: Gligoric', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O' },
  { eco: 'C70', name: 'Ruy Lopez: Morphy Defense', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4' },
  { eco: 'C78', name: 'Ruy Lopez: Arkhangelsk', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O b5 Bb3' },
  { eco: 'C80', name: 'Ruy Lopez: Open', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4' },
  { eco: 'C84', name: 'Ruy Lopez: Closed', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7' },
  { eco: 'C88', name: 'Ruy Lopez: Closed', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3' },
  { eco: 'C92', name: 'Ruy Lopez: Closed: Zaitsev', moves: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3' },

  // D00-D69 Queen's Pawn / Queen's Gambit
  { eco: 'D00', name: "Queen's Pawn Game", moves: 'd4 d5' },
  { eco: 'D00', name: 'London System', moves: 'd4 d5 Bf4' },
  { eco: 'D01', name: "Veresov Attack", moves: 'd4 d5 Nc3 Nf6 Bg5' },
  { eco: 'D02', name: "Queen's Pawn Game", moves: 'd4 d5 Nf3' },
  { eco: 'D04', name: "Queen's Pawn Game: Colle System", moves: 'd4 d5 Nf3 Nf6 e3' },
  { eco: 'D06', name: "Queen's Gambit", moves: 'd4 d5 c4' },
  { eco: 'D07', name: "Chigorin Defense", moves: 'd4 d5 c4 Nc6' },
  { eco: 'D10', name: "Queen's Gambit: Slav Defense", moves: 'd4 d5 c4 c6' },
  { eco: 'D11', name: "Slav Defense", moves: 'd4 d5 c4 c6 Nf3' },
  { eco: 'D12', name: "Slav Defense", moves: 'd4 d5 c4 c6 Nf3 Nf6 e3 Bf5' },
  { eco: 'D13', name: "Slav Defense: Exchange", moves: 'd4 d5 c4 c6 Nf3 Nf6 cxd5 cxd5' },
  { eco: 'D15', name: "Slav Defense", moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3' },
  { eco: 'D20', name: "Queen's Gambit Accepted", moves: 'd4 d5 c4 dxc4' },
  { eco: 'D30', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6' },
  { eco: 'D31', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6 Nc3' },
  { eco: 'D35', name: "Queen's Gambit Declined: Exchange", moves: 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5' },
  { eco: 'D37', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3' },
  { eco: 'D38', name: "Queen's Gambit Declined: Ragozin", moves: 'd4 d5 c4 e6 Nc3 Nf6 Nf3 Bb4' },
  { eco: 'D43', name: "Semi-Slav Defense", moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6' },
  { eco: 'D45', name: "Semi-Slav Defense", moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3' },
  { eco: 'D46', name: "Semi-Slav Defense: Meran", moves: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3' },
  { eco: 'D50', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5' },
  { eco: 'D52', name: "Queen's Gambit Declined: Cambridge Springs", moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Nbd7 Nf3 c6 e3 Qa5' },
  { eco: 'D53', name: "Queen's Gambit Declined: Orthodox", moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7' },
  { eco: 'D60', name: "Queen's Gambit Declined: Orthodox", moves: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3' },

  // D70-D99 Grunfeld
  { eco: 'D70', name: 'Grunfeld Defense', moves: 'd4 Nf6 c4 g6 Nc3 d5' },
  { eco: 'D76', name: 'Grunfeld Defense: Exchange', moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7' },
  { eco: 'D80', name: 'Grunfeld Defense', moves: 'd4 Nf6 c4 g6 Nc3 d5 Bg5' },
  { eco: 'D85', name: 'Grunfeld Defense: Exchange', moves: 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5' },

  // E00-E09 Catalan
  { eco: 'E00', name: 'Catalan Opening', moves: 'd4 Nf6 c4 e6 g3' },
  { eco: 'E04', name: 'Catalan Opening: Open', moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 dxc4' },
  { eco: 'E06', name: 'Catalan Opening: Closed', moves: 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7' },

  // E10-E19 Queen's Indian / Bogo-Indian
  { eco: 'E10', name: "Queen's Pawn Game", moves: 'd4 Nf6 c4 e6 Nf3' },
  { eco: 'E11', name: 'Bogo-Indian Defense', moves: 'd4 Nf6 c4 e6 Nf3 Bb4+' },
  { eco: 'E12', name: "Queen's Indian Defense", moves: 'd4 Nf6 c4 e6 Nf3 b6' },
  { eco: 'E15', name: "Queen's Indian Defense", moves: 'd4 Nf6 c4 e6 Nf3 b6 g3' },
  { eco: 'E17', name: "Queen's Indian Defense", moves: 'd4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2 Be7' },

  // E20-E59 Nimzo-Indian
  { eco: 'E20', name: 'Nimzo-Indian Defense', moves: 'd4 Nf6 c4 e6 Nc3 Bb4' },
  { eco: 'E21', name: 'Nimzo-Indian Defense: Three Knights', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Nf3' },
  { eco: 'E24', name: 'Nimzo-Indian Defense: Samisch', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 a3' },
  { eco: 'E32', name: 'Nimzo-Indian Defense: Classical', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2' },
  { eco: 'E41', name: 'Nimzo-Indian Defense: Hubner', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 e3' },
  { eco: 'E46', name: 'Nimzo-Indian Defense: Reshevsky', moves: 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O' },

  // E60-E99 King's Indian Defense
  { eco: 'E60', name: "King's Indian Defense", moves: 'd4 Nf6 c4 g6' },
  { eco: 'E61', name: "King's Indian Defense", moves: 'd4 Nf6 c4 g6 Nc3' },
  { eco: 'E62', name: "King's Indian Defense: Fianchetto", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 Nf3 d6 g3' },
  { eco: 'E70', name: "King's Indian Defense", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4' },
  { eco: 'E73', name: "King's Indian Defense: Averbakh", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Be2 O-O Bg5' },
  { eco: 'E76', name: "King's Indian Defense: Four Pawns Attack", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4' },
  { eco: 'E80', name: "King's Indian Defense: Samisch", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3' },
  { eco: 'E85', name: "King's Indian Defense: Samisch: Orthodox", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5' },
  { eco: 'E90', name: "King's Indian Defense: Classical", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3' },
  { eco: 'E92', name: "King's Indian Defense: Classical", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2' },
  { eco: 'E97', name: "King's Indian Defense: Mar del Plata", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6' },
  { eco: 'E99', name: "King's Indian Defense: Orthodox: Bayonet Attack", moves: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 b4' },
];

/**
 * Look up the ECO code and opening name from the first moves of a game.
 * Tries longest match first (most specific opening).
 */
export function lookupEco(moves: string[]): { eco: string; name: string } {
  let bestMatch: EcoEntry | null = null;
  let bestLength = 0;

  for (const entry of ECO_TABLE) {
    const entryMoves = entry.moves.split(' ');
    const len = entryMoves.length;

    if (len > moves.length) continue;
    if (len <= bestLength) continue;

    let match = true;
    for (let i = 0; i < len; i++) {
      if (entryMoves[i] !== moves[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      bestMatch = entry;
      bestLength = len;
    }
  }

  return bestMatch
    ? { eco: bestMatch.eco, name: bestMatch.name }
    : { eco: 'A00', name: 'Unknown Opening' };
}
