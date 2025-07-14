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
  const [showEditGearModal, setShowEditGearModal] = useState(false);
  const [editingGear, setEditingGear] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'modérateur' });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

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
    { id: 'joueurs', name: 'Joueurs', icon: '👥', color: 'from-blue-500 to-blue-600' },
    { id: 'modérateur', name: 'Modérateur', icon: '🛡️', color: 'from-purple-500 to-purple-600' },
    { id: 'événements', name: 'Événements', icon: '🎉', color: 'from-orange-500 to-orange-600' },
    { id: 'interdits', name: 'Interdits', icon: '🚫', color: 'from-red-500 to-red-600' }
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

  // Edit gear
  const editGear = (gear) => {
    setEditingGear(gear);
    setShowEditGearModal(true);
  };

  // Update gear
  const updateGear = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gears/${editingGear.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(editingGear),
      });

      if (response.ok) {
        alert('Gear mis à jour avec succès !');
        setShowEditGearModal(false);
        setEditingGear(null);
        fetchGears();
      } else {
        alert('Erreur lors de la mise à jour du gear');
      }
    } catch (error) {
      console.error('Error updating gear:', error);
    }
  };

  // Delete gear
  const deleteGear = async (gearId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce gear ?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/gears/${gearId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (response.ok) {
          alert('Gear supprimé avec succès !');
          fetchGears();
        } else {
          alert('Erreur lors de la suppression du gear');
        }
      } catch (error) {
        console.error('Error deleting gear:', error);
      }
    }
  };

  // Filter and sort gears
  const filteredGears = gears
    .filter(gear => gear.category === selectedCategory)
    .filter(gear => 
      gear.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gear.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'nickname') return a.nickname.localeCompare(b.nickname);
      if (sortBy === 'created_at') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });

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
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Chargement du Center French Gear Hub...</p>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-container">
              <img 
                src="https://i.imgur.com/XZWXmBV.png" 
                alt="Center French"
                className="logo"
              />
              <div className="logo-text">
                <h1>Center French</h1>
                <span className="subtitle">Gear Hub</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button 
              className="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-role">{user.role}</span>
                  <span className="user-status">Connecté</span>
                </div>
                <button onClick={logout} className="logout-btn">
                  Déconnexion
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginForm(true)}
                className="login-btn"
              >
                <span>🔐</span>
                Connexion
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-left">
            <button 
              className={`nav-btn ${activeTab === 'gears' ? 'active' : ''}`}
              onClick={() => setActiveTab('gears')}
            >
              <span>⚔️</span>
              Gears
            </button>
            <button 
              className="nav-btn suggestion-btn"
              onClick={() => setShowSuggestionForm(true)}
            >
              <span>💡</span>
              Faire une suggestion
            </button>
            {user && (
              <button 
                className={`nav-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggestions')}
              >
                <span>📝</span>
                Suggestions
                {suggestions.filter(s => s.status === 'pending').length > 0 && (
                  <span className="notification-badge">
                    {suggestions.filter(s => s.status === 'pending').length}
                  </span>
                )}
              </button>
            )}
            {user && user.role === 'créateur' && (
              <button 
                className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <span>👥</span>
                Utilisateurs
              </button>
            )}
          </div>
          <div className="nav-right">
            {activeTab === 'gears' && (
              <div className="search-controls">
                <input
                  type="text"
                  placeholder="Rechercher un gear..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">Trier par nom</option>
                  <option value="nickname">Trier par surnom</option>
                  <option value="created_at">Plus récent</option>
                </select>
              </div>
            )}
          </div>
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
                  <div className={`category-gradient bg-gradient-to-r ${category.color}`}>
                    <span className="category-icon">{category.icon}</span>
                  </div>
                  <div className="category-info">
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">
                      {gears.filter(g => g.category === category.id).length} gears
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Gears Grid */}
            <div className="gears-grid">
              {filteredGears.map(gear => (
                <div key={gear.id} className="gear-card">
                  <div className="gear-image">
                    <img src={gear.image_url} alt={gear.name} />
                    {user && (user.role === 'créateur' || user.role === 'responsable') && (
                      <div className="gear-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => editGear(gear)}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => deleteGear(gear.id)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="gear-info">
                    <h3>{gear.name}</h3>
                    <p className="nickname">"{gear.nickname}"</p>
                    <div className="gear-id-container">
                      <span className="gear-id">ID: {gear.gear_id}</span>
                    </div>
                    <p className="description">{gear.description}</p>
                    {selectedCategory !== 'interdits' && (
                      <button 
                        className="copy-btn"
                        onClick={() => {
                          copyToClipboard(gear.gear_id);
                          alert('ID copié dans le presse-papier !');
                        }}
                      >
                        <span>📋</span>
                        Copier l'ID
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredGears.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Aucun gear trouvé</h3>
                <p>
                  {searchTerm ? 
                    `Aucun gear ne correspond à "${searchTerm}" dans cette catégorie.` : 
                    'Aucun gear dans cette catégorie pour le moment.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && user && (
          <div className="suggestions-section">
            <div className="section-header">
              <h2>Suggestions en attente</h2>
              <div className="stats">
                <span className="stat">
                  {suggestions.filter(s => s.status === 'pending').length} en attente
                </span>
                <span className="stat">
                  {suggestions.filter(s => s.status === 'approved').length} approuvées
                </span>
                <span className="stat">
                  {suggestions.filter(s => s.status === 'rejected').length} rejetées
                </span>
              </div>
            </div>
            
            <div className="suggestions-grid">
              {suggestions.filter(s => s.status === 'pending').map(suggestion => (
                <div key={suggestion.id} className="suggestion-card">
                  <div className="suggestion-image">
                    <img src={suggestion.image_url} alt={suggestion.name} />
                    <div className="suggestion-status pending">En attente</div>
                  </div>
                  <div className="suggestion-info">
                    <h3>{suggestion.name}</h3>
                    <p className="nickname">"{suggestion.nickname}"</p>
                    <p className="gear-id">ID: {suggestion.gear_id}</p>
                    <p className="description">{suggestion.description}</p>
                    <div className="suggestion-category">
                      <span>Catégorie: </span>
                      <span className="category-badge">{suggestion.category}</span>
                    </div>
                    {user.role === 'créateur' || user.role === 'responsable' ? (
                      <div className="suggestion-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => approveSuggestion(suggestion.id)}
                        >
                          <span>✅</span>
                          Approuver
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => rejectSuggestion(suggestion.id)}
                        >
                          <span>❌</span>
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <div className="pending-status">
                        <span>⏳</span>
                        En attente de validation
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {suggestions.filter(s => s.status === 'pending').length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h3>Aucune suggestion en attente</h3>
                <p>Toutes les suggestions ont été traitées.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && user && user.role === 'créateur' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Gestion des utilisateurs</h2>
              <div className="stats">
                <span className="stat">
                  {users.length} utilisateurs
                </span>
              </div>
            </div>
            
            {/* Create User Form */}
            <div className="create-user-form">
              <h3>Créer un nouvel utilisateur</h3>
              <form onSubmit={createUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nom d'utilisateur</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rôle</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="modérateur">Modérateur</option>
                      <option value="responsable">Responsable</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="create-user-btn">
                  <span>➕</span>
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
                    <div className="user-avatar">
                      <span>{userItem.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="user-details">
                      <h4>{userItem.username}</h4>
                      <span className={`role-badge ${userItem.role}`}>
                        {userItem.role}
                      </span>
                      <p className="user-date">
                        Créé le {new Date(userItem.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Gear Modal */}
      {showEditGearModal && editingGear && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Modifier le gear</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditGearModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={updateGear}>
              <div className="form-group">
                <label>Nom du gear</label>
                <input
                  type="text"
                  value={editingGear.name}
                  onChange={(e) => setEditingGear({...editingGear, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Surnom</label>
                <input
                  type="text"
                  value={editingGear.nickname}
                  onChange={(e) => setEditingGear({...editingGear, nickname: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ID du gear</label>
                <input
                  type="text"
                  value={editingGear.gear_id}
                  onChange={(e) => setEditingGear({...editingGear, gear_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL de l'image</label>
                <input
                  type="url"
                  value={editingGear.image_url}
                  onChange={(e) => setEditingGear({...editingGear, image_url: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingGear.description}
                  onChange={(e) => setEditingGear({...editingGear, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={editingGear.category}
                  onChange={(e) => setEditingGear({...editingGear, category: e.target.value})}
                >
                  <option value="joueurs">Joueurs</option>
                  <option value="modérateur">Modérateur</option>
                  <option value="événements">Événements</option>
                  <option value="interdits">Interdits</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditGearModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  <span>💾</span>
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <label>Nom du gear</label>
                <input
                  type="text"
                  value={suggestionForm.name}
                  onChange={(e) => setSuggestionForm({...suggestionForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Surnom du gear</label>
                <input
                  type="text"
                  value={suggestionForm.nickname}
                  onChange={(e) => setSuggestionForm({...suggestionForm, nickname: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>ID du gear</label>
                <input
                  type="text"
                  value={suggestionForm.gear_id}
                  onChange={(e) => setSuggestionForm({...suggestionForm, gear_id: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL de l'image</label>
                <input
                  type="url"
                  value={suggestionForm.image_url}
                  onChange={(e) => setSuggestionForm({...suggestionForm, image_url: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description du gear</label>
                <textarea
                  value={suggestionForm.description}
                  onChange={(e) => setSuggestionForm({...suggestionForm, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Catégorie</label>
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
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowSuggestionForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  <span>📤</span>
                  Envoyer la suggestion
                </button>
              </div>
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
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowLoginForm(false)}>
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  <span>🔐</span>
                  Se connecter
                </button>
              </div>
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