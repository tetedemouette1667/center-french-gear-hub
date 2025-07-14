import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Context for authentication
const AuthContext = createContext();

// Auth Provider
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (token && userRole) {
      setUser({ token, role: userRole });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      setUser({ token: data.access_token, role: data.role });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Copy to clipboard function
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

// Main App component
const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [gears, setGears] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('gears');
  const [selectedCategory, setSelectedCategory] = useState('joueurs');
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'modérateur' });

  const { user, login, logout, loading } = useAuth();

  // Suggestion form state
  const [suggestionForm, setSuggestionForm] = useState({
    name: '',
    nickname: '',
    gear_id: '',
    image_url: '',
    description: '',
    category: 'joueurs'
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Categories
  const categories = [
    { id: 'joueurs', name: 'Joueurs', icon: '👥' },
    { id: 'modérateur', name: 'Modérateur', icon: '🛡️' },
    { id: 'événements', name: 'Événements', icon: '🎉' },
    { id: 'interdits', name: 'Interdits', icon: '🚫' }
  ];

  // Fetch gears
  const fetchGears = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gears`);
      if (response.ok) {
        const data = await response.json();
        setGears(data);
      }
    } catch (error) {
      console.error('Error fetching gears:', error);
    }
  };

  // Fetch suggestions
  const fetchSuggestions = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/suggestions`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    if (!user || user.role !== 'créateur') return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Submit suggestion
  const submitSuggestion = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(suggestionForm),
      });

      if (response.ok) {
        alert('Suggestion envoyée avec succès !');
        setSuggestionForm({
          name: '',
          nickname: '',
          gear_id: '',
          image_url: '',
          description: '',
          category: 'joueurs'
        });
        setShowSuggestionForm(false);
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Erreur lors de l\'envoi de la suggestion');
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const success = await login(loginForm.username, loginForm.password);
    if (success) {
      setShowLoginForm(false);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  // Approve suggestion
  const approveSuggestion = async (suggestionId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/suggestions/${suggestionId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        alert('Suggestion approuvée !');
        fetchSuggestions();
        fetchGears();
      }
    } catch (error) {
      console.error('Error approving suggestion:', error);
    }
  };

  // Reject suggestion
  const rejectSuggestion = async (suggestionId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/suggestions/${suggestionId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        alert('Suggestion rejetée !');
        fetchSuggestions();
      }
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  // Create user
  const createUser = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert('Utilisateur créé avec succès !');
        setNewUser({ username: '', password: '', role: 'modérateur' });
        fetchUsers();
      } else {
        alert('Erreur lors de la création de l\'utilisateur');
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Effects
  useEffect(() => {
    fetchGears();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
      fetchUsers();
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  const filteredGears = gears.filter(gear => gear.category === selectedCategory);

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <img 
              src="https://i.imgur.com/XZWXmBV.png" 
              alt="Center French"
              className="logo"
            />
            <h1>Center French - Gear Hub</h1>
          </div>
          <div className="header-right">
            <button 
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '🌞' : '🌙'}
            </button>
            {user ? (
              <div className="user-menu">
                <span>Bienvenue, {user.role}</span>
                <button onClick={logout} className="logout-btn">
                  Déconnexion
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginForm(true)}
                className="login-btn"
              >
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <button 
            className={`nav-btn ${activeTab === 'gears' ? 'active' : ''}`}
            onClick={() => setActiveTab('gears')}
          >
            Gears
          </button>
          <button 
            className="nav-btn"
            onClick={() => setShowSuggestionForm(true)}
          >
            Faire une suggestion
          </button>
          {user && (
            <button 
              className={`nav-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
              onClick={() => setActiveTab('suggestions')}
            >
              Suggestions ({suggestions.filter(s => s.status === 'pending').length})
            </button>
          )}
          {user && user.role === 'créateur' && (
            <button 
              className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Utilisateurs
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'gears' && (
          <div className="gears-section">
            {/* Category Filter */}
            <div className="category-filter">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Gears Grid */}
            <div className="gears-grid">
              {filteredGears.map(gear => (
                <div key={gear.id} className="gear-card">
                  <div className="gear-image">
                    <img src={gear.image_url} alt={gear.name} />
                  </div>
                  <div className="gear-info">
                    <h3>{gear.name}</h3>
                    <p className="nickname">"{gear.nickname}"</p>
                    <p className="gear-id">ID: {gear.gear_id}</p>
                    <p className="description">{gear.description}</p>
                    {selectedCategory !== 'interdits' && (
                      <button 
                        className="copy-btn"
                        onClick={() => copyToClipboard(gear.gear_id)}
                      >
                        📋 Copier l'ID
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredGears.length === 0 && (
              <div className="empty-state">
                <p>Aucun gear trouvé dans cette catégorie.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && user && (
          <div className="suggestions-section">
            <h2>Suggestions en attente</h2>
            <div className="suggestions-grid">
              {suggestions.filter(s => s.status === 'pending').map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-image">
                    <img src={suggestion.image_url} alt={suggestion.name} />
                  </div>
                  <div className="suggestion-info">
                    <h3>{suggestion.name}</h3>
                    <p className="nickname">"{suggestion.nickname}"</p>
                    <p className="gear-id">ID: {suggestion.gear_id}</p>
                    <p className="description">{suggestion.description}</p>
                    <p className="category">Catégorie: {suggestion.category}</p>
                    {user.role === 'créateur' || user.role === 'responsable' ? (
                      <div className="suggestion-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => approveSuggestion(suggestion.id)}
                        >
                          ✅ Approuver
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => rejectSuggestion(suggestion.id)}
                        >
                          ❌ Rejeter
                        </button>
                      </div>
                    ) : (
                      <p className="pending-status">En attente de validation</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && user && user.role === 'créateur' && (
          <div className="users-section">
            <h2>Gestion des utilisateurs</h2>
            
            {/* Create User Form */}
            <div className="create-user-form">
              <h3>Créer un nouvel utilisateur</h3>
              <form onSubmit={createUser}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="modérateur">Modérateur</option>
                    <option value="responsable">Responsable</option>
                  </select>
                </div>
                <button type="submit" className="create-user-btn">
                  Créer l'utilisateur
                </button>
              </form>
            </div>

            {/* Users List */}
            <div className="users-list">
              <h3>Utilisateurs existants</h3>
              <div className="users-grid">
                {users.map(userItem => (
                  <div key={userItem.id} className="user-card">
                    <h4>{userItem.username}</h4>
                    <p>Rôle: {userItem.role}</p>
                    <p>Créé le: {new Date(userItem.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Suggestion Form Modal */}
      {showSuggestionForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Faire une suggestion</h2>
              <button 
                className="close-btn"
                onClick={() => setShowSuggestionForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={submitSuggestion}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nom du gear"
                  value={suggestionForm.name}
                  onChange={(e) => setSuggestionForm({...suggestionForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Surnom du gear"
                  value={suggestionForm.nickname}
                  onChange={(e) => setSuggestionForm({...suggestionForm, nickname: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="ID du gear"
                  value={suggestionForm.gear_id}
                  onChange={(e) => setSuggestionForm({...suggestionForm, gear_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="url"
                  placeholder="URL de l'image"
                  value={suggestionForm.image_url}
                  onChange={(e) => setSuggestionForm({...suggestionForm, image_url: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Description du gear"
                  value={suggestionForm.description}
                  onChange={(e) => setSuggestionForm({...suggestionForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <select
                  value={suggestionForm.category}
                  onChange={(e) => setSuggestionForm({...suggestionForm, category: e.target.value})}
                >
                  <option value="joueurs">Joueurs</option>
                  <option value="modérateur">Modérateur</option>
                  <option value="événements">Événements</option>
                  <option value="interdits">Interdits</option>
                </select>
              </div>
              <button type="submit" className="submit-btn">
                Envoyer la suggestion
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Login Form Modal */}
      {showLoginForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Connexion</h2>
              <button 
                className="close-btn"
                onClick={() => setShowLoginForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  placeholder="Mot de passe"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap App with AuthProvider
const AppWithAuth = () => {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
};

export default AppWithAuth;