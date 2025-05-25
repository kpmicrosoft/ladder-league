import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function Welcome({ onLogin }: { onLogin: (mobile: string) => void }) {
  const [mobile, setMobile] = useState('7327184414');
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && mobile) {
      onLogin(mobile);
    }
  };
  const handleClick = () => {
    if (mobile) {
      onLogin(mobile);
    }
  };
  return (
    <div className="welcome-page">
      <h1>Welcome to Ladder League!</h1>
      <p>This is a modern web application for managing your ladder league. Get started by logging in.</p>
      <input
        type="tel"
        placeholder="Enter your mobile number"
        value={mobile}
        onChange={e => setMobile(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ padding: '8px', fontSize: '1rem', marginTop: '1rem' }}
      />
      <button onClick={handleClick} style={{ marginLeft: 8, padding: '8px 16px', fontSize: '1rem' }}>Enter</button>
    </div>
  );
}

function TournamentList({ mobile, onEnterLeague }: { mobile: string; onEnterLeague: (league: string) => void }) {
  const [tournaments, setTournaments] = useState<{ sport: string; leagues: string[] }[]>([]);
  const [joinedLeagues, setJoinedLeagues] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/leagues')
      .then(res => res.json())
      .then(data => setTournaments(data));
    // Fetch user info from backend
    fetch(`http://localhost:8000/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: mobile })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      });
    // Fetch joined leagues for the user from backend
    fetch(`http://localhost:8000/api/user-leagues?phone=${mobile}`)
      .then(res => res.json())
      .then(data => setJoinedLeagues(Array.isArray(data) ? data : []));
  }, [mobile]);

  const handleJoin = (league: string) => {
    if (!user) return;
    fetch('http://localhost:8000/api/join-league', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league, user })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setJoinedLeagues(prev => [...prev, league]);
      });
  };

  return (
    <div className="tournament-list">
      <h2>Available Ladder Leagues</h2>
      {tournaments.map(t => (
        <div key={t.sport} style={{ marginBottom: '1.5rem' }}>
          <h3>{t.sport}</h3>
          <ul>
            {t.leagues.map(l => (
              <li key={l} style={{ marginBottom: 8 }}>
                {l}
                {joinedLeagues.includes(l) ? (
                  <button style={{ marginLeft: 12 }} onClick={() => onEnterLeague(l)}>
                    Enter League
                  </button>
                ) : (
                  <button style={{ marginLeft: 12 }} onClick={() => handleJoin(l)}>
                    Join
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}


function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button onClick={onLogout} style={{ position: 'absolute', bottom: 24, left: 24, fontWeight: 'bold', fontSize: '1.1rem', zIndex: 101, minWidth: 90 }}>
      Log Out
    </button>
  );
}

function HomeButton({ onHome }: { onHome: () => void }) {
  return (
    <button onClick={onHome} style={{ position: 'absolute', bottom: 24, left: 130, fontWeight: 'bold', fontSize: '1.1rem', zIndex: 100, minWidth: 90 }}>
      Home
    </button>
  );
}

function Leaderboard({ league, onHome, onLogout, onAddScore }: { league: string; onHome: () => void, onLogout: () => void, onAddScore: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  useEffect(() => {
    fetch(`http://localhost:8000/api/league-members?league=${encodeURIComponent(league)}`)
      .then(res => res.json())
      .then(data => setMembers(data));
    // Fetch scores for this league
    fetch(`http://localhost:8000/api/league-scores?league=${encodeURIComponent(league)}`)
      .then(res => res.json())
      .then(data => setResults(Array.isArray(data) ? data : []));
  }, [league]);

  // Build a map of player name to recent results (W/L) and points/games played
  const playerResults: Record<string, string[]> = {};
  const playerPoints: Record<string, number> = {};
  const playerGames: Record<string, number> = {};
  results.forEach((match: any) => {
    const { player1, player2, scores, tennisFormat } = match;
    let p1Sets = 0, p2Sets = 0;
    let p1Points = 0, p2Points = 0;
    let p1Games = 0, p2Games = 0;
    if (scores) {
      Object.keys(scores).forEach(setKey => {
        const set = scores[setKey];
        // For tiebreaker, 6 points for winner, 0 for loser
        if (tennisFormat === '2sets-tb' && setKey === 'tb') {
          if (Number(set.player1) > Number(set.player2)) {
            p1Points += 6;
            p2Points += 0;
          } else if (Number(set.player2) > Number(set.player1)) {
            p2Points += 6;
            p1Points += 0;
          }
          p1Games += 1;
          p2Games += 1;
        } else {
          // Normal set: points = games won
          p1Points += Number(set.player1) || 0;
          p2Points += Number(set.player2) || 0;
          p1Games += 1;
          p2Games += 1;
          if (Number(set.player1) > Number(set.player2)) p1Sets++;
          else if (Number(set.player2) > Number(set.player1)) p2Sets++;
        }
      });
    }
    // Determine winner
    let winner = null;
    if (p1Sets > p2Sets) winner = player1;
    else if (p2Sets > p1Sets) winner = player2;
    // Add to recent for both players
    [player1, player2].forEach(name => {
      if (!playerResults[name]) playerResults[name] = [];
      if (!playerPoints[name]) playerPoints[name] = 0;
      if (!playerGames[name]) playerGames[name] = 0;
    });
    if (winner === player1) {
      playerResults[player1].unshift('Win');
      playerResults[player2].unshift('Loss');
    } else if (winner === player2) {
      playerResults[player2].unshift('Win');
      playerResults[player1].unshift('Loss');
    }
    // Add points/games
    playerPoints[player1] += p1Points;
    playerPoints[player2] += p2Points;
    playerGames[player1] += p1Games;
    playerGames[player2] += p2Games;
    // Limit to last 5
    [player1, player2].forEach(name => {
      playerResults[name] = playerResults[name].slice(0, 5);
    });
  });

  // Sort members by points (descending)
  const sortedMembers = [...members].sort((a, b) => {
    const pointsA = playerPoints[a.name] || 0;
    const pointsB = playerPoints[b.name] || 0;
    return pointsB - pointsA;
  });

  // Calculate matches played, won, and lost
  const playerMatches: Record<string, number> = {};
  const playerWins: Record<string, number> = {};
  const playerLosses: Record<string, number> = {};
  results.forEach((match: any) => {
    const { player1, player2, scores, tennisFormat } = match;
    let p1Sets = 0, p2Sets = 0;
    if (scores) {
      Object.keys(scores).forEach(setKey => {
        const set = scores[setKey];
        if (tennisFormat === '2sets-tb' && setKey === 'tb') {
          if (Number(set.player1) > Number(set.player2)) p1Sets++;
          else if (Number(set.player2) > Number(set.player1)) p2Sets++;
        } else {
          if (Number(set.player1) > Number(set.player2)) p1Sets++;
          else if (Number(set.player2) > Number(set.player1)) p2Sets++;
        }
      });
    }
    let winner = null;
    if (p1Sets > p2Sets) winner = player1;
    else if (p2Sets > p1Sets) winner = player2;
    [player1, player2].forEach(name => {
      if (!playerMatches[name]) playerMatches[name] = 0;
      if (!playerWins[name]) playerWins[name] = 0;
      if (!playerLosses[name]) playerLosses[name] = 0;
      playerMatches[name] += 1;
    });
    if (winner === player1) {
      playerWins[player1] += 1;
      playerLosses[player2] += 1;
    } else if (winner === player2) {
      playerWins[player2] += 1;
      playerLosses[player1] += 1;
    }
  });

  // Sort members by points (descending)
  const sortedMembers2 = [...members].sort((a, b) => {
    const pointsA = playerPoints[a.name] || 0;
    const pointsB = playerPoints[b.name] || 0;
    return pointsB - pointsA;
  });

  return (
    <div className="leaderboard">
      <HomeButton onHome={onHome} />
      <LogoutButton onLogout={onLogout} />
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>{league} Leaderboard</h2>
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <a href="#" onClick={e => { e.preventDefault(); onAddScore(); }} style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}>
          + Add Score
        </a>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <table style={{ width: 'auto', borderCollapse: 'collapse', minWidth: 600, background: 'rgba(255,255,255,0.95)', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', padding: 8 }}>Rank</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Recent (Last 5)</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Points</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Matches Played</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Matches Won</th>
              <th style={{ textAlign: 'center', padding: 8 }}>Matches Lost</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((m, i) => (
              <tr key={m.name} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ textAlign: 'center', padding: 8 }}>{i + 1}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{m.name}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>
                  {playerResults[m.name] && playerResults[m.name].length > 0
                    ? playerResults[m.name].map((r: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            display: 'inline-block',
                            width: 24,
                            height: 24,
                            lineHeight: '24px',
                            textAlign: 'center',
                            marginRight: 4,
                            borderRadius: 4,
                            background: r === 'Win' ? '#d4edda' : '#f8d7da',
                            color: r === 'Win' ? '#155724' : '#721c24',
                            border: `2px solid ${r === 'Win' ? '#28a745' : '#dc3545'}`,
                            fontWeight: 'bold',
                          }}
                        >
                          {r === 'Win' ? 'W' : 'L'}
                        </span>
                      ))
                    : ''}
                </td>
                <td style={{ textAlign: 'center', padding: 8 }}>{playerPoints[m.name] || 0}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{playerMatches[m.name] || 0}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{playerWins[m.name] || 0}</td>
                <td style={{ textAlign: 'center', padding: 8 }}>{playerLosses[m.name] || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Signup({ onSignup, onSwitchToLogin }: { onSignup: (user: { phone: string; firstName: string; lastName: string }) => void, onSwitchToLogin: () => void }) {
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !firstName || !lastName) {
      setError('All fields are required');
      return;
    }
    setError('');
    // Call backend API
    const res = await fetch('http://localhost:8000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, firstName, lastName })
    });
    const data = await res.json();
    if (data.success) {
      onSignup({ phone, firstName, lastName });
    } else {
      setError(data.message || 'Signup failed');
    }
  };

  return (
    <div className="signup-page">
      <h1 style={{ fontSize: 40, marginBottom: 16 }}>Welcome to Ladder League</h1>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} style={{ display: 'block', marginBottom: 8 }} />
        <input type="text" placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ display: 'block', marginBottom: 8 }} />
        <input type="text" placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} style={{ display: 'block', marginBottom: 8 }} />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit">Sign Up</button>
      </form>
      <div style={{ marginTop: 12 }}>
        Already have an account? <button onClick={onSwitchToLogin}>Log In</button>
      </div>
    </div>
  );
}

function Login({ onLogin, onSwitchToSignup, onShowAllUsers }: { onLogin: (phone: string) => void, onSwitchToSignup: () => void, onShowAllUsers: () => void }) {
  const [phone, setPhone] = useState('7327184414');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setError('Phone number required');
      return;
    }
    setError('');
    onLogin(phone);
  };

  return (
    <div className="login-page">
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} style={{ display: 'block', marginBottom: 8 }} />
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit">Log In</button>
      </form>
      <div style={{ marginTop: 12 }}>
        Don't have an account? <button onClick={onSwitchToSignup}>Sign Up</button>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button onClick={onShowAllUsers} style={{ fontSize: '1rem', padding: '8px 16px' }}>
          View All Signed Up Users
        </button>
      </div>
    </div>
  );
}

