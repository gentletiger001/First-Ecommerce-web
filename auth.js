(function () {
  const USERS_KEY = 'users';
  const CURRENT_USER_KEY = 'currentUser';
  const REVIEWS_KEY = 'productReviews';

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
      cart: user.cart || [],
      orders: user.orders || [],
      wishlist: user.wishlist || []
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

  // ===== CART MANAGEMENT =====
  function getCartCount() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return 0;
    }

    return (currentUser.cart || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = getCartCount();
    badges.forEach((badge) => {
      badge.textContent = count;
    });
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
        id: product.id || Date.now(),
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

  // ===== WISHLIST MANAGEMENT =====
  function getWishlist() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    return currentUser.wishlist || [];
  }

  function isInWishlist(productId) {
    const list = getWishlist();
    return list.some((item) => Number(item.id || item) === Number(productId));
  }

  function toggleWishlist(product) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const users = getUsers();
    const index = users.findIndex((u) => u.email === currentUser.email);
    if (index === -1) return false;

    let wishlist = users[index].wishlist || [];
    const prodId = Number(product.id || product);
    const existingIndex = wishlist.findIndex((item) => Number(item.id || item) === prodId);

    let isAdded = false;
    if (existingIndex !== -1) {
      wishlist.splice(existingIndex, 1);
    } else {
      wishlist.push({
        id: prodId,
        name: product.name || 'Product #' + prodId,
        price: product.price || 0,
        image: product.image || '',
        description: product.description || ''
      });
      isAdded = true;
    }

    users[index].wishlist = wishlist;
    saveUsers(users);
    updateWishlistBadge();
    return isAdded;
  }

  function updateWishlistBadge() {
    const badges = document.querySelectorAll('.wishlist-count');
    const count = getWishlist().length;
    badges.forEach((badge) => {
      badge.textContent = count;
    });
  }

  // ===== ORDER MANAGEMENT =====
  function getOrders() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    return currentUser.orders || [];
  }

  function createOrder(orderData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    const users = getUsers();
    const index = users.findIndex((u) => u.email === currentUser.email);
    if (index === -1) return null;

    const stages = [
      { key: 'placed', label: 'Order Placed', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), done: true, desc: 'Payment verified via Paystack' },
      { key: 'processing', label: 'Processing & Packing', time: 'In Progress', done: true, desc: 'Order being packed at fulfillment center' },
      { key: 'shipped', label: 'In Transit / Shipped', time: 'Pending', done: false, desc: 'Handed over to courier service' },
      { key: 'delivery', label: 'Out for Delivery', time: 'Pending', done: false, desc: 'Courier driver assigned for dropoff' },
      { key: 'completed', label: 'Delivered & Received', time: 'Pending', done: false, desc: 'Package delivered to recipient' }
    ];

    const newOrder = {
      id: orderData.id || ('TGR-' + Date.now().toString(36).toUpperCase()),
      date: new Date().toISOString(),
      displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      items: orderData.items || [],
      shipping: orderData.shipping || {},
      pricing: orderData.pricing || {},
      paymentRef: orderData.paymentRef || '',
      currentStageIndex: 1, // 0: Placed, 1: Processing, 2: Shipped, 3: Out for Delivery, 4: Delivered/Completed
      status: 'Processing', // 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed'
      stages: stages
    };

    const orders = users[index].orders || [];
    orders.unshift(newOrder); // newest first
    users[index].orders = orders;

    // Clear cart upon order creation
    users[index].cart = [];

    saveUsers(users);
    updateCartBadge();
    return newOrder;
  }

  function updateOrderStatus(orderId, newStageIndex) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const users = getUsers();
    const index = users.findIndex((u) => u.email === currentUser.email);
    if (index === -1) return false;

    const orders = users[index].orders || [];
    const order = orders.find((o) => o.id === orderId);
    if (!order) return false;

    const statusLabels = ['Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Completed'];
    order.currentStageIndex = Math.min(newStageIndex, order.stages.length - 1);
    order.status = statusLabels[order.currentStageIndex] || 'Processing';

    // Update stages done state
    order.stages.forEach((stage, idx) => {
      if (idx <= order.currentStageIndex) {
        stage.done = true;
        if (stage.time === 'Pending' || stage.time === 'In Progress') {
          stage.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        stage.done = false;
        stage.time = 'Pending';
      }
    });

    users[index].orders = orders;
    saveUsers(users);
    return true;
  }

  // ===== PRODUCT REVIEWS =====
  function getReviews(productId) {
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      const allReviews = stored ? JSON.parse(stored) : {};
      return allReviews[productId] || [
        { name: 'David O.', rating: 5, date: '2 days ago', text: 'Excellent product! Delivered quickly and works perfectly.' },
        { name: 'Sarah K.', rating: 4, date: '1 week ago', text: 'Great quality for the price. Highly recommend Tiger Store!' }
      ];
    } catch (e) {
      return [];
    }
  }

  function addReview(productId, review) {
    try {
      const stored = localStorage.getItem(REVIEWS_KEY);
      const allReviews = stored ? JSON.parse(stored) : {};
      if (!allReviews[productId]) {
        allReviews[productId] = [
          { name: 'David O.', rating: 5, date: '2 days ago', text: 'Excellent product! Delivered quickly and works perfectly.' },
          { name: 'Sarah K.', rating: 4, date: '1 week ago', text: 'Great quality for the price. Highly recommend Tiger Store!' }
        ];
      }
      allReviews[productId].unshift({
        name: review.name || 'Anonymous Buyer',
        rating: Number(review.rating || 5),
        date: 'Just now',
        text: review.text
      });
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
      return true;
    } catch (e) {
      return false;
    }
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
    updateCartQuantity,
    getWishlist,
    isInWishlist,
    toggleWishlist,
    updateWishlistBadge,
    getOrders,
    createOrder,
    updateOrderStatus,
    getReviews,
    addReview
  };
})();
