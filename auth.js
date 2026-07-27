(function () {
  const USERS_KEY = 'users';
  const CURRENT_USER_KEY = 'currentUser';

  function getUsers() {
    try {
      const storedUsers = localStorage.getItem(USERS_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error('Unable to read users from localStorage:', error);
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    const email = localStorage.getItem(CURRENT_USER_KEY);
    if (!email) {
      return null;
    }

    const users = getUsers();
    return users.find((user) => user.email === email) || null;
  }

  function setCurrentUser(email) {
    localStorage.setItem(CURRENT_USER_KEY, email);
  }

  function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  function normalizeUser(user) {
    return {
      ...user,
      profile: user.profile || {},
      cart: user.cart || []
    };
  }

  function saveCurrentUser(user) {
    const users = getUsers();
    const index = users.findIndex((entry) => entry.email === user.email);
    if (index !== -1) {
      users[index] = normalizeUser(user);
      saveUsers(users);
    }
  }

  function getCartCount() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return 0;
    }

    return (currentUser.cart || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function updateCartBadge() {
    const badge = document.querySelector('.cart-count');
    if (badge) {
      badge.textContent = getCartCount();
    }
  }

  function addToCart(product) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const users = getUsers();
    const index = users.findIndex((user) => user.email === currentUser.email);
    if (index === -1) {
      return false;
    }

    const cart = users[index].cart || [];
    const existingItem = cart.find((item) => item.name === product.name);
    if (existingItem) {
      existingItem.quantity = Number(existingItem.quantity || 0) + Number(product.quantity || 1);
    } else {
      cart.push({
        name: product.name,
        price: Number(product.price || 0),
        image: product.image || '',
        quantity: Number(product.quantity || 1)
      });
    }

    users[index].cart = cart;
    saveUsers(users);
    updateCartBadge();
    return true;
  }

  function removeFromCart(productName) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const users = getUsers();
    const index = users.findIndex((user) => user.email === currentUser.email);
    if (index === -1) {
      return false;
    }

    users[index].cart = (users[index].cart || []).filter((item) => item.name !== productName);
    saveUsers(users);
    updateCartBadge();
    return true;
  }

  function updateCartQuantity(productName, change) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    const users = getUsers();
    const index = users.findIndex((user) => user.email === currentUser.email);
    if (index === -1) {
      return false;
    }

    const cart = users[index].cart || [];
    const item = cart.find((entry) => entry.name === productName);
    if (!item) {
      return false;
    }

    item.quantity = Math.max(1, Number(item.quantity || 1) + change);
    users[index].cart = cart;
    saveUsers(users);
    updateCartBadge();
    return true;
  }

  window.tigerAuth = {
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    logout,
    saveCurrentUser,
    getCartCount,
    updateCartBadge,
    addToCart,
    removeFromCart,
    updateCartQuantity
  };
})();