function AllUsers({ onBack, onHome, onLogout }: { onBack: () => void, onHome: () => void, onLogout: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    fetch('http://localhost:8000/api/all-users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      })
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);
  return (
    <div className="all-users-page">
      <HomeButton onHome={onHome} />
      <LogoutButton onLogout={onLogout} />
      <h2>All Signed Up Users</h2>
      {users.length === 0 ? (
        <div style={{ color: 'gray', margin: '16px 0' }}>No users found.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Phone</th>
              <th>First Name</th>
              <th>Last Name</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.phone + i} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{u.phone}</td>
                <td>{u.firstName}</td>
                <td>{u.lastName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function AddScorePage({ league, onBack, onLogout }: { league: string; onBack: () => void; onLogout: () => void }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [sport, setSport] = useState('Tennis');
  const [tennisFormat, setTennisFormat] = useState<'3sets' | '2sets-tb'>('3sets');
  const [scores, setScores] = useState<any>({});
  const [message, setMessage] = useState('');
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetch(`http://localhost:8000/api/league-members?league=${encodeURIComponent(league)}`)
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, [league]);

  const handleScoreChange = (setIdx: number, player: 'player1' | 'player2', value: string) => {
    setScores((prev: any) => ({
      ...prev,
      [setIdx]: {
        ...prev[setIdx],
        [player]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1 || !player2 || player1 === player2) {
      setMessage('Please select two different players.');
      return;
    }
    // Prepare score data
    const scoreData = {
      league,
      sport,
      player1,
      player2,
      tennisFormat,
      scores,
      date: matchDate
    };
    const res = await fetch('http://localhost:8000/api/add-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scoreData)
    });
    const data = await res.json();
    if (data.success) {
      setMessage('Score saved!');
    } else {
      setMessage('Failed to save score.');
    }
  };

  return (
    <div className="add-score-page">
      <LogoutButton onLogout={onLogout} />
      <h2>Add Score</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto' }}>
        <div style={{ marginBottom: 12 }}>
          <label>Date of Match:</label>
          <input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} style={{ marginLeft: 8 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Player 1:</label>
          <select value={player1} onChange={e => setPlayer1(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">Select</option>
            {players.map((p: any, i: number) => (
              <option key={i} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Player 2:</label>
          <select value={player2} onChange={e => setPlayer2(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="">Select</option>
            {players.map((p: any, i: number) => (
              <option key={i} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Sport:</label>
          <select value={sport} onChange={e => setSport(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="Tennis">Tennis</option>
            <option value="Badminton">Badminton</option>
            <option value="Pickleball">Pickleball</option>
          </select>
        </div>
        {sport === 'Tennis' && (
          <div style={{ marginBottom: 12 }}>
            <label>Format:</label>
            <select value={tennisFormat} onChange={e => setTennisFormat(e.target.value as any)} style={{ marginLeft: 8 }}>
              <option value="3sets">3 Sets</option>
              <option value="2sets-tb">2 Sets & Tiebreaker</option>
            </select>
          </div>
        )}
        {/* Score Inputs */}
        {sport === 'Tennis' && tennisFormat === '3sets' && [1, 2, 3].map(setIdx => (
          <div key={setIdx} style={{ marginBottom: 8 }}>
            <label>Set {setIdx}:</label>
            <input type="number" min="0" max="7" placeholder="P1" value={scores[setIdx]?.player1 || ''} onChange={e => handleScoreChange(setIdx, 'player1', e.target.value)} style={{ width: 50, marginLeft: 8 }} />
            <span style={{ margin: '0 8px' }}>-</span>
            <input type="number" min="0" max="7" placeholder="P2" value={scores[setIdx]?.player2 || ''} onChange={e => handleScoreChange(setIdx, 'player2', e.target.value)} style={{ width: 50 }} />
          </div>
        ))}
        {sport === 'Tennis' && tennisFormat === '2sets-tb' && [1, 2].map(setIdx => (
          <div key={setIdx} style={{ marginBottom: 8 }}>
            <label>Set {setIdx}:</label>
            <input type="number" min="0" max="7" placeholder="P1" value={scores[setIdx]?.player1 || ''} onChange={e => handleScoreChange(setIdx, 'player1', e.target.value)} style={{ width: 50, marginLeft: 8 }} />
            <span style={{ margin: '0 8px' }}>-</span>
            <input type="number" min="0" max="7" placeholder="P2" value={scores[setIdx]?.player2 || ''} onChange={e => handleScoreChange(setIdx, 'player2', e.target.value)} style={{ width: 50 }} />
          </div>
        ))}
        {sport === 'Tennis' && tennisFormat === '2sets-tb' && (
          <div style={{ marginBottom: 8 }}>
            <label>Tiebreaker:</label>
            <input type="number" min="0" max="20" placeholder="P1" value={scores['tb']?.player1 || ''} onChange={e => handleScoreChange('tb' as any, 'player1', e.target.value)} style={{ width: 50, marginLeft: 8 }} />
            <span style={{ margin: '0 8px' }}>-</span>
            <input type="number" min="0" max="20" placeholder="P2" value={scores['tb']?.player2 || ''} onChange={e => handleScoreChange('tb' as any, 'player2', e.target.value)} style={{ width: 50 }} />
          </div>
        )}
        {sport !== 'Tennis' && (
          <div style={{ marginBottom: 8 }}>
            <label>Score:</label>
            <input type="number" min="0" placeholder="P1" value={scores[1]?.player1 || ''} onChange={e => handleScoreChange(1, 'player1', e.target.value)} style={{ width: 50, marginLeft: 8 }} />
            <span style={{ margin: '0 8px' }}>-</span>
            <input type="number" min="0" placeholder="P2" value={scores[1]?.player2 || ''} onChange={e => handleScoreChange(1, 'player2', e.target.value)} style={{ width: 50 }} />
          </div>
        )}
        <button type="submit" style={{ marginTop: 16 }}>Save Score</button>
        <button type="button" onClick={onBack} style={{ marginTop: 16, marginLeft: 16 }}>Back to Leaderboard</button>
        {message && <div style={{ marginTop: 12, color: message.includes('saved') ? 'green' : 'red' }}>{message}</div>}
      </form>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mobile, setMobile] = useState('123456789');
  const [currentLeague, setCurrentLeague] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAddScore, setShowAddScore] = useState(false);

  // Simulate backend user storage in localStorage (replace with API calls to backend for real app)
  const saveUser = (user: { phone: string; firstName: string; lastName: string }) => {
    let users = JSON.parse(localStorage.getItem('ladder_users') || '[]');
    users.push(user);
    localStorage.setItem('ladder_users', JSON.stringify(users));
  };
  const findUser = (phone: string) => {
    let users = JSON.parse(localStorage.getItem('ladder_users') || '[]');
    return users.find((u: any) => u.phone === phone);
  };

  const handleSignup = (user: { phone: string; firstName: string; lastName: string }) => {
    if (findUser(user.phone)) {
      alert('User already exists. Please log in.');
      setShowSignup(false);
      setShowLogin(true);
      return;
    }
    saveUser(user);
    setUser(user);
    setMobile(user.phone);
    setLoggedIn(true);
    setShowSignup(false);
    setShowLogin(false);
  };

  const handleLogin = (phone: string) => {
    const user = findUser(phone);
    if (!user) {
      alert('User not found. Please sign up.');
      setShowSignup(true);
      setShowLogin(false);
      return;
    }
    setUser(user);
    setMobile(phone);
    setLoggedIn(true);
    setShowSignup(false);
    setShowLogin(false);
  };

  const handleEnterLeague = (league: string) => {
    setCurrentLeague(league);
  };
  const handleBack = () => {
    setCurrentLeague(null);
  };
  const handleHome = () => {
    setShowSignup(false);
    setShowLogin(true);
    setShowAllUsers(false);
    setCurrentLeague(null);
  };
  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
    setShowSignup(false);
    setShowLogin(true);
    setShowAllUsers(false);
    setCurrentLeague(null);
  };

  // Helper to render user name at top right
  const renderUserName = () =>
    loggedIn && user ? (
      <div style={{ position: 'absolute', top: 16, right: 24, fontWeight: 'bold', fontSize: '1.1rem', zIndex: 200 }}>
        {user.firstName} {user.lastName}
      </div>
    ) : null;

  // --- PAGE RENDERING ---
  if (showSignup) {
    return (
      <div className="signup-page">
        {renderUserName()}
        <Signup onSignup={handleSignup} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true); }} />
      </div>
    );
  }
  if (showLogin && !loggedIn) {
    return (
      <div className="login-page">
        {renderUserName()}
        <Login onLogin={handleLogin} onSwitchToSignup={() => { setShowSignup(true); setShowLogin(false); }} onShowAllUsers={() => setShowAllUsers(true)} />
      </div>
    );
  }
  if (showAllUsers) {
    return (
      <div className="all-users-page">
        {renderUserName()}
        <AllUsers onBack={() => setShowAllUsers(false)} onHome={handleHome} onLogout={handleLogout} />
      </div>
    );
  }
  if (currentLeague && !showAddScore) {
    return (
      <div className="leaderboard">
        {renderUserName()}
        <Leaderboard league={currentLeague} onHome={handleHome} onLogout={handleLogout} onAddScore={() => setShowAddScore(true)} />
      </div>
    );
  }
  if (showAddScore) {
    return <AddScorePage league={currentLeague!} onBack={() => setShowAddScore(false)} onLogout={handleLogout} />;
  }
  return (
    <div className="App">
      {renderUserName()}
      {loggedIn && user && <LogoutButton onLogout={handleLogout} />}
      {!loggedIn ? (
        <>
          <Welcome onLogin={handleLogin} />
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button onClick={() => setShowAllUsers(true)} style={{ fontSize: '1rem', padding: '8px 16px' }}>
              View All Signed Up Users
            </button>
          </div>
        </>
      ) : currentLeague ? (
        <Leaderboard league={currentLeague} onHome={handleHome} onLogout={handleLogout} onAddScore={() => setShowAddScore(true)} />
      ) : (
        <TournamentList mobile={mobile} onEnterLeague={handleEnterLeague} />
      )}
    </div>
  );
}

export default App;
