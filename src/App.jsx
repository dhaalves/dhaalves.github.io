import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Store, LayoutDashboard, Image as ImageIcon, CheckCircle, X, Lock, LogOut, User, Tag, Search, Loader2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

// --- Configuração do Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAbQMDv0jK3XzIBjkv0WqQM66ua8hVzHrc",
  authDomain: "rodrigoenbalagens-5c431.firebaseapp.com",
  projectId: "rodrigoenbalagens-5c431",
  storageBucket: "rodrigoenbalagens-5c431.firebasestorage.app",
  messagingSenderId: "687713986084",
  appId: "1:687713986084:web:9d4fd6d13073feb90c5ab1",
  measurementId: "G-Q79VT3R0M5"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export default function App() {
  const [view, setView] = useState('store'); // Inicia na vitrine (pública)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Usuário do Firebase
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Autenticação no Firebase (Correção: Importação e uso correto do token customizado)
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           console.log("Iniciando autenticação com Token Customizado...");
           await signInWithCustomToken(auth, __initial_auth_token); 
        } else {
          console.log("Iniciando autenticação Anônima...");
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Erro crítico na autenticação:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log("Usuário autenticado:", currentUser.uid);
        setUser(currentUser);
      } else {
        console.log("Usuário desconectado");
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Sincronizar produtos do Firestore em Tempo Real
  useEffect(() => {
    if (!user) return;

    // Caminho estrito: artifacts/{appId}/public/data/{collection}
    const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
    
    const unsubscribe = onSnapshot(productsRef, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenação no cliente (Rule 2 do Firestore: evitar queries complexas com índices)
      productsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar produtos (Permissão ou Conexão):", error);
      setLoading(false);
      // Não mostramos alert aqui para não travar a UI em caso de loops de erro, apenas log
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto? Isso removerá para todos os usuários.')) {
      try {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir: Verifique suas permissões ou conexão.");
      }
    }
  };

  const handleAddProduct = async (product) => {
    if (!user) {
      alert("Aguarde a autenticação antes de salvar.");
      return false;
    }

    try {
      const productToSave = {
        ...product,
        createdAt: Date.now(),
        createdBy: user.uid // Útil para auditoria futura
      };
      // Remove o ID temporário se existir
      if (productToSave.id) delete productToSave.id;

      const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
      await addDoc(productsRef, productToSave);
      return true;
    } catch (error) {
      console.error("Erro ao salvar:", error);
      if (error.code === 'permission-denied') {
        alert("Erro de permissão: Você não tem acesso para salvar dados nesta coleção.");
      } else {
        alert("Erro ao salvar. Se estiver enviando imagem, verifique se ela não é muito grande (limite do BD ~1MB).");
      }
      return false;
    }
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setView('dashboard');
    } else {
      setView('login');
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setView('store');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Barra de Navegação */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer"
              onClick={() => setView('store')}
            >
              <Store className="w-6 h-6" />
              <span>Rodrigo Embalagens</span>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <button
                onClick={() => setView('store')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  view === 'store' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Vitrine</span>
              </button>

              <button
                onClick={handleAdminAccess}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  view === 'dashboard' || view === 'login' ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {isAdminAuthenticated ? <LayoutDashboard className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                <span className="hidden sm:inline">Admin</span>
              </button>

              {isAdminAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-2 border border-transparent hover:border-red-100"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p>Conectando ao banco de dados...</p>
          </div>
        ) : (
          <>
            {view === 'dashboard' && isAdminAuthenticated ? (
              <Dashboard products={products} onDelete={handleDelete} onAdd={handleAddProduct} />
            ) : view === 'login' ? (
              <LoginScreen onLogin={() => { setIsAdminAuthenticated(true); setView('dashboard'); }} />
            ) : (
              <StoreFront products={products} />
            )}
          </>
        )}
      </main>

      {/* Footer Simples */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-gray-400 text-sm">
        <p>&copy; 2024 Rodrigo Embalagens. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

// --- Tela de Login ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Credenciais inválidas. Tente admin/admin');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm mt-2">Área exclusiva para gerenciamento de produtos.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Digite seu usuário"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm hover:shadow mt-2"
          >
            Entrar no Painel
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
          <p>Para teste use: <strong>admin</strong> / <strong>admin</strong></p>
        </div>
      </div>
    </div>
  );
}

// --- Componente da Área Administrativa ---
function Dashboard({ products, onDelete, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    category: '', 
    price: '',
    description: '',
    showPrice: true,
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("A imagem é muito grande! Por favor escolha uma imagem menor que 800KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      setNotification({ type: 'error', message: 'Preencha os campos obrigatórios.' });
      return;
    }

    setIsSubmitting(true);

    const newProduct = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : 0
    };

    const success = await onAdd(newProduct);
    
    setIsSubmitting(false);

    if (success) {
      setFormData({ title: '', category: '', price: '', description: '', showPrice: true, image: null });
      setImagePreview(null);
      setNotification({ type: 'success', message: 'Produto salvo na nuvem!' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulário de Cadastro */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Novo Produto
          </h2>

          {notification && (
            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {notification.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-32 w-full object-cover rounded-md mx-auto" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-gray-400 group-hover:text-blue-500">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">Clique para enviar imagem (Max 800KB)</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Produto *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: Caixa de Papelão M"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <div className="relative">
                <Tag className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Caixas, Fitas, Plásticos"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end mb-2">
                 <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={formData.showPrice} 
                      onChange={(e) => setFormData({...formData, showPrice: e.target.checked})}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.showPrice ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.showPrice ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm text-gray-600">{formData.showPrice ? 'Exibir Preço' : 'Ocultar Preço'}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Completa</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Detalhes do produto..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {isSubmitting ? 'Salvando...' : 'Cadastrar Produto'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Produtos Cadastrados */}
      <div className="lg:col-span-2">
        <h2 className="text-lg font-bold mb-4">Produtos Cadastrados ({products.length})</h2>
        {products.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center border border-dashed border-gray-300 text-gray-400">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum produto cadastrado ainda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Produto</th>
                    <th className="px-6 py-4 font-semibold">Preço</th>
                    <th className="px-6 py-4 font-semibold text-center">Visibilidade</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                            {product.image ? (
                              <img src={product.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.title}</div>
                            {product.category && (
                              <div className="text-xs text-blue-600 font-medium mb-0.5">{product.category}</div>
                            )}
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">{product.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.showPrice ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {product.showPrice ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {product.showPrice ? 'Público' : 'Oculto'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onDelete(product.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Excluir da Nuvem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Componente da Vitrine (Visão do Cliente) ---
function StoreFront({ products }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const title = product.title ? product.title.toLowerCase() : '';
    const category = product.category ? product.category.toLowerCase() : '';
    const description = product.description ? product.description.toLowerCase() : '';
    
    return (
      title.includes(term) ||
      category.includes(term) ||
      description.includes(term)
    );
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Nossos Produtos</h2>
          <p className="text-gray-500 mt-2">Confira as novidades exclusivas da nossa loja.</p>
        </div>
        
        {products.length > 0 && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <Store className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-600">A vitrine está vazia</h3>
          <p className="text-gray-400">Volte para o painel administrativo para cadastrar itens na nuvem.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
          <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-600">Nenhum produto encontrado</h3>
          <p className="text-gray-400">Não encontramos resultados para "{searchTerm}".</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Limpar busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full group">
              {/* Imagem do Card */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs">Sem Imagem</span>
                  </div>
                )}
                
                {/* Badge de Preço Oculto (se aplicável) */}
                {!product.showPrice && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    <span>Sob Consulta</span>
                  </div>
                )}
              </div>

              {/* Corpo do Card */}
              <div className="p-5 flex flex-col flex-grow">
                {/* Categoria */}
                {product.category && (
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {product.category}
                  </div>
                )}
                
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{product.title}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-grow line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
                
                <div className="pt-4 border-t border-gray-50 mt-auto flex items-center justify-between">
                  {product.showPrice ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-400 uppercase font-semibold">Preço</span>
                      <span className="text-xl font-bold text-blue-600">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  ) : (
                    <button className="w-full bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      Consultar Preço
                    </button>
                  )}
                  
                  {product.showPrice && (
                    <button className="bg-blue-50 text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors">
                      <Store className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
